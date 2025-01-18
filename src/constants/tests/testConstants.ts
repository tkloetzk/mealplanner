// src/test/testConstants.ts
import { MealType, DayType, CategoryType, ServingSizeUnit } from "@/types/food";
import { Kid } from "@/types/user";

// Constant for selected day
export const SELECTED_DAY: DayType = "sunday";

// Mock Kids
export const MOCK_KIDS: Kid[] = [
  { id: "kid1", name: "Child One" },
  { id: "kid2", name: "Child Two" },
];

// Mock Foods
export const MOCK_FOODS = {
  proteins: [
    {
      id: "1",
      name: "Chicken Breast",
      category: "proteins" as CategoryType,
      calories: 165,
      protein: 31,
      carbs: 0.1,
      fat: 3.6,
      meal: ["breakfast", "lunch", "dinner"] as const,
      servingSize: "1",
      servingSizeUnit: "piece" as ServingSizeUnit,
    },
    // Add more protein foods
  ],
  fruits: [
    {
      id: "2",
      name: "Apple",
      category: "fruits" as const,
      calories: 95,
      protein: 0.5,
      carbs: 25,
      fat: 0.3,
      meal: ["breakfast", "lunch", "dinner"] as const,
      servingSize: "1",
      servingSizeUnit: "piece" as ServingSizeUnit, // Explicitly type as ServingSizeUnit
    },
    // Add more fruit foods
  ],
  vegetables: [
    {
      id: "3",
      name: "Broccoli",
      category: "vegetables" as CategoryType,
      calories: 55,
      protein: 4,
      carbs: 11,
      fat: 0.6,
      meal: ["lunch", "dinner"] as const,
      servingSize: "1",
      servingSizeUnit: "cup" as ServingSizeUnit,
    },
    // Add more vegetable foods
  ],
};

// Meal Types
export const BREAKFAST: MealType = "breakfast";
export const LUNCH: MealType = "lunch";
export const DINNER: MealType = "dinner";
export const SNACK: MealType = "snack";

// Category Types
export const PROTEINS: CategoryType = "proteins";
export const FRUITS: CategoryType = "fruits";
export const VEGETABLES: CategoryType = "vegetables";
export const GRAINS: CategoryType = "grains";
