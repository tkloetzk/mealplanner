// src/types/food.ts
export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export type DayType =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type CategoryType =
  | "grains"
  | "fruits"
  | "proteins"
  | "vegetables"
  | "milk";
export type ServingSizeUnit = "g" | "ml" | "piece" | "cup" | "tbsp";

export const MILK_OPTION: Food = {
  name: "1% Milk",
  calories: 102,
  protein: 8,
  carbs: 12,
  fat: 2.4,
  servingSize: "1",
  servingSizeUnit: "cup",
  category: "milk",
  imageUrl: "/milk.png", // Add appropriate image path
};

export interface Food {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
  servingSizeUnit: ServingSizeUnit;
  category: CategoryType;
  imagePath?: string;
  imageUrl?: string;
  upc?: string;
}

export interface SelectedFood extends Food {
  servings: number;
  adjustedCalories: number;
  adjustedProtein: number;
  adjustedCarbs: number;
  adjustedFat: number;
}

export interface MealSelection {
  grains: SelectedFood | null;
  fruits: SelectedFood | null;
  proteins: SelectedFood | null;
  vegetables: SelectedFood | null;
  milk: SelectedFood | null;
}

export interface DayMeals {
  breakfast: MealSelection;
  lunch: MealSelection;
  dinner: MealSelection;
  snack: MealSelection;
}

export interface MealPlan {
  [key: string]: DayMeals;
}

export interface MealHistoryEntry {
  date: string;
  meal: MealType;
  selections: MealSelection;
}

export interface NutritionSummary {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}
