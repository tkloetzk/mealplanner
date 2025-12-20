"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ServingSelector } from "@/components/features/meals/shared/ServingSelector";
import { MilkToggle } from "@/components/features/meals/shared/MilkToggle";
import { CompactNutritionProgress } from "@/components/features/nutrition/NutritionSummary/components/CompactNutritionProgress";
import { useMealStore } from "@/store/useMealStore";
import {
  useCurrentMealSelection,
  useMilkInclusion,
  useDailyNutrition,
  useMealNutrition,
} from "@/store/mealSelectors";
import { MealHistoryRecord } from "@/types/meals";
import { CategoryType } from "@/types/shared";
import { Kid } from "@/types/user";
import { MealPlannerHeader } from "../MealPlannerHeader";
import { getCurrentDay, calculateTargetDate } from "@/utils/dateUtils";
import { Food } from "@/types/food";
import { NutritionSummary } from "@/components/features/nutrition/NutritionSummary/NutritionSummary";
import { isCategoryKey } from "@/utils/meal-categories";
import { useFoodManagement } from "./hooks/useFoodManagement";
import { useMealHistory } from "./hooks/useMealHistory";

// Import smaller components
import { DaySelector } from "./components/DaySelector";
import { MealSelector } from "./components/MealSelector";
import { AnalysisButtons } from "./components/AnalysisButtons";
import { FoodGrid } from "./components/FoodGrid";
import { WeeklyView } from "./components/WeeklyView";
import { HistoryView } from "./components/HistoryView";

// Dynamic imports for heavy components
import {
  LazyFoodImageAnalysis,
  LazyMealAnalysis,
  LazyFoodEditor,
  LazyMealEditor,
  LazyChildView,
  ComponentLoader,
} from "./components/LazyComponents";

interface AnalysisDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

function AnalysisDialog({
  isOpen,
  onOpenChange,
  children,
}: AnalysisDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-xl">
        <div className="flex justify-between items-start mb-4">
          <AlertDialogHeader>
            <AlertDialogTitle>Plate Photo Analysis</AlertDialogTitle>
          </AlertDialogHeader>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full h-8 w-8 p-0"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>
        {children}
      </AlertDialogContent>
    </AlertDialog>
  );
}

export const MealPlanner = () => {
  // Initialize Zustand store
  const {
    selectedKid,
    selectedDay,
    selectedMeal,
    selections,
    setSelectedKid,
    setSelectedDay,
    setSelectedMeal,
    handleFoodSelect,
    handleServingAdjustment,
    handleMilkToggle,
    initializeKids,
    calculateMealNutrition,
    mealHistory,
    loadSelectionsFromHistory,
  } = useMealStore();

  const currentMealSelection = useCurrentMealSelection();
  const milkInclusion = useMilkInclusion();
  const dailyNutrition = useDailyNutrition();
  const mealNutrition = useMealNutrition(selectedMeal);

  // Local state
  const [kids] = useState<Kid[]>([
    { id: "1", name: "Presley" },
    { id: "2", name: "Evy" },
  ]);
  const [isChildView, setIsChildView] = useState(false);
  const [showAiAnalysis, setShowAiAnalysis] = useState(false);
  const [showImageAnalysis, setShowImageAnalysis] = useState(false);
  const [showPlateAnalysis, setShowPlateAnalysis] = useState(false);
  const [selectedHistoryEntry, setSelectedHistoryEntry] =
    useState<MealHistoryRecord | null>(null);
  const [showMealEditor, setShowMealEditor] = useState(false);

  // Custom hooks
  const {
    foodOptions,
    selectedFoodContext,
    setSelectedFoodContext,
    fetchFoodOptions,
    handleToggleVisibility,
    handleToggleAllOtherFoodVisibility,
    handleSaveFood,
    handleDeleteFood,
  } = useFoodManagement();

  const { isLoading, fetchMealHistory, handleSaveMeal } = useMealHistory();

  // Initialize kids in store
  useEffect(() => {
    initializeKids(kids);
  }, [initializeKids, kids]);

  // Load selections from history when component mounts or when selected day/kid changes
  useEffect(() => {
    if (!selectedKid || !selectedDay) return;

    const loadSelections = async () => {
      try {
        // Calculate target date for the selected day
        const targetDate = calculateTargetDate(selectedDay);

        // Load selections from history
        await loadSelectionsFromHistory({
          kidId: selectedKid,
          date: targetDate,
        });
      } catch (error) {
        console.error("Error loading selections:", error);
      }
    };

    loadSelections();
  }, [selectedKid, selectedDay, loadSelectionsFromHistory]);

  const handleServingClick = useCallback(
    (category: CategoryType, food: Food) => {
      if (!selectedKid || !selectedDay || !selectedMeal) return;

      const currentFood = currentMealSelection
        ? category === "condiments"
          ? currentMealSelection.condiments.find((c: Food) => c.id === food.id)
          : currentMealSelection[
              category as Exclude<CategoryType, "condiments">
            ]
        : null;

      setSelectedFoodContext({
        category,
        food,
        mode: "serving",
        currentServings: currentFood?.servings || 1,
      });
    },
    [
      selectedKid,
      selectedDay,
      selectedMeal,
      currentMealSelection,
      setSelectedFoodContext,
    ]
  );

  const handleEditFood = useCallback(
    (category: CategoryType, food: Food) => {
      setSelectedFoodContext({
        category,
        food,
        mode: "edit",
      });
    },
    [setSelectedFoodContext]
  );

  useEffect(() => {
    fetchFoodOptions();
  }, [fetchFoodOptions]);

  useEffect(() => {
    const currentDay = getCurrentDay();
    setSelectedDay(currentDay);
  }, [setSelectedDay]);

  // Fetch meal history when kid is selected
  useEffect(() => {
    if (selectedKid) {
      fetchMealHistory(selectedKid);
    }
  }, [selectedKid, fetchMealHistory]);

  const handleAddMeal = useCallback(() => {
    setShowMealEditor(true);
  }, []);

  return (
    <div className="container mx-auto p-4" data-testid="meal-planner">
      <MealPlannerHeader
        kids={kids}
        selectedKid={selectedKid}
        onKidSelect={setSelectedKid}
        isChildView={isChildView}
        onViewToggle={setIsChildView}
      />

      {!selectedKid ? (
        <div className="text-center py-12 text-gray-500">
          Please select a kid to start planning meals
        </div>
      ) : isChildView ? (
        <Suspense fallback={<ComponentLoader />}>
          <LazyChildView
            selectedMeal={selectedMeal}
            foodOptions={foodOptions}
            selections={selections[selectedKid]}
            selectedDay={selectedDay}
            onFoodSelect={(category, food) => {
              if (isCategoryKey(category)) {
                handleFoodSelect(category, food);
              }
            }}
            onMealSelect={setSelectedMeal}
          />
        </Suspense>
      ) : (
        <Tabs defaultValue="planner" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="planner">Daily Planner</TabsTrigger>
            <TabsTrigger value="weekly">Weekly View</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="planner">
            <DaySelector
              selectedDay={selectedDay}
              onDaySelect={setSelectedDay}
            />

            <MealSelector
              selectedMeal={selectedMeal}
              onMealSelect={setSelectedMeal}
            />

            {!isChildView && (
              <>
                <AnalysisButtons
                  selectedMeal={selectedMeal}
                  currentMealSelection={currentMealSelection}
                  onImageAnalysis={() => setShowImageAnalysis(true)}
                  onMealAnalysis={() => {
                    console.log("Analyze button clicked", {
                      selectedKid,
                      selectedDay,
                      selectedMeal,
                      currentMealSelection,
                      showAiAnalysis,
                    });
                    setShowAiAnalysis(true);
                  }}
                />

                <NutritionSummary selectedMeal={selectedMeal} />
                <div className="mb-6">
                  {!isChildView && selectedMeal && (
                    <>
                      {selectedMeal !== "snack" && (
                        <div className="mb-6" data-testid="milk-toggle">
                          <MilkToggle
                            isSelected={
                              selectedMeal ? milkInclusion[selectedMeal] : false
                            }
                            onChange={(value) =>
                              handleMilkToggle(selectedMeal!, value)
                            }
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>

                <FoodGrid
                  foodOptions={foodOptions}
                  selectedMeal={selectedMeal}
                  selectedKid={selectedKid}
                  selectedDay={selectedDay}
                  currentMealSelection={
                    selections[selectedKid]?.[selectedDay]?.[selectedMeal!] ||
                    null
                  }
                  onFoodSelect={handleFoodSelect}
                  onServingClick={handleServingClick}
                  onEditFood={handleEditFood}
                  onToggleVisibility={handleToggleVisibility}
                  onToggleAllOtherFoodVisibility={
                    handleToggleAllOtherFoodVisibility
                  }
                  onAddFood={() =>
                    setSelectedFoodContext({
                      mode: "add",
                      category: "proteins",
                      food: {} as Food,
                    })
                  }
                  onAddMeal={handleAddMeal}
                  setSelectedFoodContext={setSelectedFoodContext}
                />
              </>
            )}
          </TabsContent>

          <TabsContent value="weekly">
            <WeeklyView
              selections={selections}
              calculateMealNutrition={calculateMealNutrition}
            />
          </TabsContent>

          <TabsContent value="history">
            <HistoryView
              selectedKid={selectedKid}
              isLoading={isLoading}
              mealHistory={mealHistory}
            />
          </TabsContent>

          <AlertDialog
            open={showPlateAnalysis}
            onOpenChange={setShowPlateAnalysis}
          >
            <AlertDialogContent className="max-w-xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Analyze Plate Photo</AlertDialogTitle>
              </AlertDialogHeader>

              <Suspense fallback={<ComponentLoader />}>
                <LazyFoodImageAnalysis
                  onAnalysisComplete={async (analysis) => {
                    if (selectedHistoryEntry) {
                      try {
                        await fetch(
                          `/api/meal-history/${selectedHistoryEntry._id}`,
                          {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              consumptionData: analysis,
                            }),
                          }
                        );

                        setShowPlateAnalysis(false);
                        setSelectedHistoryEntry(null);
                      } catch (error) {
                        console.error("Failed to update meal history:", error);
                      }
                    }
                  }}
                />
              </Suspense>
            </AlertDialogContent>
          </AlertDialog>
        </Tabs>
      )}

      {/* ServingSelector Modal */}
      {selectedFoodContext?.mode === "serving" && (
        <AlertDialog
          open={true}
          onOpenChange={() => setSelectedFoodContext(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Adjust Servings</AlertDialogTitle>
            </AlertDialogHeader>
            <ServingSelector
              food={selectedFoodContext.food}
              currentServings={selectedFoodContext.currentServings ?? 1}
              onConfirm={(adjustedFood) => {
                handleServingAdjustment(
                  selectedFoodContext.category,
                  adjustedFood.id,
                  adjustedFood.servings
                );
                setSelectedFoodContext(null);
              }}
              onCancel={() => setSelectedFoodContext(null)}
              compact={false}
            />
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* FoodEditor Modal */}
      {(selectedFoodContext?.mode === "edit" ||
        selectedFoodContext?.mode === "add") && (
        <Suspense fallback={<ComponentLoader />}>
          <LazyFoodEditor
            onSave={handleSaveFood}
            onCancel={() => setSelectedFoodContext(null)}
            onDelete={handleDeleteFood}
            initialFood={selectedFoodContext.food}
          />
        </Suspense>
      )}

      {/* AI Analysis Dialogs */}
      {selectedKid && selectedDay && selectedMeal && currentMealSelection && (
        <Suspense fallback={<ComponentLoader />}>
          <LazyMealAnalysis
            selectedMeal={selectedMeal}
            mealSelections={currentMealSelection}
            onAnalysisComplete={(analysis) => {
              console.log("Meal analysis completed:", analysis);
            }}
            isOpen={showAiAnalysis}
            onClose={() => setShowAiAnalysis(false)}
          />
        </Suspense>
      )}

      {/* Food Image Analysis Dialog */}
      <AnalysisDialog
        isOpen={showImageAnalysis}
        onOpenChange={setShowImageAnalysis}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Take a photo of a prepared meal to get nutritional insights and
            recommendations.
          </p>
          <Suspense fallback={<ComponentLoader />}>
            <LazyFoodImageAnalysis
              onAnalysisComplete={(analysis) => {
                console.log("Analysis completed:", analysis);
              }}
            />
          </Suspense>
        </div>
      </AnalysisDialog>

      {/* Nutrition Progress Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <CompactNutritionProgress
          currentCalories={currentMealSelection ? mealNutrition.calories : 0}
          currentProtein={dailyNutrition.protein}
          currentFat={dailyNutrition.fat}
          selectedMeal={selectedMeal}
        />
      </div>

      {/* Add MealEditor */}
      {showMealEditor && (
        <Suspense fallback={<ComponentLoader />}>
          <LazyMealEditor
            isOpen={showMealEditor}
            onClose={() => {
              setShowMealEditor(false);
            }}
            onSave={async (name, selections) => {
              try {
                await handleSaveMeal(
                  name,
                  selections,
                  selectedMeal,
                  selectedKid
                );
                setShowMealEditor(false);
              } catch (error) {
                console.error("Failed to save meal:", error);
              }
            }}
            mealType={selectedMeal || undefined}
          />
        </Suspense>
      )}
    </div>
  );
};
