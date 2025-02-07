import { MealSelection, NutritionSummary } from "@/types/food";

export const createEmptyMealSelection = (): MealSelection => ({
  proteins: null,
  fruits: null,
  vegetables: null,
  grains: null,
  milk: null,
  ranch: null,
  condiments: [],
});

export const nutritionToMealSelection = (
  nutrition: NutritionSummary
): MealSelection => ({
  ...createEmptyMealSelection(),
  proteins:
    nutrition.calories || nutrition.protein || nutrition.carbs || nutrition.fat
      ? {
          id: "total",
          name: "Total",
          calories: nutrition.calories,
          protein: nutrition.protein,
          carbs: nutrition.carbs,
          fat: nutrition.fat,
          category: "proteins",
          servings: 1,
          meal: [],
          adjustedCalories: nutrition.calories,
          adjustedProtein: nutrition.protein,
          adjustedCarbs: nutrition.carbs,
          adjustedFat: nutrition.fat,
          hiddenFromChild: false,
          servingSize: "1",
          servingSizeUnit: "piece",
        }
      : null,
});

// Nutrition validation constants
export const CALORIES_PER_PROTEIN = 4;
export const CALORIES_PER_CARB = 4;
export const CALORIES_PER_FAT = 9;
export const MAX_CALORIES_PER_SERVING = 1000;
export const MIN_CALORIES_PER_SERVING = 0;

export const getProgressBarWidth = (
  current: number,
  target: number
): string => {
  const percentage = (current / target) * 100;
  return `${Math.min(percentage, 100)}%`;
};

export const getProgressColor = (current: number, target: number): string => {
  const percentage = (current / target) * 100;
  if (percentage > 110) return "bg-red-500";
  if (percentage > 90 && percentage <= 95) return "bg-yellow-500";
  return "bg-green-500";
};

export const getNutrientColor = (
  current: number,
  min: number,
  max: number
): string => {
  if (current < min) return "text-yellow-600";
  if (current > max) return "text-red-600";
  return "text-green-600";
};

export const ensureNumber = (value: unknown): number => {
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

export const calculateExpectedCalories = (
  protein: number,
  carbs: number,
  fat: number
): number => {
  return (
    protein * CALORIES_PER_PROTEIN +
    carbs * CALORIES_PER_CARB +
    fat * CALORIES_PER_FAT
  );
};
