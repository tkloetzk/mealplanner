import { DayType, MealPlan } from "@/types/food";

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

export const DAYS_OF_WEEK: DayType[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];
export const defaultObj = {
  grains: null,
  fruits: null,
  proteins: null,
  vegetables: null,
  milk: null,
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
