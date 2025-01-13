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
export type ServingSizeUnit =
  | "g"
  | "ml"
  | "piece"
  | "cup"
  | "tbsp"
  | "oz"
  | "tsp";

export const MILK_OPTION: Food = {
  name: "2% Milk",
  calories: 140,
  protein: 10,
  carbs: 14,
  fat: 5,
  servingSize: "1",
  servingSizeUnit: "cup",
  meal: ["breakfast", "lunch", "dinner"],
  upc: "085239284063",
  category: "milk",
  ingredients: "reduced fat milk, vitamin d3, vitamin a palmitate.",
  novaGroup: 1,
  nutrientLevels: {
    fat: "low",
    salt: "low",
    "saturated-fat": "low",
    sugars: "moderate",
  },
  score: "c",
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
  meal: MealType[]; // New field for meal compatibility
  imagePath?: string;
  imageUrl?: string;
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

export interface MealSelection {
  grains: SelectedFood | null;
  fruits: SelectedFood | null;
  proteins: SelectedFood | null;
  vegetables: SelectedFood | null;
  milk: SelectedFood | null;
  ranch: SelectedFood | null; // Adding ranch to the MealSelection type
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
