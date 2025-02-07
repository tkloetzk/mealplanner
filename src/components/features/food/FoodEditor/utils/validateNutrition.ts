// utils/NutritionValidator.ts
import { Food } from "@/types/food";
import {
  calculateExpectedCalories,
  MAX_CALORIES_PER_SERVING,
  MIN_CALORIES_PER_SERVING,
} from "@/utils/nutritionUtils";

export function validateNutrition(foodData: Partial<Food>): string[] {
  const errors: string[] = [];

  // Basic range checks
  if (
    foodData.calories! < MIN_CALORIES_PER_SERVING ||
    foodData.calories! > MAX_CALORIES_PER_SERVING
  ) {
    errors.push(
      `Calories should be between ${MIN_CALORIES_PER_SERVING} and ${MAX_CALORIES_PER_SERVING}`
    );
  }

  if (foodData.protein! < 0) errors.push("Protein cannot be negative");
  if (foodData.carbs! < 0) errors.push("Carbs cannot be negative");
  if (foodData.fat! < 0) errors.push("Fat cannot be negative");

  // Calculate expected calories from macronutrients
  const expectedCalories = calculateExpectedCalories(
    foodData.protein!,
    foodData.carbs!,
    foodData.fat!
  );

  // Allow for some rounding differences (±10 calories)
  if (Math.abs(expectedCalories - foodData.calories!) > 10) {
    console.log("Calories don't match the macronutrient totals");
    //    errors.push("Calories don't match the macronutrient totals");
  }

  // Validate serving size
  if (parseFloat(foodData.servingSize!) <= 0) {
    errors.push("Serving size must be greater than 0");
  }

  // Validate meal compatibility
  if (!foodData.meal?.length) {
    errors.push("Select at least one compatible meal type");
  }

  console.log(errors);
  return errors;
}

export function isValidFood(food: Partial<Food>): food is Food {
  return !!(
    food.name &&
    food.calories !== undefined &&
    food.category &&
    food.meal?.length
  );
}
