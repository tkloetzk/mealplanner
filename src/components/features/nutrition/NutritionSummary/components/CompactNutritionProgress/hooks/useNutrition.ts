// src/hooks/useNutrition.ts
import { useMemo } from "react";
import { MealSelection } from "@/types/food";
import { MealType } from "@/types/meals";
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

    // Calculate nutrition from all food selections including milk
    const baseNutrition = Object.entries(selections)
      .filter(([category]) => category !== "condiments")
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

    // Add nutrition from condiments
    const condimentNutrition = selections.condiments?.reduce(
      (sum, condiment) => ({
        calories: sum.calories + ensureNumber(condiment.adjustedCalories || 0),
        protein: sum.protein + ensureNumber(condiment.adjustedProtein || 0),
        carbs: sum.carbs + ensureNumber(condiment.adjustedCarbs || 0),
        fat: sum.fat + ensureNumber(condiment.adjustedFat || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    ) || { calories: 0, protein: 0, carbs: 0, fat: 0 };

    // Combine all nutrition sources
    const totalNutrition = {
      calories: ensureNumber(
        baseNutrition.calories + condimentNutrition.calories
      ),
      protein: ensureNumber(baseNutrition.protein + condimentNutrition.protein),
      carbs: ensureNumber(baseNutrition.carbs + condimentNutrition.carbs),
      fat: ensureNumber(baseNutrition.fat + condimentNutrition.fat),
    };

    return totalNutrition;
  }, [selections]);

  const nutritionStatus = useMemo((): NutritionStatus => {
    if (!mealType) {
      return {
        meetsCalorieGoal: false,
        meetsProteinGoal: false,
        meetsFatGoal: false,
      };
    }

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
