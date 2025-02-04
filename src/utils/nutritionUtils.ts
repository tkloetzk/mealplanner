import { MealSelection, NutritionSummary } from "@/types/food";

export const createEmptyMealSelection = (): MealSelection => ({
  proteins: null,
  fruits: null,
  vegetables: null,
  grains: null,
  milk: null,
  ranch: null,
  condiments: [],
});

export const nutritionToMealSelection = (
  nutrition: NutritionSummary
): MealSelection => ({
  ...createEmptyMealSelection(),
  proteins:
    nutrition.calories || nutrition.protein || nutrition.carbs || nutrition.fat
      ? {
          id: "total",
          name: "Total",
          calories: nutrition.calories,
          protein: nutrition.protein,
          carbs: nutrition.carbs,
          fat: nutrition.fat,
          category: "proteins",
          servings: 1,
          meal: [],
          adjustedCalories: nutrition.calories,
          adjustedProtein: nutrition.protein,
          adjustedCarbs: nutrition.carbs,
          adjustedFat: nutrition.fat,
          hiddenFromChild: false,
          servingSize: "1",
          servingSizeUnit: "piece",
        }
      : null,
});
