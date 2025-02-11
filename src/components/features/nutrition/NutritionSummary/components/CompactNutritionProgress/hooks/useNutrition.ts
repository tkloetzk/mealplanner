// src/hooks/useNutrition.ts
import { useMemo } from "react";
import { MealSelection } from "@/types/meals";
import { MealType } from "@/types/shared";
import { DAILY_GOALS } from "@/constants/meal-goals";
import {
  getProgressBarWidth,
  getProgressColor,
  getNutrientColor,
  ensureNumber,
} from "@/utils/nutritionUtils";
import { Food } from "@/types/food";

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
  const mealNutrition = useMemo(() => {
    if (!selections) return { calories: 0, protein: 0, carbs: 0, fat: 0 };

    // Calculate nutrition from all food selections including milk
    const baseNutrition = Object.entries(selections)
      .filter(([category]) => category !== "condiments")
      .reduce(
        (sum, [, food]) => {
          if (!food || !(food as Food).calories) return sum;
          const foodItem = food as Food;
          const servings = foodItem.servings || 1;
          return {
            calories: sum.calories + (foodItem.calories * servings),
            protein: sum.protein + (foodItem.protein * servings),
            carbs: sum.carbs + (foodItem.carbs * servings),
            fat: sum.fat + (foodItem.fat * servings),
          };
        },
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );

    // Add nutrition from condiments
    const condimentNutrition = selections.condiments?.reduce(
      (sum: NutritionSummary, condiment: Food) => {
        const servings = condiment.servings || 1;
        return {
          calories: sum.calories + (condiment.calories * servings),
          protein: sum.protein + (condiment.protein * servings),
          carbs: sum.carbs + (condiment.carbs * servings),
          fat: sum.fat + (condiment.fat * servings),
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    ) || { calories: 0, protein: 0, carbs: 0, fat: 0 };

    // Combine all nutrition sources
    return {
      calories: baseNutrition.calories + condimentNutrition.calories,
      protein: baseNutrition.protein + condimentNutrition.protein,
      carbs: baseNutrition.carbs + condimentNutrition.carbs,
      fat: baseNutrition.fat + condimentNutrition.fat,
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

  return {
    mealNutrition,
    nutritionStatus,
    getProgressBarWidth,
    getProgressColor,
    getNutrientColor,
  };
}
