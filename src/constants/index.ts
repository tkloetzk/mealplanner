// constants/index.ts
export const CATEGORY_STYLES = {
  fruits: "border-l-4 border-red-400 border-r border-t border-b",
  vegetables: "border-l-4 border-green-400 border-r border-t border-b",
  proteins: "border-l-4 border-blue-400 border-r border-t border-b",
  grains: "border-l-4 border-yellow-400 border-r border-t border-b",
  milk: "border-l-4 border-purple-400 border-r border-t border-b",
  condiments: "border-l-4 border-orange-400 border-r border-t border-b",
  other: "border-l-4 border-gray-400 border-r border-t border-b",
};

export const CATEGORY_EMOJIS = {
  fruits: "🍎",
  vegetables: "🥕",
  proteins: "🥚",
  grains: "🥖",
  milk: "🥛",
  other: "🍽️",
};

export interface CondimentSelection {
  foodId: string;
  servings: number;
  adjustedCalories: number;
  adjustedProtein: number;
  adjustedCarbs: number;
  adjustedFat: number;
}

// Meal type constants
export const BREAKFAST = "breakfast" as const;
export const LUNCH = "lunch" as const;
export const DINNER = "dinner" as const;
export const MIDMORNING_SNACK = "midmorning_snack" as const;
export const AFTERNOON_SNACK = "afternoon_snack" as const;
export const BEDTIME_SNACK = "bedtime_snack" as const;
export const MILK = "milk" as const;
export const RANCH = "ranch" as const;
export const MEAL_TYPES = [
  BREAKFAST,
  LUNCH,
  DINNER,
  MIDMORNING_SNACK,
  AFTERNOON_SNACK,
  BEDTIME_SNACK,
] as const;

export const MEAL_TYPE_LABELS = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  midmorning_snack: "Midmorning Snack",
  afternoon_snack: "Afternoon Snack",
  bedtime_snack: "Bedtime Snack",
} as const;

export const SNACK_MEAL_TYPES = [
  MIDMORNING_SNACK,
  AFTERNOON_SNACK,
  BEDTIME_SNACK,
] as const;

export const isSnackMeal = (meal: string) =>
  (SNACK_MEAL_TYPES as readonly string[]).includes(meal);
export const DAYS_OF_WEEK = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;
