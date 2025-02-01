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

  const fetchMealHistory = useCallback(async (kidId: string) => {
    try {
      const response = await fetch(`/api/meal-history?kidId=${kidId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch meal history");
      }
      const history = await response.json();
      setMealHistory((prev) => ({
        ...prev,
        [kidId]: history,
      }));
    } catch (error) {
      console.error("Error fetching meal history:", error);
    }
  }, []);

  useEffect(() => {
    if (selectedKid) {
      fetchMealHistory(selectedKid);
    }
  }, [selectedKid, fetchMealHistory]);

  // In useMealPlanState.ts

  // Remove the fetch and update logic from individual handlers
  const handleFoodSelect = useCallback(
    async (category: CategoryType, food: Food) => {
      if (!selectedMeal || !selectedDay || !selectedKid) return;

      const newSelections = structuredClone(selections);
      const currentMeal = newSelections[selectedKid][selectedDay][selectedMeal];

      if (category === "condiments") {
        const existingCondimentIndex = currentMeal.condiments.findIndex(
          (c) => c.foodId === food.id
        );

        if (existingCondimentIndex >= 0) {
          currentMeal.condiments = currentMeal.condiments.filter(
            (c) => c.foodId !== food.id
          );
        } else {
          currentMeal.condiments.push({
            foodId: food.id,
            servings: 1,
            adjustedCalories: food.calories,
            adjustedProtein: food.protein,
            adjustedCarbs: food.carbs,
            adjustedFat: food.fat,
          });
        }
      } else {
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

      setSelections(newSelections);
    },
    [selectedKid, selectedDay, selectedMeal, selections]
  );

  const handleServingAdjustment = useCallback(
    (category: CategoryType, adjustedFood: SelectedFood) => {
      if (!selectedMeal || !selectedDay || !selectedKid) return;

      const newSelections = structuredClone(selections);
      const currentMeal = newSelections[selectedKid][selectedDay][selectedMeal];

      if (category === "condiments") {
        const condimentIndex = currentMeal.condiments?.findIndex(
          (c) => c.foodId === adjustedFood.id
        );

        if (condimentIndex >= 0 && currentMeal.condiments) {
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
        currentMeal[category] = adjustedFood;
      }

      setSelections(newSelections);
    },
    [selectedKid, selectedDay, selectedMeal, selections]
  );

  const handleMilkToggle = useCallback(
    (mealType: string, value: boolean) => {
      if (!selectedKid || !selectedDay) return;

      const newSelections = structuredClone(selections);
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

      setSelections(newSelections);
    },
    [selectedKid, selectedDay, selections]
  );

  useEffect(() => {
    const updateMealHistory = async () => {
      if (!selectedKid || !selectedDay || !selectedMeal) return;

      // Get the current meal selections and handle possible null values
      const currentSelections =
        selections[selectedKid]?.[selectedDay]?.[selectedMeal];
      if (!currentSelections) return;

      try {
        const mealData = {
          meal: selectedMeal,
          date: new Date(),
          selections: currentSelections,
        };

        const response = await fetch("/api/meal-history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kidId: selectedKid, mealData }),
        });

        if (!response.ok) {
          throw new Error("Failed to save meal history");
        }

        // Fetch updated history
        const historyResponse = await fetch(
          `/api/meal-history?kidId=${selectedKid}`
        );
        if (!historyResponse.ok) {
          throw new Error("Failed to fetch meal history");
        }

        const history = await historyResponse.json();
        setMealHistory((prev) => ({
          ...prev,
          [selectedKid]: history,
        }));
      } catch (error) {
        console.error("Error updating meal history:", error);
      }
    };

    // Skip effect if required values aren't present
    if (!selectedKid || !selectedDay || !selectedMeal) return;

    // Debounce the update to prevent too many requests
    const timeoutId = setTimeout(updateMealHistory, 500);
    return () => clearTimeout(timeoutId);
  }, [selectedKid, selectedDay, selectedMeal, selections]);

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
    calculateMealNutrition,
    calculateDailyTotals,
  };
};
