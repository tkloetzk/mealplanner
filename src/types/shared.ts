// Common type definitions shared across the application

export const CATEGORY_STYLES = {
  proteins: "proteins",
  grains: "grains",
  fruits: "fruits",
  vegetables: "vegetables",
  milk: "milk",
  ranch: "ranch",
  condiments: "condiments",
  other: "other",
} as const;

export type CategoryType = keyof typeof CATEGORY_STYLES;

export type MealType =
  | "breakfast"
  | "lunch"
  | "dinner"
  | "midmorning_snack"
  | "afternoon_snack"
  | "bedtime_snack";

export type DayType =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface AdjustedNutritionInfo extends NutritionInfo {
  adjustedCalories: number;
  adjustedProtein: number;
  adjustedCarbs: number;
  adjustedFat: number;
}

export interface FoodConsumptionStatus {
  foodId: string;
  status: "not_eaten" | "partially_eaten" | "eaten";
  percentageEaten?: number;
  notes?: string;
}

export interface ConsumptionInfo {
  foods: FoodConsumptionStatus[];
  overallStatus: "offered" | "partially_eaten" | "eaten";
  notes?: string;
}
