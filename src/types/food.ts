// src/types/food.ts
import { CATEGORY_STYLES, DAYS_OF_WEEK, MEAL_TYPES } from "@/constants";
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
