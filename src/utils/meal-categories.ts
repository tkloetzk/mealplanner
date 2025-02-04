import { CategoryType } from "@/types/meals";

const VALID_CATEGORIES = [
  "proteins",
  "grains",
  "fruits",
  "vegetables",
  "milk",
  "condiments",
  "ranch",
  "other",
] as const;

export const isCategoryKey = (category: string): category is CategoryType => {
  return VALID_CATEGORIES.includes(category as CategoryType);
};
