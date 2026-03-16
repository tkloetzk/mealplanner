import { DAYS_OF_WEEK } from "@/constants/index";
import { Food } from "@/types/food";
import { MealPlan, MealType } from "@/types/meals";
// constants/meal-goals.ts
export const DAILY_GOALS = {
  mealCalories: {
    breakfast: 400,
    lunch: 400,
    dinner: 400,
    midmorning_snack: 200,
    afternoon_snack: 200,
    bedtime_snack: 200,
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
    calories: 1800, // Total of all meals (400 * 3 + 200 * 3)
    sodiumMax: 1500,  // Default, will be age-adjusted
  },
};

export const createDefaultMealSelection = () => ({
  grains: [],
  fruits: [],
  proteins: [],
  vegetables: [],
  milk: null,
  condiments: [],
  ranch: null,
  other: [],
});

export const DEFAULT_MEAL_PLAN: MealPlan = DAYS_OF_WEEK.reduce((plan, day) => {
  plan[day] = {
    breakfast: createDefaultMealSelection(),
    lunch: createDefaultMealSelection(),
    dinner: createDefaultMealSelection(),
    midmorning_snack: createDefaultMealSelection(),
    afternoon_snack: createDefaultMealSelection(),
    bedtime_snack: createDefaultMealSelection(),
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
  meal: ["breakfast", "lunch", "dinner"] as MealType[],
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

