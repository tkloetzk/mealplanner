// hooks/meal/useMealSelections.ts
import { useState, useCallback } from "react";
import { CategoryType, Food, DayType } from "@/types/food";
import { Kid } from "@/types/user";
import { DEFAULT_MEAL_PLAN } from "@/constants/meal-goals";
import { produce } from "immer";
import { MealPlan, MealType } from "@/types/meals";
import { isCategoryKey } from "@/utils/meal-categories";

interface UseMealSelectionsConfig {
  initialKids: Kid[];
  onMealUpdate?: (selections: MealPlan) => void;
}

interface NutritionCalculation {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// Define what the hook returns for better type safety
interface MealSelectionsResult {
  selections: Record<string, MealPlan>;
  updateSelection: (
    kidId: string,
    day: DayType,
    meal: MealType,
    category: CategoryType,
    food: Food | null
  ) => void;
  calculateMealNutrition: (
    kidId: string,
    day: DayType,
    meal: MealType
  ) => NutritionCalculation;
  calculateDailyTotals: (kidId: string, day: DayType) => NutritionCalculation;
}

export function useMealSelections({
  initialKids,
  onMealUpdate,
}: UseMealSelectionsConfig): MealSelectionsResult {
  const [selections, setSelections] = useState<Record<string, MealPlan>>(() =>
    initialKids.reduce<Record<string, MealPlan>>((acc, kid) => {
      acc[kid.id] = structuredClone(DEFAULT_MEAL_PLAN);
      return acc;
    }, {})
  );

  const updateSelection = useCallback(
    (
      kidId: string,
      day: DayType,
      meal: MealType,
      category: CategoryType,
      food: Food | null
    ) => {
      setSelections(
        produce((draft) => {
          if (!draft[kidId]?.[day]?.[meal]) return;

          const currentMeal = draft[kidId][day][meal];

          if (category === "condiments") {
            if (food) {
              currentMeal.condiments.push({
                ...food,
                servings: 1,
                adjustedCalories: food.calories,
                adjustedProtein: food.protein,
                adjustedCarbs: food.carbs,
                adjustedFat: food.fat,
              });
            }
          } else if (isCategoryKey(category)) {
            currentMeal[category] = food
              ? {
                  ...food,
                  servings: 1,
                  adjustedCalories: food.calories,
                  adjustedProtein: food.protein,
                  adjustedCarbs: food.carbs,
                  adjustedFat: food.fat,
                }
              : null;
          }

          onMealUpdate?.(draft);
        })
      );
    },
    [onMealUpdate]
  );

  const calculateMealNutrition = useCallback(
    (kidId: string, day: DayType, meal: MealType): NutritionCalculation => {
      const mealSelections = selections[kidId]?.[day]?.[meal];
      if (!mealSelections) {
        return { calories: 0, protein: 0, carbs: 0, fat: 0 };
      }

      return Object.values(mealSelections).reduce(
        (sum, food) => {
          if (!food) return sum;
          return {
            calories: sum.calories + (food.adjustedCalories ?? food.calories),
            protein: sum.protein + (food.adjustedProtein ?? food.protein),
            carbs: sum.carbs + (food.adjustedCarbs ?? food.carbs),
            fat: sum.fat + (food.adjustedFat ?? food.fat),
          };
        },
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );
    },
    [selections]
  );

  const calculateDailyTotals = useCallback(
    (kidId: string, day: DayType): NutritionCalculation => {
      return ["breakfast", "lunch", "dinner", "snack"].reduce(
        (total, meal) => {
          const mealNutrition = calculateMealNutrition(
            kidId,
            day,
            meal as MealType
          );
          return {
            calories: total.calories + mealNutrition.calories,
            protein: total.protein + mealNutrition.protein,
            carbs: total.carbs + mealNutrition.carbs,
            fat: total.fat + mealNutrition.fat,
          };
        },
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );
    },
    [calculateMealNutrition]
  );

  return {
    selections,
    updateSelection,
    calculateMealNutrition,
    calculateDailyTotals,
  };
}
