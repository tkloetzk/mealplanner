import { NutritionSummary } from "@/types/food";
import type { MealSelection } from "@/types/meals";
import type { FoodConsumptionStatus } from "@/types/shared";
import { MEAL_TYPES } from "@/constants";
import type { MealType } from "@/types/shared";

export const createEmptyMealSelection = (): MealSelection => ({
  proteins: [],
  fruits: [],
  vegetables: [],
  grains: [],
  milk: null,
  ranch: null,
  condiments: [],
  other: [],
});

export const nutritionToMealSelection = (
  nutrition: NutritionSummary
): MealSelection => ({
  ...createEmptyMealSelection(),
  proteins:
    nutrition.calories || nutrition.protein || nutrition.carbs || nutrition.fat
      ? [{
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
        }]
      : [],
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

/**
 * Determines the text color for sodium values based on AAP/AHA recommendations
 *
 * @param current - Current sodium intake in mg
 * @param max - Maximum recommended sodium intake in mg
 * @returns CSS class name for text color
 *
 * AAP/AHA Recommendation: Limit sodium to age-appropriate maximums
 * Color coding:
 * - Red: Above maximum recommended intake
 * - Yellow: At 80-100% of maximum (warning zone)
 * - Green: Below 80% of maximum (acceptable range)
 */
export const getSodiumColor = (
  current: number,
  _min: number,
  max: number
): string => {
  if (current > max) return "text-red-600";
  return "text-green-600";
};

/**
 * Determines the text color for sugar values based on AAP/AHA recommendations
 *
 * @param current - Current sugar intake in grams
 * @param max - Maximum recommended sugar intake in grams
 * @returns CSS class name for text color
 *
 * AAP/AHA Recommendation: Limit added sugars to less than 25g per day for children
 * Color coding:
 * - Red: Above maximum recommended intake
 * - Yellow: At 80-100% of maximum (warning zone)
 * - Green: Below 80% of maximum (acceptable range)
 */
export const getSugarColor = (
  current: number,
  _min: number,
  max: number
): string => {
  if (current > max) return "text-red-600";
  return "text-green-600";
};

/**
 * Determines the text color for saturated fat values based on AAP/AHA recommendations
 *
 * @param current - Current saturated fat intake in grams
 * @param max - Maximum recommended saturated fat intake in grams
 * @returns CSS class name for text color
 *
 * AAP/AHA Recommendation: Limit saturated fat to less than 10% of total calories
 * Color coding:
 * - Red: Above maximum recommended intake
 * - Yellow: At 80-100% of maximum (warning zone)
 * - Green: Below 80% of maximum (acceptable range)
 */
export const getSaturatedFatColor = (
  current: number,
  _min: number,
  max: number
): string => {
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

export const distributeMealCalories = (
  totalCalories: number,
  enabledMeals: string[]
): Record<string, number> => {
  if (enabledMeals.length === 0) {
    return {};
  }

  // Define default distribution percentages for different meal types
  const defaultDistribution: Record<string, number> = {
    breakfast: 0.25,
    lunch: 0.29,
    dinner: 0.31,
    midmorning_snack: 0.08,
    afternoon_snack: 0.15,
    bedtime_snack: 0.08,
  };

  // Calculate calories for enabled meals based on default distribution
  const mealCalories: Record<string, number> = {};

  // First, calculate the total percentage for enabled meals
  const totalEnabledPercentage = enabledMeals.reduce(
    (sum, meal) => sum + (defaultDistribution[meal] || 0),
    0
  );

  // If the total percentage is 0 (meaning no default distribution exists for enabled meals),
  // distribute equally
  if (totalEnabledPercentage === 0) {
    const caloriesPerMeal = Math.round(totalCalories / enabledMeals.length);
    enabledMeals.forEach(meal => {
      mealCalories[meal] = caloriesPerMeal;
    });
  } else {
    // Distribute based on the default percentages
    enabledMeals.forEach(meal => {
      const percentage = defaultDistribution[meal] || 0;
      const mealPercentage = percentage / totalEnabledPercentage;
      mealCalories[meal] = Math.round(totalCalories * mealPercentage);
    });
  }

  return mealCalories;
};

export function adjustForActivity(baseCalories: number, level: 'sedentary' | 'moderate' | 'active'): number {
  const multipliers = { sedentary: 0.9, moderate: 1.0, active: 1.15 };
  return Math.round(baseCalories * multipliers[level]);
}

const EMPTY_NUTRITION: NutritionSummary = {
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  sodium: 0,
  sugar: 0,
  saturatedFat: 0,
  fiber: 0,
  transFat: 0,
  cholesterol: 0,
};

/**
 * Accumulates a single food item's nutrition into a running totals object.
 *
 * For the core four macros (calories, protein, carbs, fat) the store
 * pre-computes `adjusted*` values that already factor in servings, so we
 * use those directly.
 *
 * For extended nutrients (sodium, sugar, saturatedFat, fiber, transFat,
 * cholesterol) no pre-computed adjusted values exist, so we multiply
 * the per-serving value by `food.servings` here to stay consistent.
 *
 * @param totals  - Mutable running totals (mutated in place for perf)
 * @param food    - The selected food item
 * @param consumptionMultiplier - 0–1 fraction representing how much was eaten
 */
function accumulateFoodNutrition(
  totals: NutritionSummary,
  food: {
    adjustedCalories?: number;
    adjustedProtein?: number;
    adjustedCarbs?: number;
    adjustedFat?: number;
    servings?: number;
    sodium?: number;
    sugar?: number;
    saturatedFat?: number;
    fiber?: number;
    transFat?: number;
    cholesterol?: number;
  },
  consumptionMultiplier: number
): void {
  const s = food.servings ?? 1;
  const m = consumptionMultiplier;

  // Core four — already scaled by servings via adjusted* fields
  totals.calories += (food.adjustedCalories || 0) * m;
  totals.protein += (food.adjustedProtein || 0) * m;
  totals.carbs += (food.adjustedCarbs || 0) * m;
  totals.fat += (food.adjustedFat || 0) * m;

  // Extended nutrients — must be scaled by servings manually
  totals.sodium = (totals.sodium ?? 0) + (food.sodium || 0) * s * m;
  totals.sugar = (totals.sugar ?? 0) + (food.sugar || 0) * s * m;
  totals.saturatedFat =
    (totals.saturatedFat ?? 0) + (food.saturatedFat || 0) * s * m;
  totals.fiber = (totals.fiber ?? 0) + (food.fiber || 0) * s * m;
  totals.transFat = (totals.transFat ?? 0) + (food.transFat || 0) * s * m;
  totals.cholesterol =
    (totals.cholesterol ?? 0) + (food.cholesterol || 0) * s * m;
}

/**
 * Pure function: calculates nutrition for a meal selection, optionally
 * adjusted by consumption data.
 */
export function computeMealNutrition(
  mealSelections: MealSelection | null | undefined,
  consumptionFoods?: FoodConsumptionStatus[]
): NutritionSummary {
  if (!mealSelections) return { ...EMPTY_NUTRITION };

  const totals = { ...EMPTY_NUTRITION };

  const getConsumptionMultiplier = (foodId: string): number => {
    if (!consumptionFoods) return 1;
    const entry = consumptionFoods.find((f) => f.foodId === foodId);
    if (!entry) return 1;
    if (entry.status === "not_eaten") return 0;
    if (
      entry.status === "partially_eaten" &&
      entry.percentageEaten !== undefined
    ) {
      return entry.percentageEaten / 100;
    }
    return 1;
  };

  Object.entries(mealSelections).forEach(([, food]) => {
    if (!food) return;
    if (Array.isArray(food)) {
      food.forEach((item) => {
        if (!item) return;
        accumulateFoodNutrition(totals, item, getConsumptionMultiplier(item.id));
      });
    } else {
      accumulateFoodNutrition(totals, food, getConsumptionMultiplier(food.id));
    }
  });

  return {
    calories: Math.round(totals.calories),
    protein: Math.round(totals.protein),
    carbs: Math.round(totals.carbs),
    fat: Math.round(totals.fat),
    sodium: Math.round(totals.sodium ?? 0),
    sugar: Math.round(totals.sugar ?? 0),
    saturatedFat: Math.round(totals.saturatedFat ?? 0),
    fiber: Math.round(totals.fiber ?? 0),
    transFat: Math.round(totals.transFat ?? 0),
    cholesterol: Math.round(totals.cholesterol ?? 0),
  };
}

/**
 * Pure function: sums nutrition across all meal types using the provided
 * per-meal function.
 */
export function computeDailyNutrition(
  mealNutritionFn: (meal: MealType) => NutritionSummary
): NutritionSummary {
  return (MEAL_TYPES as readonly MealType[]).reduce<NutritionSummary>(
    (totals, meal) => {
      const n = mealNutritionFn(meal);
      return {
        calories: totals.calories + n.calories,
        protein: totals.protein + n.protein,
        carbs: totals.carbs + n.carbs,
        fat: totals.fat + n.fat,
        sodium: (totals.sodium ?? 0) + (n.sodium ?? 0),
        sugar: (totals.sugar ?? 0) + (n.sugar ?? 0),
        saturatedFat: (totals.saturatedFat ?? 0) + (n.saturatedFat ?? 0),
        fiber: (totals.fiber ?? 0) + (n.fiber ?? 0),
        transFat: (totals.transFat ?? 0) + (n.transFat ?? 0),
        cholesterol: (totals.cholesterol ?? 0) + (n.cholesterol ?? 0),
      };
    },
    { ...EMPTY_NUTRITION }
  );
}
