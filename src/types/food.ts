// src/types/food.ts
import { ObjectId } from "mongodb";
import {
  CategoryType,
  MealType,
  NutritionInfo,
  AdjustedNutritionInfo,
} from "./shared";

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

export interface Food extends NutritionInfo {
  id: string;
  name: string;
  category: CategoryType;
  meal: MealType[];
  servings: number;
  hiddenFromChild?: boolean;
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

export interface SelectedFood extends Food, AdjustedNutritionInfo {
  servings: number;
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
