// hooks/useMealPlanState.ts
import { useState, useCallback, useEffect } from "react";
import {
  MealType,
  DayType,
  CategoryType,
  Food,
  SelectedFood,
  MealPlan,
  MealHistoryRecord,
} from "@/types/food";
import {
  DEFAULT_MEAL_PLAN,
  MILK_OPTION,
  RANCH_OPTION,
} from "@/constants/meal-goals";
import { Kid } from "@/types/user";
import { BREAKFAST, MEAL_TYPES } from "@/constants";

// Utility function for safe local storage operations

// Utility function to get the current day
const DAYS: readonly DayType[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const getCurrentDay = (): DayType => {
  return DAYS[new Date().getDay()];
};

// Deep clone utility function
const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(deepClone) as T;
  const clonedObj: Partial<T> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      clonedObj[key] = deepClone(obj[key]);
    }
  }
  return clonedObj as T;
};

export const useMealPlanState = (initialKids: Kid[]) => {
  if (initialKids.length === 0) {
    throw new Error("At least one kid is required to use meal plan state");
  }
  const [selectedKid, setSelectedKid] = useState<string | null>(
    initialKids.length > 0 ? initialKids[0].id : null
  );

  // Core selection state
  const [selectedDay, setSelectedDay] = useState<DayType>(getCurrentDay());
  const [selectedMeal, setSelectedMeal] = useState<MealType>(BREAKFAST);
  // Selections state with persistent storage
  const [selections, setSelections] = useState<Record<string, MealPlan>>(() =>
    initialKids.reduce<Record<string, MealPlan>>((acc, kid) => {
      acc[kid.id] = structuredClone(DEFAULT_MEAL_PLAN);
      return acc;
    }, {})
  );

  // Meal history state
  const [mealHistory, setMealHistory] = useState<
    Record<string, MealHistoryRecord[]>
  >({});

  useEffect(() => {
    const fetchMealHistory = async () => {
      if (!selectedKid) return;

      try {
        const response = await fetch(`/api/meal-history?kidId=${selectedKid}`);

        if (!response.ok) {
          throw new Error("Failed to fetch meal history");
        }

        const history = await response.json();
        setMealHistory((prev) => ({
          ...prev,
          [selectedKid]: history,
        }));
      } catch (error) {
        console.error("Meal history fetch error:", error);
        // Set an empty array to prevent repeated failed fetches
        setMealHistory((prev) => ({
          ...prev,
          [selectedKid]: [],
        }));
      }
    };

    fetchMealHistory();
  }, [selectedKid]);

  // Food selection handler with server synchronization
  const handleFoodSelect = useCallback(
    async (category: CategoryType, food: Food, servings?: number) => {
      if (!selectedMeal || !selectedDay || !selectedKid) return;

      try {
        setSelections((prev) => {
          const newSelections = structuredClone(prev);
          const currentMeal =
            newSelections[selectedKid][selectedDay][selectedMeal];

          if (category === "condiments") {
            // Handle condiments differently as they can have multiple selections
            const existingCondimentIndex = currentMeal.condiments?.findIndex(
              (c) => c.foodId === food.id
            );

            if (existingCondimentIndex >= 0) {
              // Remove existing condiment
              currentMeal.condiments.splice(existingCondimentIndex, 1);
            } else {
              // Add new condiment with specified servings
              const servingCount = servings || 1;
              currentMeal.condiments.push({
                foodId: food.id,
                servings: servingCount,
                adjustedCalories: food.calories * servingCount,
                adjustedProtein: food.protein * servingCount,
                adjustedCarbs: food.carbs * servingCount,
                adjustedFat: food.fat * servingCount,
              });
            }
          } else {
            // Handle other food categories as before
            currentMeal[category] =
              currentMeal[category]?.name === food.name
                ? null
                : {
                    ...food,
                    servings: 1,
                    adjustedCalories: food.calories,
                    adjustedProtein: food.protein,
                    adjustedCarbs: food.carbs,
                    adjustedFat: food.fat,
                  };
          }

          return newSelections;
        });

        // Send to server for persistent storage
        const mealData = {
          meal: selectedMeal,
          date: new Date(),
          selections: selections[selectedKid][selectedDay][selectedMeal],
        };

        console.log(
          "Sending meal history data:",
          JSON.stringify(mealData, null, 2)
        );

        const response = await fetch("/api/meal-history", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            kidId: selectedKid,
            mealData,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to save meal selection");
        }

        // Optionally update local history if server responds with updated record
        const savedEntry = await response.json();
        setMealHistory((prev) => {
          const updatedHistory = {
            ...prev,
            [selectedKid]: [savedEntry, ...(prev[selectedKid] || [])],
          };
          return updatedHistory;
        });
      } catch (error) {
        console.error("Error saving meal selection:", error);
        setSelections((prev) => structuredClone(prev));
      }
    },
    [selectedKid, selectedDay, selectedMeal, selections]
  );

  // Serving adjustment handler
  const handleServingAdjustment = useCallback(
    async (category: CategoryType, adjustedFood: SelectedFood) => {
      if (!selectedMeal || !selectedDay || !selectedKid) return;

      setSelections((prev) => {
        const newSelections = deepClone(prev);
        const currentMeal =
          newSelections[selectedKid][selectedDay][selectedMeal];

        if (category === "condiments") {
          // For condiments, find and update the specific condiment in the array
          const condimentIndex = currentMeal.condiments?.findIndex(
            (c) => c.foodId === adjustedFood.id
          );

          if (condimentIndex >= 0 && currentMeal.condiments) {
            // Update existing condiment
            currentMeal.condiments[condimentIndex] = {
              foodId: adjustedFood.id,
              servings: adjustedFood.servings,
              adjustedCalories: adjustedFood.calories * adjustedFood.servings,
              adjustedProtein: adjustedFood.protein * adjustedFood.servings,
              adjustedCarbs: adjustedFood.carbs * adjustedFood.servings,
              adjustedFat: adjustedFood.fat * adjustedFood.servings,
            };
          }
        } else {
          // For other categories, update as before
          currentMeal[category] = adjustedFood;
        }

        return newSelections;
      });
    },
    [selectedMeal, selectedDay, selectedKid]
  );

  const calculateMealNutrition = useCallback(
    (meal: MealType) => {
      if (!selectedKid || !selectedDay) {
        return { calories: 0, protein: 0, carbs: 0, fat: 0 };
      }

      const mealSelections = selections[selectedKid]?.[selectedDay]?.[meal];

      if (!mealSelections) {
        return { calories: 0, protein: 0, carbs: 0, fat: 0 };
      }

      // Calculate base nutrition from main food selections
      const baseNutrition = Object.entries(mealSelections)
        .filter(
          ([category, food]) => food !== null && category !== "condiments"
        )
        .reduce(
          (sum, [, food]) => ({
            calories: sum.calories + (food.adjustedCalories ?? food.calories),
            protein: sum.protein + (food.adjustedProtein ?? food.protein),
            carbs: sum.carbs + (food.adjustedCarbs ?? food.carbs),
            fat: sum.fat + (food.adjustedFat ?? food.fat),
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );

      // Add nutrition from condiments
      const condimentNutrition = mealSelections.condiments?.reduce(
        (sum, condiment) => ({
          calories: sum.calories + condiment?.adjustedCalories,
          protein: sum.protein + condiment?.adjustedProtein,
          carbs: sum.carbs + condiment?.adjustedCarbs,
          fat: sum.fat + condiment?.adjustedFat,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );

      // Combine base and condiment nutrition
      return {
        calories: baseNutrition.calories + condimentNutrition?.calories,
        protein: baseNutrition.protein + condimentNutrition?.protein,
        carbs: baseNutrition.carbs + condimentNutrition?.carbs,
        fat: baseNutrition.fat + condimentNutrition?.fat,
      };
    },
    [selections, selectedKid, selectedDay]
  );

  const calculateDailyTotals = useCallback(() => {
    if (!selectedKid || !selectedDay) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }

    return MEAL_TYPES.reduce(
      (dailyTotals, mealType) => {
        const mealNutrition = calculateMealNutrition(mealType);
        return {
          // @ts-expect-error TypeScript doesn't understand the dynamic keys here
          calories: dailyTotals.calories + mealNutrition.calories,
          // @ts-expect-error TypeScript doesn't understand the dynamic keys here
          protein: dailyTotals.protein + mealNutrition.protein,
          // @ts-expect-error TypeScript doesn't understand the dynamic keys here
          carbs: dailyTotals.carbs + mealNutrition.carbs,
          // @ts-expect-error TypeScript doesn't understand the dynamic keys here
          fat: dailyTotals.fat + mealNutrition.fat,
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [selectedKid, selectedDay, calculateMealNutrition]);

  // Milk toggle handler
  const handleMilkToggle = useCallback(
    (mealType: string, value: boolean) => {
      if (!selectedKid || !selectedDay) return;

      setSelections((prev) => {
        const newSelections = deepClone(prev);
        // @ts-expect-error TODO: fix

        const milkFood: SelectedFood = {
          ...MILK_OPTION,
          category: "milk",
          servings: 1,
          adjustedCalories: MILK_OPTION.calories,
          adjustedProtein: MILK_OPTION.protein,
          adjustedCarbs: MILK_OPTION.carbs,
          adjustedFat: MILK_OPTION.fat,
        };

        //@ts-expect-error TypeScript doesn't understand the dynamic keys here
        newSelections[selectedKid][selectedDay][mealType].milk = value
          ? milkFood
          : null;

        return newSelections;
      });
    },
    [selectedKid, selectedDay]
  );

  // Ranch toggle handler
  const handleRanchToggle = useCallback(
    (mealType: MealType, value: boolean, servings: number) => {
      if (!selectedKid || !selectedDay) return;

      setSelections((prev) => {
        const newSelections = deepClone(prev);
        // @ts-expect-error TODO: fix

        const ranchFood: SelectedFood = {
          ...RANCH_OPTION,
          category: "vegetables",
          servings,
          adjustedCalories: RANCH_OPTION.calories * servings,
          adjustedProtein: RANCH_OPTION.protein * servings,
          adjustedCarbs: RANCH_OPTION.carbs * servings,
          adjustedFat: RANCH_OPTION.fat * servings,
        };

        //@ts-expect-error TypeScript doesn't understand the dynamic keys here
        newSelections[selectedKid][selectedDay][mealType].ranch = value
          ? ranchFood
          : null;

        return newSelections;
      });
    },
    [selectedKid, selectedDay]
  );

  return {
    selectedKid,
    selectedDay,
    selectedMeal,
    selections,
    mealHistory,
    setSelectedKid,
    setSelections,
    setSelectedDay,
    setSelectedMeal,
    handleFoodSelect,
    handleServingAdjustment,
    handleMilkToggle,
    handleRanchToggle,
    calculateMealNutrition,
    calculateDailyTotals,
  };
};
