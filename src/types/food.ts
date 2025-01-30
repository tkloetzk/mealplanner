// src/types/food.ts
import {
  CATEGORY_STYLES,
  CondimentSelection,
  DAYS_OF_WEEK,
  MEAL_TYPES,
} from "@/constants";
import { ObjectId } from "mongodb";

export interface FoodDocument extends Food {
  _id: ObjectId;
}

export type CategoryType =
  (typeof CATEGORY_STYLES)[keyof typeof CATEGORY_STYLES];
export type MealType = (typeof MEAL_TYPES)[keyof typeof MEAL_TYPES];
export type DayType = (typeof DAYS_OF_WEEK)[keyof typeof DAYS_OF_WEEK];

export interface MealSelection {
  grains: SelectedFood | null;
  fruits: SelectedFood | null;
  proteins: SelectedFood | null;
  vegetables: SelectedFood | null;
  milk: SelectedFood | null;
  ranch: SelectedFood | null;
  condiments: CondimentSelection[]; // Now an array of selections
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

export interface FoodScoreAnalysis {
  score: string;
  summary: string;
  positives: string[];
  negatives: string[];
}
// src/types/food.ts

export interface Food {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
  servingSizeUnit: ServingSizeUnit;
  servingSizeImported?: string;
  category: CategoryType;
  meal: MealType[];
  cloudinaryUrl?: string;
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
  hiddenFromChild?: boolean;
  analysis?: FoodScoreAnalysis; // Updated to use FoodScoreAnalysis type
  subcategory?: string; // For organizing condiments (e.g., "spreads", "dressings", "sauces")
  recommendedUses?: string[]; // e.g., ["breads", "vegetables", "proteins"]
  maxServingsPerMeal?: number; // Optional limit on servings
  isCondiment?: boolean; // Quick flag to identify condiments
}

export interface SelectedFood extends Food {
  servings: number;
  adjustedCalories: number;
  adjustedProtein: number;
  adjustedCarbs: number;
  adjustedFat: number;
}

interface FoodConsumption {
  name: string;
  percentageEaten: number;
  notes?: string;
}

export interface ConsumptionData {
  foods: FoodConsumption[];
  summary: string;
}

// export interface MealHistoryRecord {
//   _id: string;
//   kidId: string;
//   date: Date;
//   meal: MealType;
//   selections: MealSelection;
//   consumptionData?: ConsumptionData; // Add this optional field
// }

// Define an interface that extends MongoDB Document
export interface MealHistoryRecord extends Document {
  _id?: ObjectId;
  kidId: string;
  date: Date;
  meal: MealType;
  selections: MealSelection;
  consumptionData?: {
    foods: Array<{
      name: string;
      percentageEaten: number;
      notes?: string;
    }>;
    summary?: string;
  };
}

export interface NutritionSummary {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// Add this interface to track consumption data
// interface FoodConsumption {
//   name: string;
//   percentageEaten: number;
//   notes?: string;
// }

// Update MealHistoryRecord to include consumption data
