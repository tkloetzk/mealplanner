import { Food, MealPlan } from "@/types/food";
import { DAYS_OF_WEEK } from ".";

// constants/meal-goals.ts
export const DAILY_GOALS = {
  mealCalories: {
    breakfast: 400,
    lunch: 400,
    dinner: 400,
    snack: 200,
  },
  dailyTotals: {
    protein: {
      min: 20,
      max: 25,
    },
    fat: {
      min: 33,
      max: 62,
    },
    calories: 1400, // Total of all meals (400 * 3 + 200)
  },
};

export const defaultObj = {
  grains: null,
  fruits: null,
  proteins: null,
  vegetables: null,
  milk: null,
  ranch: null,
};

export const DEFAULT_MEAL_PLAN: MealPlan = DAYS_OF_WEEK.reduce((plan, day) => {
  plan[day] = {
    breakfast: defaultObj,
    lunch: defaultObj,
    dinner: defaultObj,
    snack: defaultObj,
  };
  return plan;
}, {} as MealPlan);

export const MILK_OPTION: Food = {
  name: "2% Milk",
  calories: 140,
  protein: 10,
  carbs: 14,
  fat: 5,
  servingSize: "1",
  servingSizeUnit: "cup",
  meal: ["breakfast", "lunch", "dinner"],
  upc: "085239284063",
  category: "milk",
  ingredients: "reduced fat milk, vitamin d3, vitamin a palmitate.",
  novaGroup: 1,
  nutrientLevels: {
    fat: "low",
    salt: "low",
    "saturated-fat": "low",
    sugars: "moderate",
  },
  score: "c",
};

export const RANCH_OPTION = {
  name: "Ranch Dressing",
  calories: 65,
  protein: 0,
  carbs: 0.5,
  fat: 6.5,
  servingSize: "1",
  servingSizeUnit: "tbsp" as const,
  category: "condiments" as const,
  meal: ["breakfast", "lunch", "dinner", "snack"], // Add meal compatibility
  score: "e",
  upc: "071100005509",
  novaGroup: 4,
  nutrientLevels: {
    fat: "high",
    salt: "high",
    "saturated-fat": "high",
    sugars: "low",
  },
  ingredients:
    "vegetable oil (soybean and/or canola), water, sugar, salt, nonfat buttermilk, egg yolk, natural flavors, less than 1% of: spices, garlic*, onion*, vinegar, phosphoric acid, xanthan gum, modified food starch, monosodium glutamate, artificial flavors, disodium phosphate, sorbic acid and calcium disodium edta added to preserve freshness, disodium inosinate , guanylate,",
} as const;
