"use client";
// src/components/MealPlanner.tsx
import React, { MouseEvent, useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, Plus } from "lucide-react";

// Import custom hook
import { useMealPlanState } from "@/hooks/useMealPlanState";

// Import components
import { ServingSelector } from "./ServingSelector";
import { ViewToggle } from "./ViewToggle";
import { MilkToggle } from "./MilkToggle";
import { FoodEditor } from "./FoodEditor/FoodEditor";
import { CompactNutritionProgress } from "./CompactNutritionProgress";
import { KidSelector } from "./KidSelector";
import { RanchToggle } from "./RanchToggle";
import { NutritionSummary } from "./NutritionSummary";
import FoodItem from "./FoodItem";

// Import types and constants
import {
  Food,
  SelectedFood,
  MealType,
  DayType,
  CategoryType,
  // MealSelection,
} from "@/types/food";
import {
  DAYS_OF_WEEK,
  DEFAULT_MEAL_PLAN,
  MEAL_TYPES,
} from "@/constants/meal-goals";
import { Kid } from "@/types/user";
import { ChildView } from "./ChildView";

export function MealPlanner() {
  // State for food options and loading
  const [isLoading, setIsLoading] = useState(true);
  const [foodOptions, setFoodOptions] = useState<Record<CategoryType, Food[]>>({
    grains: [],
    fruits: [],
    proteins: [],
    vegetables: [],
    milk: [],
  });

  // Kids configuration
  const [kids] = useState<Kid[]>([
    { id: "1", name: "Presley" },
    { id: "2", name: "Evy" },
  ]);

  // Use the custom hook for state management
  const {
    selectedKid,
    selectedDay,
    selectedMeal,
    selections,
    mealHistory,
    setSelectedKid,
    setSelectedDay,
    setSelectedMeal,
    setSelections,
    handleFoodSelect,
    calculateMealNutrition,
    handleServingAdjustment,
    calculateDailyTotals,
    handleMilkToggle, // Add this
    handleRanchToggle, // Add this
    // addToMealHistory,
  } = useMealPlanState(kids);

  // Additional local states
  const [isChildView, setIsChildView] = useState(false);
  const [showFoodEditor, setShowFoodEditor] = useState(false);
  const [selectedFood, setSelectedFood] = useState<{
    category: CategoryType;
    food: Food;
    currentServings: number;
  } | null>(null);

  // Data loading effect
  useEffect(() => {
    const loadData = async () => {
      try {
        const [foodsRes] = await Promise.all([fetch("/api/foods")]);

        if (!foodsRes.ok) throw new Error("Failed to fetch foods");

        const foods = await foodsRes.json();
        setFoodOptions(foods);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Serving adjustment handler
  const handleServingClick = (
    e: MouseEvent<HTMLDivElement>,
    category: CategoryType,
    food: Food
  ) => {
    e.stopPropagation(); // Prevents event from bubbling up
    if (selectedDay && selectedMeal && selectedKid) {
      const currentFood =
        selections[selectedKid]?.[selectedDay]?.[selectedMeal]?.[category];
      setSelectedFood({
        category,
        food,
        currentServings: currentFood?.servings || 1,
      });
    }
  };

  // Save food handler
  const handleSaveFood = async (food: Food) => {
    try {
      const response = await fetch("/api/foods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(food),
      });

      if (response.ok) {
        // Optionally update local food options
        setFoodOptions((prev) => ({
          ...prev,
          [food.category]: [...prev[food.category], food],
        }));
        setShowFoodEditor(false);
      }
    } catch (error) {
      console.error("Error saving food:", error);
    }
  };

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

    // Reorder the days array to start from the current day
    return [...days.slice(today), ...days.slice(0, today)] as DayType[];
  };

  const getMealSuggestion = useMemo(() => {
    if (!selectedMeal) return null;

    const nutrition = calculateMealNutrition(selectedMeal);
    const target = {
      breakfast: 400,
      lunch: 400,
      dinner: 400,
      snack: 200,
    }[selectedMeal];

    // Define a type for the suggestion
    type MealSuggestion = {
      type: "info" | "warning" | "success";
      message: string;
    };

    let suggestion: MealSuggestion | null = null;

    if (nutrition.calories === 0) {
      suggestion = {
        type: "info",
        message:
          "Start building your meal! Aim for a balance of proteins, grains, fruits, and vegetables.",
      };
    } else if (nutrition.calories === target) {
      suggestion = {
        type: "success",
        message: `Perfect! This is a well-balanced meal within the target range of ${target}.`,
      };
    } else if (nutrition.calories > target + 100) {
      suggestion = {
        type: "warning",
        message:
          "You're significantly over the target calories. Consider removing a high-calorie item.",
      };
    } else {
      suggestion = {
        type: "info",
        message: `You have room for ${
          target - nutrition.calories
        } more calories.`,
      };
    }

    return suggestion;
  }, [selectedMeal, calculateMealNutrition]);

  const includesMilk = useMemo(() => {
    if (!selectedKid || !selectedDay)
      return {
        breakfast: false,
        lunch: false,
        dinner: false,
        snack: false,
      };

    return MEAL_TYPES.reduce((acc, mealType) => {
      acc[mealType] =
        !!selections[selectedKid]?.[selectedDay]?.[mealType]?.milk;
      return acc;
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

    return MEAL_TYPES.reduce((acc, mealType) => {
      const ranch = selections[selectedKid]?.[selectedDay]?.[mealType]?.ranch;
      acc[mealType] = {
        has: !!ranch,
        servings: ranch?.servings || 0,
      };
      return acc;
    }, {} as Record<MealType, { has: boolean; servings: number }>);
  }, [selections, selectedKid, selectedDay]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Meal Planner</h1>
        <ViewToggle isChildView={isChildView} onToggle={setIsChildView} />
      </div>

      <KidSelector
        kids={kids}
        selectedKid={selectedKid}
        onSelect={setSelectedKid}
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
              {getOrderedDays().map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`px-4 py-2 rounded-lg capitalize ${
                    selectedDay === day
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100"
                  }`}
                >
                  {day}
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
            {selectedFood && (
              <ServingSelector
                food={selectedFood.food}
                currentServings={
                  // Safe navigation with explicit type handling
                  selectedKid &&
                  selectedDay &&
                  selectedMeal &&
                  selections[selectedKid]?.[selectedDay]?.[selectedMeal]
                    ? (
                        selections[selectedKid][selectedDay][selectedMeal][
                          selectedFood.category
                        ] as SelectedFood
                      )?.servings ?? 1
                    : 1
                }
                onConfirm={(adjustedFood) => {
                  handleServingAdjustment(selectedFood.category, adjustedFood);
                  setSelectedFood(null);
                }}
                onCancel={() => setSelectedFood(null)}
              />
            )}
            {selectedMeal && (
              <>
                {/* Nutrition Summary */}
                <NutritionSummary
                  mealNutrition={calculateMealNutrition(selectedMeal)}
                  dailyNutrition={calculateDailyTotals()}
                  selectedMeal={selectedMeal}
                />

                {/* Meal Suggestion */}
                {getMealSuggestion && (
                  <div
                    className={`mb-6 p-4 rounded-lg border ${
                      getMealSuggestion.type === "warning"
                        ? "bg-yellow-50 border-yellow-200 text-yellow-800"
                        : getMealSuggestion.type === "success"
                        ? "bg-green-50 border-green-200 text-green-800"
                        : "bg-blue-50 border-blue-200 text-blue-800"
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      <MessageCircle className="w-5 h-5 mt-0.5" />
                      <p>{getMealSuggestion.message}</p>
                    </div>
                  </div>
                )}

                {selectedMeal && selectedMeal !== "snack" && (
                  <div className="mb-6">
                    <MilkToggle
                      isSelected={includesMilk[selectedMeal]}
                      onChange={(value) =>
                        handleMilkToggle(selectedMeal, value)
                      }
                    />
                  </div>
                )}
                {selectedMeal && (
                  <div className="mb-6">
                    <RanchToggle
                      isSelected={includesRanch[selectedMeal].has}
                      servings={includesRanch[selectedMeal].servings}
                      onChange={(value, servings) =>
                        handleRanchToggle(selectedMeal, value, servings)
                      }
                    />
                  </div>
                )}
                <div className="fixed right-4 bottom-20 z-50">
                  <Button
                    onClick={() => setShowFoodEditor(true)}
                    className="rounded-full h-12 w-12 shadow-lg bg-blue-500 hover:bg-blue-600 flex items-center justify-center"
                  >
                    <Plus className="h-6 w-6" />
                  </Button>
                </div>
                {showFoodEditor && (
                  <FoodEditor
                    onSave={handleSaveFood}
                    onCancel={() => setShowFoodEditor(false)}
                  />
                )}
                {/* Food Selection Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-14">
                  {(
                    Object.entries(foodOptions) as [CategoryType, Food[]][]
                  ).map(([category, foods]) => {
                    // Filter foods based on the selected meal
                    const compatibleFoods = selectedMeal
                      ? foods.filter((food) =>
                          food.meal?.includes(selectedMeal)
                        )
                      : foods;

                    // Only render the category if it has compatible foods
                    if (compatibleFoods.length === 0) {
                      return null;
                    }

                    return (
                      <Card key={category}>
                        <CardContent className="p-4">
                          <h3 className="text-lg font-semibold capitalize mb-3">
                            {category}
                          </h3>
                          <div className="space-y-2">
                            {compatibleFoods.map((food) => {
                              const selectedFoodInCategory =
                                selectedKid && selectedDay && selectedMeal
                                  ? selections[selectedKid]?.[selectedDay]?.[
                                      selectedMeal
                                    ]?.[category]
                                  : null;
                              const isSelected =
                                selectedFoodInCategory?.name === food.name;

                              return (
                                <FoodItem
                                  key={food.name}
                                  food={food}
                                  isSelected={isSelected}
                                  selectedFoodInCategory={
                                    selectedFoodInCategory
                                  }
                                  onSelect={() =>
                                    handleFoodSelect(category, food)
                                  }
                                  onServingClick={(
                                    e: MouseEvent<HTMLDivElement>
                                  ) => {
                                    e.stopPropagation();
                                    handleServingClick(e, category, food);
                                  }}
                                />
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
                  <CompactNutritionProgress
                    currentCalories={
                      selectedMeal
                        ? calculateMealNutrition(selectedMeal).calories
                        : calculateDailyTotals().calories
                    }
                    currentProtein={calculateDailyTotals().protein}
                    currentFat={calculateDailyTotals().fat}
                    selectedMeal={selectedMeal}
                  />
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
            <div className="space-y-4">
              {selectedKid &&
                Array.isArray(mealHistory[selectedKid]) &&
                mealHistory[selectedKid].map((entry, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold capitalize">
                        {entry.meal} -{" "}
                        {new Date(entry.date).toLocaleDateString()}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (selectedMeal) {
                            const newSelections = { ...selections };
                            newSelections[selectedKid][selectedDay][
                              selectedMeal
                            ] = {
                              ...entry.selections,
                            };
                            setSelections(newSelections);
                          }
                        }}
                      >
                        Use Again
                      </Button>
                    </div>
                    <div className="text-sm text-gray-600">
                      {Object.entries(entry.selections)
                        .filter(([, food]) => food)
                        .map(([category, food]) => (
                          <div key={category}>
                            {food?.name} (
                            {Math.round(food?.adjustedCalories || 0)} cal)
                          </div>
                        ))}
                    </div>
                  </Card>
                ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
