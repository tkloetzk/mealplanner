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

export const BREAKFAST = "breakfast";
export const LUNCH = "lunch";
export const DINNER = "dinner";
export const SNACK = "snack";
export const MILK = "milk";
export const RANCH = "ranch";

export const MEAL_TYPES = [BREAKFAST, LUNCH, DINNER, SNACK];
export const DAYS_OF_WEEK = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;
