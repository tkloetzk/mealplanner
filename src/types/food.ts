// src/types/food.ts
import { ObjectId } from "mongodb";
import { MealType } from "./meals";

// Constants that should be in constants/index.ts
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

export interface MealSelection {
  grains: SelectedFood | null;
  fruits: SelectedFood | null;
  proteins: SelectedFood | null;
  vegetables: SelectedFood | null;
  milk: SelectedFood | null;
  ranch: SelectedFood | null;
  condiments: SelectedFood[]; // Array of condiment selections
  other: SelectedFood | null;
}

export interface DayMeals {
  breakfast: MealSelection;
  lunch: MealSelection;
  dinner: MealSelection;
  snack: MealSelection;
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

export interface Food {
  id: string;
  name: string;
  category: CategoryType;
  meal: MealType[];
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  hiddenFromChild?: boolean;
  adjustedCalories: number;
  adjustedProtein: number;
  adjustedCarbs: number;
  adjustedFat: number;
  servingSize: string;
  servingSizeUnit: ServingSizeUnit;
  servingSizeImported?: string;
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
  analysis?: FoodScoreAnalysis;
  subcategory?: string;
  recommendedUses?: string[];
  maxServingsPerMeal?: number;
  isCondiment?: boolean;
}

export interface SelectedFood extends Food {
  servings: number;
  adjustedCalories: number;
  adjustedProtein: number;
  adjustedCarbs: number;
  adjustedFat: number;
}

export interface FoodConsumption {
  name: string;
  percentageEaten: number;
  notes?: string;
}

export interface ConsumptionData {
  foods: FoodConsumption[];
  summary: string;
}

export interface NutritionSummary {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface FoodDocument extends Food {
  _id: ObjectId;
}
