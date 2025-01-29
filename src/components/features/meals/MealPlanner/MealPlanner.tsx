"use client";
// src/components/MealPlanner.tsx
import React, { MouseEvent, useState, useEffect, useMemo } from "react";
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
// Import custom hook
// Import components
import { ServingSelector } from "@/components/features/meals/shared/ServingSelector";
import { MilkToggle } from "@/components/features/meals/shared/MilkToggle";
import { RanchToggle } from "@/components/features/meals/shared/RanchToggle";
import { FoodEditor } from "@/components/features/food/FoodEditor";
import { CompactNutritionProgress } from "@/components/features/nutrition/NutritionSummary/components/CompactNutritionProgress";
import { NutritionSummary } from "@/components/features/nutrition/NutritionSummary";
import { FoodItem } from "@/components/features/meals/shared/FoodItem";
import { MealHistory } from "@/components/features/meals/shared/MealHistory/MealHistory";

// Import types and constants
import {
  Food,
  MealType,
  DayType,
  CategoryType,
  MealHistoryRecord,
  // MealSelection,
} from "@/types/food";
import { DEFAULT_MEAL_PLAN } from "@/constants/meal-goals";
import { Kid } from "@/types/user";
import { ChildView } from "@/components/features/meals/ChildView/ChildView";
import { DAYS_OF_WEEK, MEAL_TYPES } from "@/constants";
import { FoodImageAnalysis } from "../../food/FoodAnalysis/components/FoodImageAnalysis/FoodImageAnalysis";
import { MealAnalysis } from "../MealAnalysis/MealAnalysis";
import { FAB } from "../shared/FAB/FAB";
import { MealPlannerHeader } from "../MealPlannerHeader";
import { useMealPlanState } from "./hooks/useMealPlanState";

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
  // Kids configuration
  const [kids] = useState<Kid[]>([
    { id: "1", name: "Presley" },
    { id: "2", name: "Evy" },
  ]);

  // View state
  const [isChildView, setIsChildView] = useState(false);

  // AI analysis state
  const [showAiAnalysis, setShowAiAnalysis] = useState(false);
  const [showImageAnalysis, setShowImageAnalysis] = useState(false);

  // Food options and context state
  const [foodOptions, setFoodOptions] = useState<Record<CategoryType, Food[]>>({
    proteins: [],
    grains: [],
    fruits: [],
    vegetables: [],
    milk: [],
  });
  const [selectedFoodContext, setSelectedFoodContext] = useState<{
    category: CategoryType;
    food: Food;
    mode: "serving" | "edit" | "add";
    currentServings?: number;
  } | null>({
    // @ts-expect-error Idk what to do
    food: {
      hiddenFromChild: false,
      name: "",
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      servingSize: "1",
      servingSizeUnit: "g",
      category: "proteins",
      meal: [],
    },
  });

  const [showPlateAnalysis, setShowPlateAnalysis] = useState(false);
  const [selectedHistoryEntry, setSelectedHistoryEntry] =
    useState<MealHistoryRecord | null>(null);

  // Use custom hook for meal planning state management
  const {
    selectedKid,
    selectedDay,
    selectedMeal,
    selections,
    mealHistory,
    setSelectedKid,
    setSelectedDay,
    setSelectedMeal,
    handleFoodSelect,
    calculateMealNutrition,
    handleServingAdjustment,
    calculateDailyTotals,
    handleMilkToggle,
    handleRanchToggle,
  } = useMealPlanState(kids);
  // Helper function to get ordered days starting from today
  const getOrderedDays = (): DayType[] => {
    const days: DayType[] = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const today = new Date().getDay();
    return [...days.slice(today), ...days.slice(0, today)];
  };

  // Serving adjustment handler
  const handleServingClick = (
    e: MouseEvent<HTMLDivElement>,
    category: CategoryType,
    food: Food
  ) => {
    e.stopPropagation();
    if (selectedDay && selectedMeal && selectedKid) {
      const currentFood =
        // @ts-expect-error Idk what to do
        selections[selectedKid]?.[selectedDay]?.[selectedMeal]?.[category];
      setSelectedFoodContext({
        category,
        food,
        mode: "serving",
        currentServings: currentFood?.servings || 1,
      });
    }
  };

  const handleEditFood = (category: CategoryType, food: Food) => {
    setSelectedFoodContext({
      category,
      food,
      mode: food ? "edit" : "add",
    });
  };

  // Save food handler
  // In MealPlanner.tsx, modify the handleSaveFood function:

  const handleSaveFood = async (food: Food) => {
    try {
      if (selectedFoodContext?.mode === "add") {
        const response = await fetch("/api/foods", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(food),
        });

        if (response.ok) {
          setFoodOptions((prev) => ({
            ...prev,
            [food.category]: Array.isArray(prev[food.category])
              ? [...prev[food.category], food]
              : [food],
          }));
          setSelectedFoodContext(null);
        }
      } else if (selectedFoodContext?.mode === "edit") {
        const response = await fetch(`/api/foods/${food.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(food),
        });

        if (response.ok) {
          setFoodOptions((prev) => {
            const updated = { ...prev };
            if (Array.isArray(updated[food.category])) {
              updated[food.category] = updated[food.category].map((item) =>
                item.id === food.id ? food : item
              );
            }
            return updated;
          });
          setSelectedFoodContext(null);
        }
      }
    } catch (error) {
      console.error("Error saving food:", error);
    }
  };

  const handleDeleteFood = async (foodId: string) => {
    try {
      const response = await fetch(`/api/foods/${foodId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete food");
      }

      setFoodOptions((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((category) => {
          updated[category] = updated[category].filter(
            (food) => food.id !== foodId
          );
        });
        return updated;
      });
    } catch (error) {
      console.error("Error deleting food:", error);
    }
  };

  // Data loading effect
  // useEffect(() => {
  //   const loadData = async () => {
  //     try {
  //       const [foodsRes] = await Promise.all([fetch("/api/foods")]);
  //       if (!foodsRes.ok) throw new Error("Failed to fetch foods");
  //       const foods = await foodsRes.json();
  //       setFoodOptions(foods);
  //     } catch (error) {
  //       console.error("Error loading data:", error);
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };

  //   loadData();
  // }, []);

  // Use useEffect for initial data fetching
  useEffect(() => {
    const fetchFoods = async () => {
      try {
        const response = await fetch("/api/foods");
        if (response.ok) {
          const data = await response.json();
          setFoodOptions(data);
        }
      } catch (error) {
        console.error("Error fetching foods:", error);
      }
    };

    fetchFoods();
  }, []); // Empty dependency array means this runs once on mount

  const includesMilk = useMemo(() => {
    if (!selectedKid || !selectedDay)
      return {
        breakfast: false,
        lunch: false,
        dinner: false,
        snack: false,
      };

    // @ts-expect-error TypeScript doesn't understand the dynamic keys here
    return MEAL_TYPES.reduce((acc: Record<MealType, boolean>, mealType) => {
      acc[mealType] =
        // @ts-expect-error Idk what to do
        !!selections[selectedKid]?.[selectedDay]?.[mealType]?.milk;
      return acc;
      // @ts-expect-error TypeScript doesn't understand the dynamic keys here
    }, {} as Record<MealType, boolean>);
  }, [selections, selectedKid, selectedDay]);

  const includesRanch = useMemo(() => {
    if (!selectedKid || !selectedDay)
      return {
        breakfast: { has: false, servings: 0 },
        lunch: { has: false, servings: 0 },
        dinner: { has: false, servings: 0 },
        snack: { has: false, servings: 0 },
      };

    return MEAL_TYPES.reduce(
      // @ts-expect-error TODO: fix
      (acc: Record<MealType, { has: boolean; servings: number }>, mealType) => {
        // @ts-expect-error Idk what to do
        const ranch = selections[selectedKid]?.[selectedDay]?.[mealType]?.ranch;
        acc[mealType] = {
          has: !!ranch,
          servings: ranch?.servings || 1,
        };
        return acc;
      }, // @ts-expect-error TODO: fix
      {} as Record<MealType, { has: boolean; servings: number }>
    );
  }, [selections, selectedKid, selectedDay]);

  // src/components/features/meals/MealPlanner/MealPlanner.tsx

  // Add this to the existing component
  // src/components/features/meals/MealPlanner/MealPlanner.tsx

  const handleToggleVisibility = async (food: Food) => {
    const newHiddenState = !food.hiddenFromChild;

    try {
      // Optimistically update UI
      setFoodOptions((prev) => {
        const updated = { ...prev };
        const category = food.category;
        if (!updated[category]) return prev;

        updated[category] = updated[category].map((f) =>
          f.id === food.id ? { ...f, hiddenFromChild: newHiddenState } : f
        );
        return updated;
      });

      // API call to update visibility
      const response = await fetch(`/api/foods/${food.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hiddenFromChild: newHiddenState,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update food visibility");
      }
    } catch (error) {
      console.error("Error updating food visibility:", error);
      // Revert optimistic update on error
      setFoodOptions((prev) => {
        const updated = { ...prev };
        const category = food.category;
        if (!updated[category]) return prev;

        updated[category] = updated[category].map((f) =>
          f.id === food.id ? { ...f, hiddenFromChild: !newHiddenState } : f
        );
        return updated;
      });
    }
  };
  // In MealPlanner.tsx
  const handleToggleAllOtherFoodVisibility = async () => {
    try {
      // Get all "Other" category foods
      const otherFoods = foodOptions.other;

      // Prepare batch update promises
      const updatePromises = otherFoods.map(async (food) => {
        const newHiddenState = !food.hiddenFromChild;

        try {
          const response = await fetch(`/api/foods/${food.id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              hiddenFromChild: newHiddenState,
            }),
          });

          if (!response.ok) {
            throw new Error(`Failed to update food ${food.id}`);
          }

          return { ...food, hiddenFromChild: newHiddenState };
        } catch (error) {
          console.error(`Error updating food ${food.id}:`, error);
          return food;
        }
      });

      // Wait for all updates to complete
      const updatedFoods = await Promise.all(updatePromises);

      // Update local state
      setFoodOptions((prev) => ({
        ...prev,
        other: updatedFoods,
      }));
    } catch (error) {
      console.error("Error toggling all Other foods visibility:", error);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto" data-testid="meal-planner">
      <MealPlannerHeader
        kids={kids}
        // @ts-expect-error TypeScript doesn't understand the dynamic keys here
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
          selections={selections[selectedKid] ?? DEFAULT_MEAL_PLAN}
          selectedDay={selectedDay}
          onFoodSelect={handleFoodSelect}
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
              {MEAL_TYPES.map((meal) => (
                <button
                  key={meal}
                  onClick={() => setSelectedMeal(meal)}
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
                      const currentMealSelections =
                        // @ts-expect-error Idk what to do
                        selections[selectedKid]?.[selectedDay]?.[selectedMeal];
                      if (currentMealSelections) {
                        setShowAiAnalysis(true);
                      }
                    }}
                    disabled={
                      // @ts-expect-error Idk what to do
                      !selections[selectedKid]?.[selectedDay]?.[selectedMeal]
                    }
                  >
                    <MessageSquare className="w-4 h-4" />
                    Analyze Meal Plan
                  </Button>
                </div>

                {/* Nutrition Summary */}
                <NutritionSummary
                  // @ts-expect-error Idk what to do
                  mealNutrition={calculateMealNutrition(selectedMeal)}
                  dailyNutrition={calculateDailyTotals()}
                  selectedMeal={selectedMeal}
                />
                {selectedMeal && selectedMeal !== "snack" && (
                  <div className="mb-6" data-testid="milk-toggle">
                    <MilkToggle
                      isSelected={
                        // @ts-expect-error Idk what to do
                        selectedMeal ? includesMilk[selectedMeal] : false
                      }
                      onChange={(value) =>
                        // @ts-expect-error Idk what to do
                        handleMilkToggle(selectedMeal, value)
                      }
                    />
                  </div>
                )}

                <div className="mb-6">
                  <RanchToggle
                    // @ts-expect-error Idk what to do
                    isSelected={includesRanch[selectedMeal].has}
                    // @ts-expect-error Idk what to do
                    servings={includesRanch[selectedMeal].servings}
                    onChange={(value, servings) =>
                      handleRanchToggle(selectedMeal, value, servings)
                    }
                  />
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
                                const selectedFoodInCategory =
                                  selectedKid && selectedDay && selectedMeal
                                    ? // @ts-expect-error Idk what to do
                                      selections[selectedKid]?.[selectedDay]?.[
                                        selectedMeal
                                      ]?.[category]
                                    : null;
                                const isSelected =
                                  selectedFoodInCategory?.name === food.name;

                                return (
                                  <FoodItem
                                    key={index}
                                    index={index}
                                    food={food}
                                    category={category}
                                    isSelected={isSelected}
                                    selectedFoodInCategory={
                                      selectedFoodInCategory
                                    }
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
              {DAYS_OF_WEEK.map((day) => (
                <Card key={day} className="p-4">
                  <h3 className="text-lg font-semibold capitalize mb-3">
                    {day}
                  </h3>
                  {Object.entries(selections[day] ?? {}).map(([meal]) => {
                    const nutrition = calculateMealNutrition(meal as MealType);
                    // @ts-expect-error Idk what to do
                    if (nutrition.calories > 0) {
                      return (
                        <div key={meal} className="mb-4 p-2 bg-gray-50 rounded">
                          <div className="font-medium capitalize">{meal}</div>
                          <div className="text-sm text-gray-600">
                            {/** @ts-expect-error Idk what to do*/}
                            {Math.round(nutrition.calories)} cal | P:{" "}
                            {/** @ts-expect-error Idk what to do*/}
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
            handleServingAdjustment(selectedFoodContext.category, adjustedFood);
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
          mealSelections={selections[selectedKid][selectedDay][selectedMeal]}
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
          currentCalories={
            selectedMeal
              ? // @ts-expect-error Idk what to do
                calculateMealNutrition(selectedMeal).calories
              : calculateDailyTotals().calories
          }
          currentProtein={calculateDailyTotals().protein}
          currentFat={calculateDailyTotals().fat}
          // @ts-expect-error Idk what to do
          selectedMeal={selectedMeal}
        />
      </div>
    </div>
  );
};
