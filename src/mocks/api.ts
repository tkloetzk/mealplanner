import type { Food } from "@/types/food";
import type { MealHistoryRecord } from "@/types/meals";
import type { CategoryType } from "@/types/shared";

/**
 * Mock food data for testing
 *
 * Nutrition values are based on standard nutritional databases and AAP/AHA recommendations
 * for pediatric nutrition. These values are for demonstration and testing purposes.
 *
 * Sources:
 * - USDA National Nutrient Database
 * - AAP/AHA pediatric nutrition guidelines
 * - Typical commercial food nutrition labels
 */
export const mockFoods: Record<CategoryType, Food[]> = {
  proteins: [
    {
      id: "protein-1",
      name: "Chicken Breast",
      calories: 165,
      protein: 31,
      carbs: 0,
      fat: 3.6,
      sodium: 65,  // mg per serving
      sugar: 0,  // g per serving
      saturatedFat: 1.1,  // g per serving
      meal: ["breakfast", "lunch", "dinner"],
      category: "proteins",
      servings: 1,
      servingSize: "1",
      servingSizeUnit: "piece",
    },
    {
      id: "protein-2",
      name: "Eggs",
      calories: 155,
      protein: 13,
      carbs: 1,
      fat: 11,
      sodium: 140,  // mg per serving
      sugar: 1.1,  // g per serving
      saturatedFat: 3.3,  // g per serving
      meal: ["breakfast", "lunch", "dinner"],
      category: "proteins",
      servings: 1,
      servingSize: "2",
      servingSizeUnit: "piece",
    },
  ],
  grains: [
    {
      id: "grain-1",
      name: "Brown Rice",
      calories: 216,
      protein: 5,
      carbs: 45,
      fat: 1.8,
      sodium: 10,  // mg per serving
      sugar: 0.7,  // g per serving
      saturatedFat: 0.4,  // g per serving
      meal: ["lunch", "dinner"],
      category: "grains",
      servings: 1,
      servingSize: "1",
      servingSizeUnit: "cup",
    },
  ],
  fruits: [
    {
      id: "fruit-1",
      name: "Apple",
      calories: 95,
      protein: 0.5,
      carbs: 25,
      fat: 0.3,
      sodium: 1,  // mg per serving
      sugar: 19,  // g per serving
      saturatedFat: 0.1,  // g per serving
      meal: ["breakfast", "afternoon_snack"],
      category: "fruits",
      servings: 1,
      servingSize: "1",
      servingSizeUnit: "piece",
    },
  ],
  vegetables: [
    {
      id: "veg-1",
      name: "Broccoli",
      calories: 34,
      protein: 2.8,
      carbs: 7,
      fat: 0.4,
      sodium: 33,  // mg per serving
      sugar: 1.4,  // g per serving
      saturatedFat: 0.1,  // g per serving
      meal: ["lunch", "dinner"],
      category: "vegetables",
      servings: 1,
      servingSize: "1",
      servingSizeUnit: "cup",
    },
  ],
  milk: [],
  ranch: [],
  condiments: [
    {
      id: "condiment-1",
      name: "Ketchup",
      calories: 17,
      protein: 0.2,
      carbs: 4.7,
      fat: 0.1,
      sodium: 160,  // mg per serving
      sugar: 4,  // g per serving
      saturatedFat: 0,  // g per serving
      meal: ["lunch", "dinner"],
      category: "condiments",
      servings: 1,
      servingSize: "1",
      servingSizeUnit: "tbsp",
    },
  ],
  other: [
    {
      id: "other-1",
      name: "Crackers",
      calories: 142,
      protein: 2.4,
      carbs: 22,
      fat: 5.4,
      sodium: 350,  // mg per serving
      sugar: 2,  // g per serving
      saturatedFat: 1.1,  // g per serving
      meal: ["afternoon_snack"],
      category: "other",
      servings: 1,
      servingSize: "10",
      servingSizeUnit: "piece",
    },
  ],
};

export const mockMealHistory: MealHistoryRecord[] = [];

// Helper functions for tests
export const clearMockMealHistory = () => {
  mockMealHistory.length = 0;
};
