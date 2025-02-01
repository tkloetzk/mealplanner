// src/hooks/useNutrition.ts
import { useMemo } from "react";
import { MealType, MealSelection } from "@/types/food";
import { DAILY_GOALS } from "@/constants/meal-goals";

export interface NutritionSummary {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface NutritionStatus {
  meetsCalorieGoal: boolean;
  meetsProteinGoal: boolean;
  meetsFatGoal: boolean;
}
export function useNutrition(
  selections: MealSelection | null,
  mealType: MealType | null
) {
  const ensureNumber = (value: unknown): number => {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

  const mealNutrition = useMemo(() => {
    if (!selections) return { calories: 0, protein: 0, carbs: 0, fat: 0 };

    // Calculate nutrition from regular food selections
    const baseNutrition = Object.entries(selections)
      .filter(([category]) => category !== "condiments" && category !== "milk")
      .reduce(
        (sum, [, food]) => {
          if (!food) return sum;
          return {
            calories:
              sum.calories +
              ensureNumber(food.adjustedCalories || food.calories || 0),
            protein:
              sum.protein +
              ensureNumber(food.adjustedProtein || food.protein || 0),
            carbs:
              sum.carbs + ensureNumber(food.adjustedCarbs || food.carbs || 0),
            fat: sum.fat + ensureNumber(food.adjustedFat || food.fat || 0),
          };
        },
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );

    // Add nutrition from milk if present
    const milkNutrition = selections.milk
      ? {
          calories: ensureNumber(
            selections.milk.adjustedCalories || selections.milk.calories || 0
          ),
          protein: ensureNumber(
            selections.milk.adjustedProtein || selections.milk.protein || 0
          ),
          carbs: ensureNumber(
            selections.milk.adjustedCarbs || selections.milk.carbs || 0
          ),
          fat: ensureNumber(
            selections.milk.adjustedFat || selections.milk.fat || 0
          ),
        }
      : { calories: 0, protein: 0, carbs: 0, fat: 0 };

    // Add nutrition from all condiments
    const condimentNutrition = selections.condiments?.reduce(
      (sum, condiment) => ({
        calories: sum.calories + ensureNumber(condiment.adjustedCalories || 0),
        protein: sum.protein + ensureNumber(condiment.adjustedProtein || 0),
        carbs: sum.carbs + ensureNumber(condiment.adjustedCarbs || 0),
        fat: sum.fat + ensureNumber(condiment.adjustedFat || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    ) || { calories: 0, protein: 0, carbs: 0, fat: 0 };

    // Combine all nutrition sources and ensure final values are numbers
    return {
      calories: ensureNumber(
        baseNutrition.calories +
          milkNutrition.calories +
          condimentNutrition.calories
      ),
      protein: ensureNumber(
        baseNutrition.protein +
          milkNutrition.protein +
          condimentNutrition.protein
      ),
      carbs: ensureNumber(
        baseNutrition.carbs + milkNutrition.carbs + condimentNutrition.carbs
      ),
      fat: ensureNumber(
        baseNutrition.fat + milkNutrition.fat + condimentNutrition.fat
      ),
    };
  }, [selections]);

  const nutritionStatus = useMemo((): NutritionStatus => {
    if (!mealType) {
      return {
        meetsCalorieGoal: false,
        meetsProteinGoal: false,
        meetsFatGoal: false,
      };
    }

    //@ts-expect-error idk
    const targetCalories = DAILY_GOALS.mealCalories[mealType];
    const { protein: proteinGoals, fat: fatGoals } = DAILY_GOALS.dailyTotals;

    return {
      meetsCalorieGoal:
        mealNutrition.calories >= targetCalories * 0.9 &&
        mealNutrition.calories <= targetCalories * 1.1,
      meetsProteinGoal:
        mealNutrition.protein >= proteinGoals.min &&
        mealNutrition.protein <= proteinGoals.max,
      meetsFatGoal:
        mealNutrition.fat >= fatGoals.min && mealNutrition.fat <= fatGoals.max,
    };
  }, [mealNutrition, mealType]);

  const getProgressBarWidth = (current: number, target: number): string => {
    const percentage = (current / target) * 100;
    return `${Math.min(percentage, 100)}%`;
  };

  const getProgressColor = (current: number, target: number): string => {
    const percentage = (current / target) * 100;
    if (percentage > 110) return "bg-red-500";
    if (percentage > 90 && percentage <= 95) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getNutrientColor = (
    current: number,
    min: number,
    max: number
  ): string => {
    if (current < min) return "text-yellow-600";
    if (current > max) return "text-red-600";
    return "text-green-600";
  };

  return {
    mealNutrition,
    nutritionStatus,
    getProgressBarWidth,
    getProgressColor,
    getNutrientColor,
  };
}
