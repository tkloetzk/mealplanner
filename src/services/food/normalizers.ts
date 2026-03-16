// src/services/food/normalizers.ts
//
// Each function takes a raw response shape from one data source
// and returns a FoodSearchResult with a consistent interface.

import type { Food } from "@/types/food";
import type { CategoryType, NutritionInfo } from "@/types/shared";
import type { FoodSearchResult, NutritionData } from "@/types/foodSearch";
import type { ObjectId } from "mongodb";

// ---------------------------------------------------------------------------
// 1. Local DB
// ---------------------------------------------------------------------------

type FoodDocument = Omit<Food, "id"> & { _id: ObjectId };

export function normalizeLocalFood(doc: FoodDocument): FoodSearchResult {
  const nutrition: NutritionData = {
    calories: doc.calories,
    protein: doc.protein,
    carbs: doc.carbs,
    fat: doc.fat,
    sodium: doc.sodium,
    sugar: doc.sugar,
    saturatedFat: doc.saturatedFat,
    fiber: doc.fiber,
    transFat: doc.transFat,
    cholesterol: doc.cholesterol,
  };

  return {
    id: doc._id.toString(),
    source: "local",
    name: doc.name,
    image: doc.cloudinaryUrl ?? doc.imageUrl,
    nutrition,
    servingSize: doc.servingSize,
    servingSizeUnit: doc.servingSizeUnit,
    servingSizes: doc.servingSizes,
    baseNutritionPer100g: doc.baseNutritionPer100g,
    category: doc.category,
    ingredients: doc.ingredients,
    ingredientText: doc.ingredientText,
    upc: doc.upc,
    confidence: "exact",
    additives: doc.additives,
    novaGroup: doc.novaGroup,
    nutrientLevels: doc.nutrientLevels,
    score: doc.score,
  };
}

// ---------------------------------------------------------------------------
// 2. Open Food Facts — text search result (lightweight, from cgi/search.pl)
// ---------------------------------------------------------------------------

/** Minimal shape returned per product in OFF v1 text search */
export interface OFFSearchProduct {
  code: string;
  product_name?: string;
  image_front_thumb_url?: string;
  image_front_small_url?: string;
  nutriments?: OFFNutriments;
  serving_quantity?: string;
  serving_quantity_unit?: string;
  serving_size_imported?: string;
  ingredients_text?: string;
  ingredients?: Array<{ percent_estimate: number; text: string }>;
  ingredients_hierarchy?: string[];
  ingredients_percent_analysis?: number;
  nova_group?: number;
  nutrient_levels?: {
    fat: string;
    salt: string;
    "saturated-fat": string;
    sugars: string;
  };
  nutriscore_grade?: string;
  additives_tags?: string[];
  categories_tags_en?: string[];
}

export interface OFFNutriments {
  "energy-kcal_serving"?: number;
  "energy-kcal_value"?: number;
  "energy-kcal_100g"?: number;
  proteins_serving?: number;
  proteins_value?: number;
  proteins_100g?: number;
  carbohydrates_serving?: number;
  carbohydrates_value?: number;
  carbohydrates_100g?: number;
  fat_serving?: number;
  fat_value?: number;
  fat_100g?: number;
  "saturated-fat_serving"?: number;
  "saturated-fat_100g"?: number;
  sugars_serving?: number;
  sugars_100g?: number;
  sodium_serving?: number;
  sodium_100g?: number;
  fiber_serving?: number;
  fiber_100g?: number;
  "trans-fat_serving"?: number;
  "trans-fat_100g"?: number;
  cholesterol_serving?: number;
  cholesterol_100g?: number;
}

const UNIT_MAP: Record<string, string> = {
  g: "g",
  ml: "ml",
  oz: "oz",
  cup: "cup",
  tbsp: "tbsp",
  tablespoon: "tbsp",
  tsp: "tsp",
  teaspoon: "tsp",
};

const GRAM_CONVERSIONS: Record<string, number> = {
  g: 1,
  ml: 1,
  oz: 28.35,
  cup: 240,
  tbsp: 15,
  tsp: 5,
  piece: 50,
};

function stripMojibake(text: string): string {
  return text
    .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\uD7FF\uE000-\uFFFD]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function safeNum(val: number | undefined | null, fallback = 0): number {
  if (val == null || isNaN(val)) return fallback;
  return val;
}

function parseOFFNutrition(n: OFFNutriments): NutritionData {
  return {
    calories: Math.round(safeNum(n["energy-kcal_serving"] ?? n["energy-kcal_value"])),
    protein: Math.round(safeNum(n.proteins_serving ?? n.proteins_value)),
    carbs: Math.round(safeNum(n.carbohydrates_serving ?? n.carbohydrates_value)),
    fat: Math.round(safeNum(n.fat_serving ?? n.fat_value)),
    saturatedFat: safeNum(n["saturated-fat_serving"]),
    sugar: safeNum(n.sugars_serving),
    sodium: Math.round(safeNum(n.sodium_serving) * 1000),
    fiber: safeNum(n.fiber_serving),
    transFat: safeNum(n["trans-fat_serving"]),
    cholesterol: Math.round(safeNum(n.cholesterol_serving) * 1000),
  };
}

function parseOFF100g(n: OFFNutriments): NutritionInfo {
  return {
    calories: parseFloat((safeNum(n["energy-kcal_100g"])).toFixed(0)),
    protein: parseFloat((safeNum(n.proteins_100g)).toFixed(1)),
    carbs: parseFloat((safeNum(n.carbohydrates_100g)).toFixed(1)),
    fat: parseFloat((safeNum(n.fat_100g)).toFixed(1)),
    sodium: n.sodium_100g != null ? Math.round(n.sodium_100g * 1000) : undefined,
    sugar: n.sugars_100g != null ? parseFloat(n.sugars_100g.toFixed(1)) : undefined,
    saturatedFat: n["saturated-fat_100g"] != null ? parseFloat(n["saturated-fat_100g"].toFixed(1)) : undefined,
    fiber: n.fiber_100g != null ? parseFloat(n.fiber_100g.toFixed(1)) : undefined,
    transFat: n["trans-fat_100g"] != null ? parseFloat(n["trans-fat_100g"].toFixed(1)) : undefined,
    cholesterol: n.cholesterol_100g != null ? Math.round(n.cholesterol_100g * 1000) : undefined,
  };
}

export function normalizeOFFProduct(product: OFFSearchProduct): FoodSearchResult {
  const nutriments = product.nutriments;
  const hasNutrition = nutriments != null &&
    (nutriments["energy-kcal_serving"] != null || nutriments["energy-kcal_value"] != null);

  const rawUnit = (product.serving_quantity_unit ?? "g").toLowerCase();
  const servingUnit = UNIT_MAP[rawUnit] ?? "g";
  const servingAmount = parseFloat(product.serving_quantity ?? "1") || 1;
  const gramsEquivalent = servingAmount * (GRAM_CONVERSIONS[servingUnit] ?? 1);

  // Parse ingredient text
  let ingredientText: string[] | undefined;
  if (product.ingredients_percent_analysis === -1) {
    ingredientText = product.ingredients_hierarchy?.map((i) =>
      stripMojibake(i.replace("en:", "").replace(/-/g, " "))
    );
  } else if (product.ingredients) {
    ingredientText = product.ingredients.map(
      (i) => stripMojibake(`${i.percent_estimate}% of ${i.text}`)
    );
  }

  return {
    id: product.code,
    source: "openfoodfacts",
    name: product.product_name ?? "Unknown Product",
    image: product.image_front_thumb_url ?? product.image_front_small_url,
    nutrition: hasNutrition && nutriments ? parseOFFNutrition(nutriments) : null,
    servingSize: product.serving_quantity ?? String(servingAmount),
    servingSizeUnit: servingUnit as Food["servingSizeUnit"],
    servingSizes: [
      {
        id: `${servingAmount}-${servingUnit}`,
        label: `${servingAmount} ${servingUnit}`,
        amount: servingAmount,
        unit: servingUnit as Food["servingSizeUnit"],
        gramsEquivalent,
      },
    ],
    baseNutritionPer100g: nutriments ? parseOFF100g(nutriments) : undefined,
    ingredients: product.ingredients_text ? stripMojibake(product.ingredients_text) : undefined,
    ingredientText,
    upc: product.code,
    confidence: hasNutrition ? "exact" : "estimated",
    additives: product.additives_tags,
    novaGroup: product.nova_group,
    nutrientLevels: product.nutrient_levels,
    score: product.nutriscore_grade,
  };
}

// ---------------------------------------------------------------------------
// 3. Spoonacular (kept for future use, commented out in search route)
// ---------------------------------------------------------------------------

export interface SpoonacularSearchProduct {
  id: number;
  title: string;
  image?: string;
}

export function normalizeSpoonacularResult(
  product: SpoonacularSearchProduct
): FoodSearchResult {
  return {
    id: `sp-${product.id}`,
    source: "spoonacular",
    name: product.title,
    image: product.image,
    nutrition: null, // Spoonacular search results don't include nutrition
    confidence: "exact", // Will be exact once detail-fetched
  };
}

// ---------------------------------------------------------------------------
// 4. Gemini AI estimate
// ---------------------------------------------------------------------------

export interface AIEstimateResponse {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  saturatedFat?: number;
  servingSize: string;
  servingSizeUnit: string;
  category: string;
}

const VALID_CATEGORIES: ReadonlySet<string> = new Set<CategoryType>([
  "proteins", "grains", "fruits", "vegetables", "milk", "other",
]);

export function normalizeAIEstimate(raw: AIEstimateResponse): FoodSearchResult {
  const category = VALID_CATEGORIES.has(raw.category as CategoryType)
    ? (raw.category as CategoryType)
    : "other";

  const validUnits = new Set(["g", "ml", "piece", "cup", "tbsp", "oz", "tsp"]);
  const unit = validUnits.has(raw.servingSizeUnit) ? raw.servingSizeUnit : "g";

  return {
    id: `ai-${Date.now()}`,
    source: "ai",
    name: raw.name,
    nutrition: {
      calories: Math.round(safeNum(raw.calories)),
      protein: Math.round(safeNum(raw.protein)),
      carbs: Math.round(safeNum(raw.carbs)),
      fat: Math.round(safeNum(raw.fat)),
      fiber: raw.fiber != null ? safeNum(raw.fiber) : undefined,
      sugar: raw.sugar != null ? safeNum(raw.sugar) : undefined,
      sodium: raw.sodium != null ? safeNum(raw.sodium) : undefined,
      saturatedFat: raw.saturatedFat != null ? safeNum(raw.saturatedFat) : undefined,
    },
    servingSize: raw.servingSize ?? "1",
    servingSizeUnit: unit as Food["servingSizeUnit"],
    category,
    confidence: "estimated",
  };
}

// ---------------------------------------------------------------------------
// Helper: Convert a FoodSearchResult into a Partial<Food> for FoodEditor
// ---------------------------------------------------------------------------

export function searchResultToPartialFood(result: FoodSearchResult): Partial<Food> {
  return {
    name: result.name,
    calories: result.nutrition?.calories ?? 0,
    protein: result.nutrition?.protein ?? 0,
    carbs: result.nutrition?.carbs ?? 0,
    fat: result.nutrition?.fat ?? 0,
    sodium: result.nutrition?.sodium,
    sugar: result.nutrition?.sugar,
    saturatedFat: result.nutrition?.saturatedFat,
    fiber: result.nutrition?.fiber,
    transFat: result.nutrition?.transFat,
    cholesterol: result.nutrition?.cholesterol,
    servingSize: result.servingSize ?? "1",
    servingSizeUnit: result.servingSizeUnit ?? "g",
    servingSizes: result.servingSizes,
    baseNutritionPer100g: result.baseNutritionPer100g,
    category: result.category ?? "other",
    meal: ["breakfast", "lunch", "dinner"],
    ingredients: result.ingredients,
    ingredientText: result.ingredientText,
    upc: result.upc,
    imageUrl: result.image,
    additives: result.additives,
    novaGroup: result.novaGroup,
    nutrientLevels: result.nutrientLevels,
    score: result.score,
  };
}
