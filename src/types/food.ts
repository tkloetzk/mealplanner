// src/types/food.ts
import { CATEGORY_TYPES, MEAL_TYPES, DAYS_OF_WEEK } from "@/constants";

export type CategoryType = (typeof CATEGORY_TYPES)[keyof typeof CATEGORY_TYPES];
export type MealType = (typeof MEAL_TYPES)[keyof typeof MEAL_TYPES];
export type DayType = (typeof DAYS_OF_WEEK)[keyof typeof DAYS_OF_WEEK];
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
  id: string;
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
  _id?: string;
}

// export interface MealHistoryRecord {
//   kidId: string;
//   date: Date;
//   meal: MealType;
//   selections: MealSelection;
//   consumptionData?: {
//     foods: {
//       name: string;
//       percentageEaten: number;
//       notes?: string;
//     }[];
//     summary: string;
//   };
// }

export interface NutritionSummary {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// src/types/food.ts

// Add this interface to track consumption data
interface FoodConsumption {
  name: string;
  percentageEaten: number;
  notes?: string;
}

// Update MealHistoryRecord to include consumption data
export interface MealHistoryRecord {
  kidId: string;
  date: Date;
  meal: MealType;
  selections: MealSelection;
  consumptionData?: {
    foods: FoodConsumption[];
    summary: string;
  };
}
