import { CategoryType } from "@/types/food";

export const CATEGORY_STYLES: Record<CategoryType, string> = {
  fruits: "border-l-4 border-red-400 border-r border-t border-b",
  vegetables: "border-l-4 border-green-400 border-r border-t border-b",
  proteins: "border-l-4 border-blue-400 border-r border-t border-b",
  grains: "border-l-4 border-yellow-400 border-r border-t border-b",
  milk: "border-l-4 border-purple-400 border-r border-t border-b",
};

export const CATEGORY_EMOJIS: Record<CategoryType, string> = {
  fruits: "🍎",
  vegetables: "🥕",
  proteins: "🥚",
  grains: "🥖",
  milk: "🥛",
};
