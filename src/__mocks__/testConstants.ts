// src/test/testConstants.ts
import { CategoryType, ServingSizeUnit } from "@/types/food";
import { Kid } from "@/types/user";
import { BREAKFAST, LUNCH, DINNER, DAYS_OF_WEEK } from "@/constants";
import { RANCH_OPTION } from "@/constants/meal-goals";
// Constant for selected day
export const SELECTED_DAY = DAYS_OF_WEEK[6];

// Mock Kids
export const MOCK_KIDS: Kid[] = [
  { id: "kid1", name: "Child One" },
  { id: "kid2", name: "Child Two" },
];

// Category Types
export const PROTEINS = "proteins";
export const FRUITS = "fruits";
export const VEGETABLES = "vegetables";
export const GRAINS = "grains";
export const OTHER = "other";

// Mock Foods
export const MOCK_FOODS = {
  proteins: [
    {
      id: "1",
      name: "Chicken Breast",
      category: PROTEINS,
      calories: 165,
      protein: 31,
      carbs: 0.1,
      fat: 3.6,
      meal: [BREAKFAST, LUNCH, DINNER],
      servingSize: "1",
      servingSizeUnit: "piece" as ServingSizeUnit,
      hiddenFromKids: false,
    },
    {
      id: "4",
      name: "Not a breakfast food",
      category: "proteins" as CategoryType,
      calories: 100,
      protein: 30,
      carbs: 0.1,
      fat: 34.6,
      meal: [LUNCH, DINNER],
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
      meal: [BREAKFAST, LUNCH, DINNER],
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
      meal: [LUNCH, DINNER],
      servingSize: "1",
      servingSizeUnit: "cup" as ServingSizeUnit,
    },
    // Add more vegetable foods
  ],
  other: [
    {
      id: "5",
      name: "Mixed Snack Plate",
      calories: 200,
      protein: 5,
      carbs: 25,
      fat: 10,
      servingSize: "1",
      servingSizeUnit: "plate" as ServingSizeUnit,
      category: "other" as CategoryType,
      meal: [BREAKFAST, LUNCH, DINNER, "snack"],
      hiddenFromChild: true,
    },
    {
      id: "6",
      name: "Visible Snack",
      calories: 150,
      protein: 3,
      carbs: 20,
      fat: 5,
      servingSize: "1",
      servingSizeUnit: "serving" as ServingSizeUnit,
      category: "other" as CategoryType,
      meal: [BREAKFAST, LUNCH],
      hiddenFromChild: false,
    },
  ],
  condiments: [RANCH_OPTION],
};
