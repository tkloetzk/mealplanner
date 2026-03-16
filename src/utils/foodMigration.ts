import { Food, ServingSizeOption, ServingSizeUnit } from "@/types/food";
import { NutritionInfo } from "@/types/shared";

/**
 * Estimates gram equivalent based on common unit conversions
 */
function estimateGramsEquivalent(
  amount: number,
  unit: ServingSizeUnit,
  food: Food
): number {
  const conversions: Record<ServingSizeUnit, number> = {
    g: 1,
    ml: 1, // Assume water density for liquids
    oz: 28.35,
    cup: 240, // Generic cup conversion
    tbsp: 15,
    tsp: 5,
    piece: 50, // Generic default for pieces
  };

  return amount * (conversions[unit] || 50);
}

/**
 * Normalizes food data to ensure all foods have the new servingSizes format.
 * Converts legacy single serving size format to the new multi-serving format on-the-fly.
 *
 * @param food - Food object in either old or new format
 * @returns Food object in new format with servingSizes and baseNutritionPer100g
 */
export function normalizeFoodData(food: Food): Food {
  // If already has servingSizes and baseNutritionPer100g, it's new format - return as-is
  if (food.servingSizes && food.baseNutritionPer100g) {
    return food;
  }

  // Convert old format to new format
  const servingAmount = parseFloat(food.servingSize || "1");
  const servingUnit = food.servingSizeUnit || "piece";

  // Estimate the gram equivalent for the legacy serving size
  const gramsEquivalent = estimateGramsEquivalent(
    servingAmount,
    servingUnit,
    food
  );

  // Create a single serving size option that matches the original
  const servingSizeOption: ServingSizeOption = {
    id: `${servingAmount}-${servingUnit}`,
    label: `${servingAmount} ${servingUnit}`,
    amount: servingAmount,
    unit: servingUnit,
    gramsEquivalent,
  };

  // Calculate base nutrition per 100g from the current nutrition values
  // Current nutrition represents one serving of the specified size
  const baseNutritionPer100g: NutritionInfo = {
    calories: (food.calories / gramsEquivalent) * 100,
    protein: (food.protein / gramsEquivalent) * 100,
    carbs: (food.carbs / gramsEquivalent) * 100,
    fat: (food.fat / gramsEquivalent) * 100,
    sodium:
      food.sodium !== undefined
        ? (food.sodium / gramsEquivalent) * 100
        : undefined,
    sugar:
      food.sugar !== undefined ? (food.sugar / gramsEquivalent) * 100 : undefined,
    saturatedFat:
      food.saturatedFat !== undefined
        ? (food.saturatedFat / gramsEquivalent) * 100
        : undefined,
  };

  return {
    ...food,
    servingSizes: [servingSizeOption],
    baseNutritionPer100g,
  };
}

/**
 * Calculates nutrition for a specific serving size option and quantity
 *
 * @param baseNutritionPer100g - Base nutrition values per 100g
 * @param gramsEquivalent - Weight in grams of one serving
 * @param servings - Number of servings (quantity multiplier)
 * @returns Calculated nutrition values
 */
export function calculateNutritionForServing(
  baseNutritionPer100g: NutritionInfo,
  gramsEquivalent: number,
  servings: number
): NutritionInfo {
  const gramsTotal = gramsEquivalent * servings;
  const factor = gramsTotal / 100;

  return {
    calories: baseNutritionPer100g.calories * factor,
    protein: baseNutritionPer100g.protein * factor,
    carbs: baseNutritionPer100g.carbs * factor,
    fat: baseNutritionPer100g.fat * factor,
    sodium:
      baseNutritionPer100g.sodium !== undefined
        ? baseNutritionPer100g.sodium * factor
        : undefined,
    sugar:
      baseNutritionPer100g.sugar !== undefined
        ? baseNutritionPer100g.sugar * factor
        : undefined,
    saturatedFat:
      baseNutritionPer100g.saturatedFat !== undefined
        ? baseNutritionPer100g.saturatedFat * factor
        : undefined,
  };
}
