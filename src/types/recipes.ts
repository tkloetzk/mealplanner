import { CategoryType, MealType, NutritionInfo } from "./shared";
import { ServingSizeUnit } from "./food";
import { ObjectId } from "mongodb";

export interface RecipeIngredient {
  name: string;                        // Display name; fallback label if foodId is deleted
  amount: number;
  unit: ServingSizeUnit;
  foodId?: string;                     // Primary reference — resolved to live Food at calc time
  upc?: string;                        // Alternate lookup key (barcode scanning)
  nutritionSnapshot?: NutritionInfo;   // Fallback when foodId can't be resolved
}

export interface Recipe {
  id: string;
  name: string;
  description?: string;
  ingredients: RecipeIngredient[];
  instructions: string[];
  servings: number;
  totalNutrition: NutritionInfo;
  category: CategoryType;
  meal: MealType[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RecipeDocument extends Omit<Recipe, "id"> {
  _id: ObjectId;
}

export interface CreateRecipeInput {
  name: string;
  description?: string;
  ingredients: Array<{
    foodId: string;
    amount: number;
    unit: ServingSizeUnit;
  }>;
  instructions: string[];
  servings: number;
  category: CategoryType;
  meal: MealType[];
}

export interface RecipeOperationResult<T = Recipe> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
}

export interface RecipeFilters {
  category?: CategoryType;
  meal?: MealType;
  search?: string;
}
