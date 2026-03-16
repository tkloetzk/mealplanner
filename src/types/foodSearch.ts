// src/types/foodSearch.ts
// Unified types for the food search cascade:
//   1. Local DB  →  2. Open Food Facts  →  3. Gemini AI estimate

import type { NutritionInfo, CategoryType } from "./shared";
import type { ServingSizeUnit, ServingSizeOption } from "./food";

/** Where the search result originated */
export type FoodSource = "local" | "openfoodfacts" | "spoonacular" | "ai";

/** Confidence level of the nutrition data */
export type NutritionConfidence = "exact" | "estimated";

/**
 * A single search result from any source, normalized to a common shape.
 *
 * - `nutrition` is non-null when the source already provided values (local DB,
 *   Open Food Facts with nutriments, AI estimate).
 * - `nutrition` is null when a detail-fetch is still required (e.g. Spoonacular
 *   search results that only have id + title).
 */
export interface FoodSearchResult {
  /** Unique id — MongoDB ObjectId string for local, OFF barcode, Spoonacular id, or generated for AI */
  id: string;
  source: FoodSource;
  name: string;
  image?: string;
  nutrition: NutritionData | null;
  servingSize?: string;
  servingSizeUnit?: ServingSizeUnit;
  servingSizes?: ServingSizeOption[];
  baseNutritionPer100g?: NutritionInfo;
  category?: CategoryType;
  ingredients?: string;
  ingredientText?: string[];
  upc?: string;
  confidence: NutritionConfidence;
  /** Additional OFF/Spoonacular metadata preserved for downstream use */
  additives?: string[];
  novaGroup?: number;
  nutrientLevels?: {
    fat: string;
    salt: string;
    "saturated-fat": string;
    sugars: string;
  };
  score?: string;
}

/** Nutrition values attached to a search result */
export interface NutritionData extends NutritionInfo {
  // NutritionInfo already has calories, protein, carbs, fat + optional extended
}

/** Shape returned by the /api/foods/search endpoint */
export interface FoodSearchResponse {
  results: FoodSearchResult[];
  /** True when the AI estimation endpoint is available */
  aiAvailable: boolean;
}

/** Shape sent to the /api/foods/estimate endpoint */
export interface FoodEstimateRequest {
  name: string;
  servingDescription?: string;
}

/** Shape returned by the /api/foods/estimate endpoint */
export interface FoodEstimateResponse extends FoodSearchResult {
  source: "ai";
  confidence: "estimated";
}
