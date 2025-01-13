"use client";
// src/components/MealPlanner.tsx
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, Plus, Sliders } from "lucide-react";
import { ServingSelector } from "./ServingSelector";
import {
  Food,
  SelectedFood,
  MealType,
  DayType,
  CategoryType,
  MealPlan,
  MealHistoryEntry,
  MILK_OPTION,
  MealSelection,
} from "@/types/food";
import { ChildView } from "./ChildView";
import { ViewToggle } from "./ViewToggle";
import { MilkToggle } from "./MilkToggle";
import { FoodEditor } from "./FoodEditor";
import { CompactNutritionProgress } from "./CompactNutritionProgress";
import {
  DAYS_OF_WEEK,
  DEFAULT_MEAL_PLAN,
  defaultObj,
  MEAL_TYPES,
} from "@/constants/meal-goals";
import { KidSelector } from "./KidSelector";
import { RANCH_OPTION, RanchToggle } from "./RanchToggle";
import { NutritionSummary } from "./NutritionSummary";
import FoodItem from "./FoodItem";

const MEAL_CALORIE_TARGET = {
  breakfast: 400,
  lunch: 400,
  dinner: 400,
  snacks: 200,
} as const;

interface NutritionTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

const getCurrentDay = (): DayType => {
  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ] as const;
  const currentDay = days[new Date().getDay()];
  return currentDay as DayType;
};

const createEmptyMealPlan = (): MealPlan => {
  return DAYS_OF_WEEK.reduce((plan, day) => {
    plan[day] = {
      breakfast: defaultObj,
      lunch: defaultObj,
      dinner: defaultObj,
      snack: defaultObj,
    };
    return plan;
  }, {} as MealPlan);
};

const initialSelections: Record<string, MealPlan> = {
  "1": createEmptyMealPlan(),
  "2": createEmptyMealPlan(),
};

export function MealPlanner() {
  const [isChildView, setIsChildView] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMeal, setSelectedMeal] = useState<MealType | null>(null);
  const [selectedDay, setSelectedDay] = useState<DayType>(getCurrentDay());
  const [selections, setSelections] =
    useState<Record<string, MealPlan>>(initialSelections);
  const [mealHistory, setMealHistory] = useState<
    Record<string, MealHistoryEntry[]>
  >({
    "1": [],
    "2": [],
  });
  const [showFoodEditor, setShowFoodEditor] = useState(false);
  const [selectedKid, setSelectedKid] = useState<string | null>("1");
  const [includesRanch, setIncludesRanch] = useState<
    Record<MealType, { has: boolean; servings: number }>
  >({
    breakfast: { has: false, servings: 1 },
    lunch: { has: false, servings: 1 },
    dinner: { has: false, servings: 1 },
    snack: { has: false, servings: 1 },
  });
  const [kids] = useState<Kid[]>([
    { id: "1", name: "Presley" },
    { id: "2", name: "Evy" },
  ]);
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
          console.log(mealPlan, mealPlan || DEFAULT_MEAL_PLAN);

          setSelections(mealPlan || DEFAULT_MEAL_PLAN);
          setMealHistory({
            "1": history?.["1"] || [],
            "2": history?.["2"] || [],
          });
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSaveFood = async (food: Food) => {
    try {
      const response = await fetch("/api/foods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(food),
      });
      if (response.ok) {
        setShowFoodEditor(false);
      }
    } catch (error) {
      console.error("Error saving food:", error);
    }
  };

  // Then rewrite the handleFoodSelect function
  const handleFoodSelect = (category: CategoryType, food: Food) => {
    if (!selectedMeal || !selectedDay || !selectedKid) {
      console.log("Missing required selection:", {
        selectedMeal,
        selectedDay,
        selectedKid,
      });
      return;
    }

    setSelections((prev) => {
      // Start with a clean copy of the previous state
      const newState = { ...prev };

      // Make sure we have the proper nested structure
      if (!newState[selectedKid]) {
        newState[selectedKid] = createEmptyMealPlan();
      }

      // Get current selection for comparison
      const currentSelection =
        newState[selectedKid][selectedDay][selectedMeal][category];

      // Create the new food object if we're selecting a new item
      const newFoodSelection =
        currentSelection?.name === food.name
          ? null
          : {
              ...food,
              servings: 1,
              adjustedCalories: food.calories,
              adjustedProtein: food.protein,
              adjustedCarbs: food.carbs,
              adjustedFat: food.fat,
            };

      // Update the specific selection while maintaining the structure
      newState[selectedKid] = {
        ...newState[selectedKid],
        [selectedDay]: {
          ...newState[selectedKid][selectedDay],
          [selectedMeal]: {
            ...newState[selectedKid][selectedDay][selectedMeal],
            [category]: newFoodSelection,
          },
        },
      };

      console.log("Updated state structure:", {
        hasKidId: Boolean(newState[selectedKid]),
        hasDay: Boolean(newState[selectedKid]?.[selectedDay]),
        hasMeal: Boolean(newState[selectedKid]?.[selectedDay]?.[selectedMeal]),
        hasCategory: Boolean(
          newState[selectedKid]?.[selectedDay]?.[selectedMeal]?.[category]
        ),
      });

      return newState;
    });
  };
  // When opening the serving selector, pass the current servings
  const handleServingClick = (
    e: React.MouseEvent,
    category: CategoryType,
    food: Food
  ) => {
    e.stopPropagation();
    if (selectedDay && selectedMeal && selectedKid) {
      // First access the kid's selections, then the day, then the meal, then the category
      const currentFood =
        selections[selectedKid]?.[selectedDay]?.[selectedMeal]?.[category];
      setSelectedFood({
        category,
        food,
        currentServings: currentFood?.servings || 1,
      });
    }
  };

  const handleRanchToggle = (
    mealType: MealType,
    value: boolean,
    servings: number
  ) => {
    if (!selectedKid || !selectedDay) return;

    setIncludesRanch((prev) => ({
      ...prev,
      [mealType]: { has: value, servings },
    }));

    setSelections((prev) => {
      const newSelections = { ...prev };
      if (!newSelections[selectedKid]) {
        newSelections[selectedKid] = createEmptyMealPlan();
      }

      try {
        if (value) {
          newSelections[selectedKid][selectedDay][mealType].ranch = {
            ...RANCH_OPTION,
            servings,
            // @ts-expect-error IDK how to fix
            meal: RANCH_OPTION.meal,
            adjustedCalories: RANCH_OPTION.calories * servings,
            adjustedProtein: RANCH_OPTION.protein * servings,
            adjustedCarbs: RANCH_OPTION.carbs * servings,
            adjustedFat: RANCH_OPTION.fat * servings,
          };
        } else {
          newSelections[selectedKid][selectedDay][mealType].ranch = null;
        }
        return newSelections;
      } catch (error) {
        console.error("Error in handleRanchToggle:", error);
        return prev;
      }
    });
  };

  const handleMilkToggle = (mealType: MealType, value: boolean) => {
    setIncludesMilk((prev) => ({
      ...prev,
      [mealType]: value,
    }));

    if (!selectedKid || !selectedDay) return;

    setSelections((prev) => {
      const newSelections = { ...prev };
      if (!newSelections[selectedKid]) {
        newSelections[selectedKid] = createEmptyMealPlan();
      }

      try {
        if (value) {
          newSelections[selectedKid][selectedDay][mealType].milk = {
            ...MILK_OPTION,
            servings: 1, // Add the required servings property
            adjustedCalories: MILK_OPTION.calories,
            adjustedProtein: MILK_OPTION.protein,
            adjustedCarbs: MILK_OPTION.carbs,
            adjustedFat: MILK_OPTION.fat,
          };
        } else {
          newSelections[selectedKid][selectedDay][mealType].milk = null;
        }
        return newSelections;
      } catch (error) {
        console.error("Error in handleMilkToggle:", error);
        return prev;
      }
    });
  };

  const calculateDailyTotals = (): NutritionTotals => {
    const emptyTotals: NutritionTotals = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    };

    if (
      !selectedKid ||
      !selectedDay ||
      !selections[selectedKid]?.[selectedDay]
    ) {
      return emptyTotals;
    }

    const daySelections = selections[selectedKid][selectedDay];
    return Object.values(daySelections).reduce<NutritionTotals>(
      (totals, mealSelections: MealSelection | null) => {
        if (!mealSelections) return totals;

        Object.values(mealSelections).forEach((food: SelectedFood | null) => {
          if (food) {
            totals.calories += food.adjustedCalories ?? food.calories ?? 0;
            totals.protein += food.adjustedProtein ?? food.protein ?? 0;
            totals.carbs += food.adjustedCarbs ?? food.carbs ?? 0;
            totals.fat += food.adjustedFat ?? food.fat ?? 0;
          }
        });
        return totals;
      },
      structuredClone(emptyTotals)
    );
  };

  const calculateMealNutrition = (meal: MealType): NutritionTotals => {
    if (
      !selectedKid ||
      !selectedDay ||
      !selections[selectedKid]?.[selectedDay]?.[meal]
    ) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }

    const mealSelections = selections[selectedKid][selectedDay][meal];
    return Object.values(mealSelections).reduce<NutritionTotals>(
      (sum, item) => {
        if (!item) return sum;
        return {
          calories:
            sum.calories + (item.adjustedCalories ?? item.calories ?? 0),
          protein: sum.protein + (item.adjustedProtein ?? item.protein ?? 0),
          carbs: sum.carbs + (item.adjustedCarbs ?? item.carbs ?? 0),
          fat: sum.fat + (item.adjustedFat ?? item.fat ?? 0),
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  const handleServingConfirm = (
    category: CategoryType,
    adjustedFood: SelectedFood
  ) => {
    if (!selectedMeal || !selectedDay || !selectedKid) return;

    setSelections((prev) => {
      const newSelections = { ...prev };
      newSelections[selectedKid][selectedDay][selectedMeal][category] =
        adjustedFood;
      return newSelections;
    });
    setSelectedFood(null);
  };

  const getOrderedDays = (): DayType[] => {
    const today = getCurrentDay();
    const currentIndex = DAYS_OF_WEEK.indexOf(today);
    const reorderedDays = [
      ...DAYS_OF_WEEK.slice(currentIndex),
      ...DAYS_OF_WEEK.slice(0, currentIndex),
    ];
    return reorderedDays;
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
          selections={selections[selectedKid] ?? DEFAULT_MEAL_PLAN} // Use nullish coalescing
          selectedDay={selectedDay}
          onFoodSelect={handleFoodSelect} // Pass the function directly
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
            {selectedFood && selectedKid && selectedDay && selectedMeal && (
              <ServingSelector
                food={selectedFood.food}
                currentServings={
                  (
                    selections[selectedKid]?.[selectedDay]?.[
                      selectedMeal
                    ] as Record<CategoryType, SelectedFood | null>
                  )?.[selectedFood.category]?.servings || 1
                }
                onConfirm={(adjustedFood) =>
                  handleServingConfirm(selectedFood.category, adjustedFood)
                }
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
                                  onServingClick={(e) => {
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
                  {Object.entries(selections[day]).map(([meal]) => {
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
