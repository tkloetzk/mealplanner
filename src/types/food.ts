import { CATEGORY_STYLES, DAYS_OF_WEEK, MEAL_TYPES } from "@/constants";

// src/types/food.ts
export type MealType = (typeof MEAL_TYPES)[number];
export type DayType = (typeof DAYS_OF_WEEK)[number];
export type CategoryType = keyof typeof CATEGORY_STYLES;
export interface MealSelection {
  grains: SelectedFood | null;
  fruits: SelectedFood | null;
  proteins: SelectedFood | null;
  vegetables: SelectedFood | null;
  milk: SelectedFood | null;
  ranch: SelectedFood | null;
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
export type ServingSizeUnit =
  | "g"
  | "ml"
  | "piece"
  | "cup"
  | "tbsp"
  | "oz"
  | "tsp";

export interface Food {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
  servingSizeUnit: ServingSizeUnit;
  category: CategoryType;
  meal: readonly MealType[]; // Use readonly to prevent mutation
  cloudinaryUrl?: string;
  imagePath?: string; // public
  imageUrl?: string; // openfooddatabase
  upc?: string;
  ingredients?: string;
  novaGroup?: number;
  nutrientLevels?: {
    fat: string;
    salt: string;
    ["saturated-fat"]: string;
    sugars: string;
  };
  score?: string;
  additives?: string[];
}

export interface SelectedFood extends Food {
  servings: number;
  adjustedCalories: number;
  adjustedProtein: number;
  adjustedCarbs: number;
  adjustedFat: number;
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
