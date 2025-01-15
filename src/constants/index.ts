// constants/index.ts
export const CATEGORY_STYLES = {
  fruits: "border-l-4 border-red-400 border-r border-t border-b",
  vegetables: "border-l-4 border-green-400 border-r border-t border-b",
  proteins: "border-l-4 border-blue-400 border-r border-t border-b",
  grains: "border-l-4 border-yellow-400 border-r border-t border-b",
  milk: "border-l-4 border-purple-400 border-r border-t border-b",
};

export const CATEGORY_EMOJIS = {
  fruits: "🍎",
  vegetables: "🥕",
  proteins: "🥚",
  grains: "🥖",
  milk: "🥛",
};

export const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
export const DAYS_OF_WEEK = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;
