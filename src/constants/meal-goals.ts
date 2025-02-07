import { DAYS_OF_WEEK } from "@/constants/index";
import { Food } from "@/types/food";
import { MealPlan, MealType } from "@/types/meals";
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
      min: 35,
      max: 49,
    },
    calories: 1400, // Total of all meals (400 * 3 + 200)
  },
};

export const createDefaultMealSelection = () => ({
  grains: null,
  fruits: null,
  proteins: null,
  vegetables: null,
  milk: null,
  condiments: [],
  ranch: null,
  other: null,
});

export const DEFAULT_MEAL_PLAN: MealPlan = DAYS_OF_WEEK.reduce((plan, day) => {
  plan[day] = {
    breakfast: createDefaultMealSelection(),
    lunch: createDefaultMealSelection(),
    dinner: createDefaultMealSelection(),
    snack: createDefaultMealSelection(),
  };
  return plan;
}, {} as MealPlan);

export const MILK_OPTION: Food = {
  id: "milk",
  name: "2% Milk",
  servings: 1,
  adjustedCalories: 140,
  adjustedProtein: 10,
  adjustedCarbs: 14,
  adjustedFat: 5,
  calories: 140,
  protein: 10,
  carbs: 14,
  fat: 5,
  servingSize: "1",
  servingSizeUnit: "cup",
  meal: ["breakfast", "lunch", "dinner", "snack"] as MealType[],
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
  id: "ranch1",
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
  recommendedUses: ["proteins", "vegetables"],
  ingredients:
    "vegetable oil (soybean and/or canola), water, sugar, salt, nonfat buttermilk, egg yolk, natural flavors, less than 1% of: spices, garlic*, onion*, vinegar, phosphoric acid, xanthan gum, modified food starch, monosodium glutamate, artificial flavors, disodium phosphate, sorbic acid and calcium disodium edta added to preserve freshness, disodium inosinate , guanylate,",
} as const;
