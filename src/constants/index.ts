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
export const SNACK = "snack" as const;
export const MILK = "milk" as const;
export const RANCH = "ranch" as const;
export const MEAL_TYPES = [BREAKFAST, LUNCH, DINNER, SNACK] as const;
export const DAYS_OF_WEEK = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;
