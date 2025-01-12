"use client";
// src/components/MealPlanner.tsx
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, Sliders } from "lucide-react";
import { ServingSelector } from "./ServingSelector";
import {
  Food,
  SelectedFood,
  MealType,
  DayType,
  CategoryType,
  MealPlan,
  MealHistoryEntry,
  MealSelection,
  NutritionSummary,
  MILK_OPTION,
  // DailyGoals,
} from "@/types/food";
import { ChildView } from "./ChildView";
import { ViewToggle } from "./ViewToggle";
import { MilkToggle } from "./MilkToggle";
import { FoodEditor } from "./FoodEditor";
import { CompactNutritionProgress } from "./CompactNutritionProgress";

const MEAL_CALORIE_TARGET = {
  breakfast: 400,
  lunch: 400,
  dinner: 400,
  snacks: 200,
};

// const DAILY_NUTRITION_GOALS: DailyGoals = {
//   totalProtein: { min: 20, max: 25 },
//   totalFat: { min: 33, max: 62 },
// };

const defaultObj = {
  grains: null,
  fruits: null,
  proteins: null,
  vegetables: null,
  milk: null,
};

const DEFAULT_MEAL_PLAN: MealPlan = {
  monday: {
    breakfast: defaultObj,
    lunch: defaultObj,
    dinner: defaultObj,
    snack: defaultObj,
  },
  tuesday: {
    breakfast: defaultObj,
    lunch: defaultObj,
    dinner: defaultObj,
    snack: defaultObj,
  },
};

export function MealPlanner() {
  const [isChildView, setIsChildView] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMeal, setSelectedMeal] = useState<MealType | null>(null);
  const [selectedDay, setSelectedDay] = useState<DayType>("monday");
  const [selections, setSelections] = useState<MealPlan>(DEFAULT_MEAL_PLAN);
  const [mealHistory, setMealHistory] = useState<MealHistoryEntry[]>([]);
  const [pantry, setPantry] = useState([]);
  const [showFoodEditor, setShowFoodEditor] = useState(false);
  const [selectedFood, setSelectedFood] = useState<{
    category: CategoryType;
    food: Food;
    currentServings: number;
  } | null>(null);
  const [includesMilk, setIncludesMilk] = useState<Record<MealType, boolean>>({
    breakfast: false,
    lunch: false,
    dinner: false,
    snack: false,
  });
  const [foodOptions, setFoodOptions] = useState<Record<CategoryType, Food[]>>({
    grains: [],
    fruits: [],
    proteins: [],
    vegetables: [],
    milk: [],
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [mealPlanRes, historyRes, foodsRes] = await Promise.all([
          fetch("/api/meals"),
          fetch("/api/history"),
          fetch("/api/foods"),
        ]);

        if (!foodsRes.ok) throw new Error("Failed to fetch foods");
        const foods = await foodsRes.json();
        setFoodOptions(foods);

        if (mealPlanRes.ok && historyRes.ok) {
          const [mealPlan, history] = await Promise.all([
            mealPlanRes.json(),
            historyRes.json(),
          ]);

          setSelections(mealPlan || DEFAULT_MEAL_PLAN);
          setMealHistory(history || []);
          setPantry(foods);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  console.log("pantry", pantry);

  const calculateMealNutrition = (
    meal: MealType,
    day: DayType = selectedDay
  ): NutritionSummary => {
    const mealSelections = selections[day][meal];
    return Object.values(mealSelections).reduce(
      (sum, item) => {
        if (!item) return sum;
        return {
          calories: sum.calories + (item.adjustedCalories || item.calories),
          protein: sum.protein + (item.adjustedProtein || item.protein),
          carbs: sum.carbs + (item.adjustedCarbs || item.carbs),
          fat: sum.fat + (item.adjustedFat || item.fat),
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  const handleSaveFood = async (food: Food) => {
    try {
      const response = await fetch("/api/foods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(food),
      });
      if (response.ok) {
        // Refresh food options
        // Close editor
        setShowFoodEditor(false);
      }
    } catch (error) {
      console.error("Error saving food:", error);
    }
  };

  const handleFoodSelect = (category: CategoryType, food: Food) => {
    if (!selectedMeal || !selectedDay) return;

    const newSelections = { ...selections };

    // If food is already selected, remove it
    if (
      newSelections[selectedDay][selectedMeal][category]?.name === food.name
    ) {
      newSelections[selectedDay][selectedMeal][category] = null;
    } else {
      // Add food with default values guaranteed
      const selectedFood: SelectedFood = {
        ...food,
        servings: 1,
        adjustedCalories: food.calories * 1,
        adjustedProtein: food.protein * 1,
        adjustedCarbs: food.carbs * 1,
        adjustedFat: food.fat * 1,
      };
      newSelections[selectedDay][selectedMeal][category] = selectedFood;
    }

    setSelections(newSelections);
  };

  // When opening the serving selector, pass the current servings
  const handleServingClick = (
    e: React.MouseEvent,
    category: CategoryType,
    food: Food
  ) => {
    e.stopPropagation();
    if (selectedDay && selectedMeal) {
      const currentFood = selections[selectedDay][selectedMeal][category];
      setSelectedFood({
        category,
        food,
        currentServings: currentFood?.servings || 1,
      });
    }
  };

  const handleMilkToggle = (mealType: MealType, value: boolean) => {
    setIncludesMilk((prev) => ({
      ...prev,
      [mealType]: value,
    }));

    // Update selections to include/remove milk
    const newSelections = { ...selections };
    if (value) {
      newSelections[selectedDay][mealType].milk = {
        ...MILK_OPTION,
        servings: 1,
        adjustedCalories: MILK_OPTION.calories,
        adjustedProtein: MILK_OPTION.protein,
        adjustedCarbs: MILK_OPTION.carbs,
        adjustedFat: MILK_OPTION.fat,
      };
    } else {
      newSelections[selectedDay][mealType].milk = null;
    }
    setSelections(newSelections);
  };

  const saveToHistory = async (mealSelections: MealSelection) => {
    const historyEntry: MealHistoryEntry = {
      date: new Date().toISOString(),
      meal: selectedMeal!,
      selections: { ...mealSelections },
    };

    try {
      await fetch("/api/history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(historyEntry),
      });

      setMealHistory((prev) => [historyEntry, ...prev.slice(0, 9)]);
    } catch (error) {
      console.error("Error saving to history:", error);
    }
  };

  const calculateDailyTotals = (): {
    calories: number;
    protein: number;
    fat: number;
  } => {
    return Object.values(selections[selectedDay]).reduce(
      (totals, meal) => {
        Object.values(meal).forEach((food: SelectedFood | null) => {
          if (food) {
            totals.calories += food.adjustedCalories || food.calories;
            totals.protein += food.adjustedProtein || food.protein;
            totals.fat += food.adjustedFat || food.fat;
          }
        });
        return totals;
      },
      { calories: 0, protein: 0, fat: 0 }
    );
  };
  const handleServingConfirm = (
    category: CategoryType,
    adjustedFood: SelectedFood
  ) => {
    if (!selectedMeal || !selectedDay) return;

    const newSelections = { ...selections };
    newSelections[selectedDay][selectedMeal][category] = adjustedFood;
    setSelections(newSelections);
    setSelectedFood(null);
  };

  const getMealSuggestion = () => {
    if (!selectedMeal) return null;

    const nutrition = calculateMealNutrition(selectedMeal);
    const target =
      selectedMeal === "snack"
        ? MEAL_CALORIE_TARGET.snacks
        : MEAL_CALORIE_TARGET[selectedMeal];

    if (nutrition.calories === 0) {
      return {
        type: "info",
        message:
          "Start building your meal! Aim for a balance of proteins, grains, fruits, and vegetables.",
      };
    }

    // Exact target case
    if (nutrition.calories === target) {
      return {
        type: "success",
        message: `Perfect! This is a well-balanced meal within the target range of ${target}.`,
      };
    }

    // Slightly over target (401 to 425)
    if (nutrition.calories > target && nutrition.calories <= target + 25) {
      const percentage = ((target / nutrition.calories) * 100).toFixed(1);
      return {
        type: "success",
        message: `Nice! This is a well-balanced meal within ${percentage}% of the target range of ${target}.`,
      };
    }

    // Slightly under target (375 to 399)
    if (nutrition.calories >= target - 25 && nutrition.calories < target) {
      const percentage = ((nutrition.calories / target) * 100).toFixed(1);
      return {
        type: "success",
        message: `Nice! This is a well-balanced meal within ${percentage}% of the target range of ${target}.`,
      };
    }

    if (nutrition.calories > target + 100) {
      return {
        type: "warning",
        message:
          "You're significantly over the target calories. Consider removing a high-calorie item.",
      };
    }

    if (nutrition.calories > target) {
      return {
        type: "warning",
        message:
          "You're slightly over the target calories. Consider adjusting portions.",
      };
    }

    return {
      type: "info",
      message: `You have room for ${
        target - nutrition.calories
      } more calories.`,
    };
  };

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

      {isChildView ? (
        <ChildView
          selectedMeal={selectedMeal}
          foodOptions={foodOptions}
          selections={selections}
          selectedDay={selectedDay}
          onFoodSelect={handleFoodSelect}
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
              {Object.keys(selections).map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day as DayType)}
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
              {(["breakfast", "lunch", "dinner", "snack"] as MealType[]).map(
                (meal) => (
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
                )
              )}
            </div>

            {selectedMeal && (
              <>
                {/* Nutrition Summary */}
                <Card className="mb-6">
                  <CardContent className="p-4">
                    <h3 className="text-lg font-semibold mb-3">
                      Nutrition Summary
                    </h3>
                    <div className="grid grid-cols-4 gap-4">
                      {Object.entries(calculateMealNutrition(selectedMeal)).map(
                        ([nutrient, value]) => (
                          <div key={nutrient} className="text-center">
                            <div className="text-2xl font-bold">
                              {Math.round(value)}
                            </div>
                            <div className="text-sm text-gray-600 capitalize">
                              {nutrient}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Meal Suggestion */}
                {getMealSuggestion() && (
                  <div
                    className={`mb-6 p-4 rounded-lg border ${
                      getMealSuggestion()?.type === "warning"
                        ? "bg-yellow-50 border-yellow-200 text-yellow-800"
                        : getMealSuggestion()?.type === "success"
                        ? "bg-green-50 border-green-200 text-green-800"
                        : "bg-blue-50 border-blue-200 text-blue-800"
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      <MessageCircle className="w-5 h-5 mt-0.5" />
                      <p>{getMealSuggestion()?.message}</p>
                    </div>
                  </div>
                )}

                {selectedFood && (
                  <ServingSelector
                    food={selectedFood.food}
                    currentServings={
                      selections[selectedDay][selectedMeal][
                        selectedFood.category
                      ]?.servings || 1
                    }
                    onConfirm={(adjustedFood) =>
                      handleServingConfirm(selectedFood.category, adjustedFood)
                    }
                    onCancel={() => setSelectedFood(null)}
                  />
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
                <Button onClick={() => setShowFoodEditor(true)}>
                  Add New Food
                </Button>
                {showFoodEditor && (
                  <FoodEditor
                    onSave={handleSaveFood}
                    onCancel={() => setShowFoodEditor(false)}
                  />
                )}
                {/* Food Selection Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {(
                    Object.entries(foodOptions) as [CategoryType, Food[]][]
                  ).map(([category, foods]) => (
                    <Card key={category}>
                      <CardContent className="p-4">
                        <h3 className="text-lg font-semibold capitalize mb-3">
                          {category}
                        </h3>
                        <div className="space-y-2">
                          {foods.map((food) => {
                            const selectedFoodInCategory =
                              selections[selectedDay][selectedMeal][category];
                            const isSelected =
                              selectedFoodInCategory?.name === food.name;

                            return (
                              <div
                                key={food.name}
                                className="relative flex flex-col"
                              >
                                <button
                                  key={food.name}
                                  onClick={() =>
                                    handleFoodSelect(category, food)
                                  }
                                  className={`w-full p-2 text-left rounded hover:bg-gray-100 ${
                                    isSelected ? "bg-blue-100" : ""
                                  }`}
                                >
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <div>{food.name}</div>
                                      <div className="text-sm text-gray-600">
                                        {food.servingSize}{" "}
                                        {food.servingSizeUnit}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div>{food.calories} cal</div>
                                      <div className="text-sm text-gray-600">
                                        P: {food.protein}g | C: {food.carbs}g |
                                        F: {food.fat}g
                                      </div>
                                    </div>
                                  </div>
                                  {isSelected && (
                                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
                                      <div className="text-sm text-blue-600">
                                        {selectedFoodInCategory?.servings || 1}{" "}
                                        serving(s) •
                                        {Math.round(
                                          selectedFoodInCategory?.adjustedCalories ||
                                            food.calories
                                        )}{" "}
                                        cal total
                                      </div>
                                      <div
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleServingClick(e, category, food);
                                        }}
                                        className="p-1 rounded hover:bg-blue-200 transition-colors"
                                        title="Adjust serving size"
                                      >
                                        <Sliders className="h-4 w-4 text-blue-600" />
                                      </div>
                                    </div>
                                  )}
                                </button>
                              </div>
                            );
                          })}{" "}
                          <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
                            <CompactNutritionProgress
                              currentCalories={
                                selectedMeal
                                  ? calculateMealNutrition(selectedMeal)
                                      .calories
                                  : calculateDailyTotals().calories
                              }
                              currentProtein={calculateDailyTotals().protein}
                              currentFat={calculateDailyTotals().fat}
                              selectedMeal={selectedMeal}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="weekly">
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              {Object.entries(selections).map(([day, meals]) => (
                <Card key={day} className="p-4">
                  <h3 className="text-lg font-semibold capitalize mb-3">
                    {day}
                  </h3>
                  {Object.entries(meals).map(([meal]) => {
                    const nutrition = calculateMealNutrition(
                      meal as MealType,
                      day as DayType
                    );
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
              {mealHistory.map((entry, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold capitalize">
                      {entry.meal} - {new Date(entry.date).toLocaleDateString()}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (selectedMeal) {
                          const newSelections = { ...selections };
                          newSelections[selectedDay][selectedMeal] = {
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
