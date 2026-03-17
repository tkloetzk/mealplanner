// src/types/food.ts
import { ObjectId } from "mongodb";
import { CategoryType, MealType, NutritionInfo } from "./shared";

export type ServingSizeUnit =
  | "g"
  | "ml"
  | "piece"
  | "cup"
  | "tbsp"
  | "oz"
  | "tsp";

export interface ServingSizeOption {
  id: string;
  label: string;
  amount: number;
  unit: ServingSizeUnit;
  gramsEquivalent: number;
}

export interface FoodPreparation {
  id: string;
  name: string;
  imageUrl?: string;
  cloudinaryUrl?: string;
}

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
  servingSize?: string;
  servingSizeUnit?: ServingSizeUnit;
  servingSizeImported?: string;
  servingSizes?: ServingSizeOption[];
  baseNutritionPer100g?: NutritionInfo;
  cloudinaryUrl?: string;
  imagePath?: string;
  imageUrl?: string;
  upc?: string;
  ingredients?: string;
  ingredientText?: string[];
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
  adjustedCalories?: number;
  adjustedProtein?: number;
  adjustedCarbs?: number;
  adjustedFat?: number;
  preparations?: FoodPreparation[];
  selectedPreparation?: FoodPreparation;
  /** Original recipe text the user submitted for AI analysis */
  // NOTE: consider excluding recipeText from list endpoints if payload size becomes an issue;
  // solve with a MongoDB projection that omits it from GET /api/foods and only fetches it in GET /api/foods/:id
  recipeText?: string;
  /** Total number of servings the recipe yields (distinct from servingSize) */
  recipeYield?: number;
  /** True when this food was created from a recipe analysis */
  isRecipe?: boolean;
}

export interface SelectedFood extends Food {
  servings: number;
  selectedServingSizeId?: string;
  /** Computed via adjustFoodServings() — never set manually */
  adjustedCalories: number;
  /** Computed via adjustFoodServings() — never set manually */
  adjustedProtein: number;
  /** Computed via adjustFoodServings() — never set manually */
  adjustedCarbs: number;
  /** Computed via adjustFoodServings() — never set manually */
  adjustedFat: number;
  selectedPreparation?: FoodPreparation;
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
  sodium?: number;
  sugar?: number;
  saturatedFat?: number;
  fiber?: number;
  transFat?: number;
  cholesterol?: number;
}

export interface FoodDocument extends Food {
  _id: ObjectId;
}

