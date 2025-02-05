"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, MessageSquare, X, Plus, Layers } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ServingSelector } from "@/components/features/meals/shared/ServingSelector";
import { MilkToggle } from "@/components/features/meals/shared/MilkToggle";
import { FoodEditor } from "@/components/features/food/FoodEditor";
import { CompactNutritionProgress } from "@/components/features/nutrition/NutritionSummary/components/CompactNutritionProgress";
import { FoodItem } from "@/components/features/meals/shared/FoodItem";
import { MealHistory } from "@/components/features/meals/shared/MealHistory/MealHistory";
import { useMealStore } from "@/store/useMealStore";
import {
  useCurrentMealSelection,
  useMilkInclusion,
  useDailyNutrition,
  useMealNutrition,
} from "@/store/mealSelectors";
import {
  CategoryType,
  MealType,
  DayType,
  MealHistoryRecord,
} from "@/types/meals";
import { Kid } from "@/types/user";
import { ChildView } from "@/components/features/meals/ChildView/ChildView";
import { MEAL_TYPES } from "@/constants";
import { FoodImageAnalysis } from "../../food/FoodAnalysis/components/FoodImageAnalysis/FoodImageAnalysis";
import { MealAnalysis } from "../MealAnalysis/MealAnalysis";
import { FAB } from "../shared/FAB/FAB";
import { MealPlannerHeader } from "../MealPlannerHeader";
import { produce } from "immer";
import { getOrderedDays } from "@/utils/dateUtils";
//import {  NutritionSummary as NutritionSummaryType } from "@/types/food";
import { Food } from "@/types/food";
import { NutritionSummary } from "@/components/features/nutrition/NutritionSummary/NutritionSummary";
import {
  createEmptyMealSelection,
  nutritionToMealSelection,
} from "@/utils/nutritionUtils";
import { DAYS_OF_WEEK } from "@/constants/index";
import { isCategoryKey } from "@/utils/meal-categories";

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
  const [foodOptions, setFoodOptions] = useState<Record<CategoryType, Food[]>>({
    proteins: [],
    grains: [],
    fruits: [],
    vegetables: [],
    milk: [],
    condiments: [],
    ranch: [],
    other: [],
  });

  // Initialize kids in store
  useEffect(() => {
    initializeKids(kids);
  }, [kids, initializeKids]);

  // Food context handling
  const [selectedFoodContext, setSelectedFoodContext] = useState<{
    category: CategoryType;
    food: Food;
    mode: "serving" | "edit" | "add";
    currentServings?: number;
  } | null>(null);

  const handleServingClick = (
    e: React.MouseEvent<HTMLDivElement>,
    category: CategoryType,
    food: Food
  ) => {
    e.stopPropagation();
    if (!selectedKid || !selectedDay || !selectedMeal) return;

    const currentFood = currentMealSelection
      ? category === "condiments"
        ? currentMealSelection.condiments.find((c) => c.id === food.id)
        : currentMealSelection[category]
      : null;

    setSelectedFoodContext({
      category,
      food,
      mode: "serving",
      currentServings: currentFood?.servings || 1,
    });
  };

  const handleEditFood = (category: CategoryType, food: Food) => {
    setSelectedFoodContext({
      category,
      food,
      mode: "edit",
    });
  };

  // Food visibility handling
  const handleToggleVisibility = async (food: Food) => {
    const newHiddenState = !food.hiddenFromChild;

    try {
      setFoodOptions(
        produce((draft) => {
          if (!isCategoryKey(food.category)) return;

          draft[food.category] = draft[food.category].map((f) =>
            f.id === food.id ? { ...f, hiddenFromChild: newHiddenState } : f
          );
        })
      );

      const response = await fetch(`/api/foods/${food.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hiddenFromChild: newHiddenState }),
      });

      if (!response.ok) {
        throw new Error("Failed to update food visibility");
      }
    } catch (error) {
      console.error("Error updating food visibility:", error);
      // Revert on error
      setFoodOptions(
        produce((draft) => {
          if (!isCategoryKey(food.category)) return;

          draft[food.category] = draft[food.category].map((f) =>
            f.id === food.id ? { ...f, hiddenFromChild: !newHiddenState } : f
          );
        })
      );
    }
  };

  // Weekly view calculations
  // const calculateWeeklyTotals = () => {
  //   if (!selectedKid) return null;
  //   return DAYS_OF_WEEK.reduce((acc, day) => {
  //     const dayTotals = MEAL_TYPES.reduce(
  //       (mealAcc, meal) => {
  //         const nutrition = calculateMealNutrition(meal);
  //         return {
  //           calories: mealAcc.calories + nutrition.calories,
  //           protein: mealAcc.protein + nutrition.protein,
  //           carbs: mealAcc.carbs + nutrition.carbs,
  //           fat: mealAcc.fat + nutrition.fat,
  //         };
  //       },
  //       { calories: 0, protein: 0, carbs: 0, fat: 0 }
  //     );

  //     acc[day] = dayTotals;
  //     return acc;
  //   }, {} as Record<string, NutritionSummaryType>);
  // };

  const handleToggleAllOtherFoodVisibility = () => {
    setFoodOptions(
      produce((draft) => {
        if (draft.other) {
          const allHidden = draft.other.every((f) => f.hiddenFromChild);
          draft.other = draft.other.map((f) => ({
            ...f,
            hiddenFromChild: !allHidden,
          }));
        }
      })
    );
  };

  const fetchFoodOptions = async () => {
    try {
      const response = await fetch("/api/foods");
      if (!response.ok) throw new Error("Failed to fetch foods");
      const data = await response.json();

      // Since data is always pre-grouped, directly set it as food options
      // Just ensure the categories are valid
      const validGroupedData = Object.entries(data).reduce(
        (acc, [category, foods]) => {
          if (isCategoryKey(category)) {
            acc[category] = Array.isArray(foods) ? foods : [];
          }
          return acc;
        },
        {} as Record<CategoryType, Food[]>
      );

      setFoodOptions(validGroupedData);
    } catch (error) {
      console.error("Error fetching food options:", error);
    }
  };

  useEffect(() => {
    fetchFoodOptions();
  }, []);

  const handleSaveFood = async (food: Food) => {
    try {
      const response = await fetch("/api/foods", {
        method: food.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(food),
      });
      if (!response.ok) throw new Error("Failed to save food");
      setSelectedFoodContext(null);
      // Refresh food options after save
      await fetchFoodOptions();
    } catch (error) {
      console.error("Error saving food:", error);
    }
  };

  const handleDeleteFood = async (foodId: string) => {
    try {
      const response = await fetch(`/api/foods/${foodId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete food");
      setSelectedFoodContext(null);
      await fetchFoodOptions();
    } catch (error) {
      console.error("Error deleting food:", error);
    }
  };

  useEffect(() => {
    const currentDay = DAYS_OF_WEEK[new Date().getDay()] as DayType;
    setSelectedDay(currentDay);
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto" data-testid="meal-planner">
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
        <ChildView
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
      ) : (
        <Tabs defaultValue="planner" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="planner">Daily Planner</TabsTrigger>
            <TabsTrigger value="weekly">Weekly View</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="planner">
            {/* Day Selection */}
            <div className="flex space-x-2 overflow-x-auto pb-2 mb-4">
              {getOrderedDays().map((day, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedDay(day as DayType)}
                  className={`px-4 py-2 rounded-lg capitalize ${
                    selectedDay === day
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100"
                  }`}
                >
                  {day as string}
                </button>
              ))}
            </div>

            {/* Meal Selection */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {(MEAL_TYPES as readonly MealType[]).map((meal) => (
                <button
                  key={meal}
                  onClick={() => setSelectedMeal(meal)}
                  data-testid={`${meal}-meal-button`}
                  className={`p-4 rounded-lg text-lg capitalize ${
                    selectedMeal === meal
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  {meal}
                </button>
              ))}
            </div>

            {!isChildView && (
              <>
                {/* AI Analysis Buttons */}
                <div className="mb-4 flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => setShowImageAnalysis(true)}
                  >
                    <Camera className="w-4 h-4" />
                    Analyze Plate Photo
                  </Button>

                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => {
                      if (currentMealSelection) {
                        setShowAiAnalysis(true);
                      }
                    }}
                    // disabled={!currentMealSelection}
                  >
                    <MessageSquare className="w-4 h-4" />
                    Analyze Meal Plan
                  </Button>
                </div>

                {/* Nutrition Summary */}
                <NutritionSummary
                  mealSelections={
                    currentMealSelection || createEmptyMealSelection()
                  }
                  dailySelections={nutritionToMealSelection(dailyNutrition)}
                  selectedMeal={selectedMeal}
                />
                <div className="mb-6">
                  {!isChildView && selectedMeal && (
                    <>
                      {/* Milk toggle remains the same */}
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

                {/* Food Selection Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-14">
                  <FAB
                    icon={Plus}
                    onClick={() =>
                      setSelectedFoodContext({
                        mode: "add",
                        category: "proteins",
                        food: {} as Food,
                      })
                    }
                    className="z-40 mb-16" // Add margin to avoid overlap with nutrition bar
                  />

                  {(
                    Object.entries(foodOptions) as [CategoryType, Food[]][]
                  ).map(([category, foods]) => {
                    const compatibleFoods = selectedMeal
                      ? foods.filter((food) =>
                          food.meal?.includes(selectedMeal)
                        )
                      : foods;

                    if (compatibleFoods.length === 0) return null;
                    return (
                      <Card key={category}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center mb-3">
                            <h3 className="text-lg font-semibold capitalize">
                              {category}
                            </h3>
                            {category === "other" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleToggleAllOtherFoodVisibility}
                                title="Toggle visibility for all 'Other' foods"
                              >
                                <Layers className="h-4 w-4 text-gray-500" />
                              </Button>
                            )}
                          </div>
                          {compatibleFoods.length === 0 ? (
                            <div className="text-center text-gray-500 py-4">
                              <span>No food options available</span>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {compatibleFoods.map((food, index) => {
                                const currentMealSelections =
                                  selectedKid && selectedDay && selectedMeal
                                    ? selections[selectedKid]?.[selectedDay]?.[
                                        selectedMeal
                                      ]
                                    : null;

                                const selectedFoodInCategory =
                                  category === "condiments"
                                    ? currentMealSelections?.condiments?.find(
                                        (c) => c.id === food.id
                                      )
                                    : currentMealSelections?.[category];

                                const isSelected =
                                  category === "condiments"
                                    ? !!selectedFoodInCategory
                                    : selectedFoodInCategory?.id === food.id;

                                // Debug selection state
                                console.log("Selection state for food:", {
                                  foodName: food.name,
                                  category,
                                  currentMealSelections,
                                  selectedFoodInCategory,
                                  isSelected,
                                });

                                return (
                                  <FoodItem
                                    key={index}
                                    index={index}
                                    food={food}
                                    category={category}
                                    isSelected={isSelected}
                                    selectedFoodInCategory={
                                      selectedFoodInCategory ?? null
                                    }
                                    mealType={selectedMeal}
                                    onSelect={() =>
                                      handleFoodSelect(category, food)
                                    }
                                    onServingClick={(e) =>
                                      handleServingClick(e, category, food)
                                    }
                                    onEditFood={() =>
                                      handleEditFood(category, food)
                                    }
                                    isHidden={food.hiddenFromChild || false}
                                    onToggleVisibility={() =>
                                      handleToggleVisibility(food)
                                    }
                                    showVisibilityControls={!isChildView}
                                    isChildView={isChildView}
                                  />
                                );
                              })}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                  {/* Add a global check for completely empty foodOptions */}
                  {Object.values(foodOptions).every(
                    (categoryFoods) => categoryFoods.length === 0
                  ) && (
                    <div className="text-center text-gray-500 py-12">
                      <p className="text-xl mb-4">No food options available</p>
                      <p>Please add some foods to get started</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="weekly">
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              {DAYS_OF_WEEK.map((day: DayType) => (
                <Card key={day} className="p-4">
                  <h3 className="text-lg font-semibold capitalize mb-3">
                    {day}
                  </h3>
                  {Object.entries(selections[day] ?? {}).map(([meal]) => {
                    const nutrition = calculateMealNutrition(meal as MealType);
                    if (nutrition.calories > 0) {
                      return (
                        <div key={meal} className="mb-4 p-2 bg-gray-50 rounded">
                          <div className="font-medium capitalize">{meal}</div>
                          <div className="text-sm text-gray-600">
                            {Math.round(nutrition.calories)} cal | P:{" "}
                            {Math.round(nutrition.protein)}g
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })}
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="history">
            {selectedKid ? (
              <div className="space-y-4">
                {/* Optional loading state */}
                {!mealHistory[selectedKid] ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2 text-gray-600">
                      Loading meal history...
                    </p>
                  </div>
                ) : mealHistory[selectedKid].length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    No meal history available
                  </div>
                ) : (
                  <MealHistory historyEntries={mealHistory[selectedKid]} />
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                Please select a kid to view their meal history
              </div>
            )}
          </TabsContent>

          {/* Add the plate analysis dialog */}
          <AlertDialog
            open={showPlateAnalysis}
            onOpenChange={setShowPlateAnalysis}
          >
            <AlertDialogContent className="max-w-xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Analyze Plate Photo</AlertDialogTitle>
              </AlertDialogHeader>

              <FoodImageAnalysis
                onAnalysisComplete={async (analysis) => {
                  if (selectedHistoryEntry) {
                    try {
                      // Update the meal history with consumption data
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

                      // Refresh meal history data
                      // You'll need to implement this based on your data fetching strategy

                      setShowPlateAnalysis(false);
                      setSelectedHistoryEntry(null);
                    } catch (error) {
                      console.error("Failed to update meal history:", error);
                    }
                  }
                }}
              />
            </AlertDialogContent>
          </AlertDialog>
        </Tabs>
      )}

      {/* ServingSelector Modal */}
      {selectedFoodContext?.mode === "serving" && (
        <ServingSelector
          food={selectedFoodContext.food}
          currentServings={selectedFoodContext.currentServings}
          onConfirm={(adjustedFood) => {
            handleServingAdjustment(
              selectedFoodContext.category,
              adjustedFood.id,
              adjustedFood.servings
            );
            setSelectedFoodContext(null);
          }}
          onCancel={() => setSelectedFoodContext(null)}
        />
      )}

      {/* FoodEditor Modal */}
      {(selectedFoodContext?.mode === "edit" ||
        selectedFoodContext?.mode === "add") && (
        <FoodEditor
          onSave={handleSaveFood}
          onCancel={() => setSelectedFoodContext(null)}
          onDelete={handleDeleteFood}
          initialFood={selectedFoodContext.food}
        />
      )}

      {/* AI Analysis Dialogs */}
      {/* <AnalysisDialog isOpen={showAiAnalysis} onOpenChange={setShowAiAnalysis}> */}
      {selectedKid && selectedDay && selectedMeal && (
        <MealAnalysis
          selectedMeal={selectedMeal}
          // @ts-expect-error Idk what to do
          mealSelections={currentMealSelection}
          onAnalysisComplete={(analysis) => {
            console.log("Meal analysis completed:", analysis);
          }}
          isOpen={showAiAnalysis}
          onClose={() => setShowAiAnalysis(false)}
        />
      )}
      {/* </AnalysisDialog> */}

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
          <FoodImageAnalysis
            onAnalysisComplete={(analysis) => {
              console.log("Analysis completed:", analysis);
            }}
          />
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
    </div>
  );
};
