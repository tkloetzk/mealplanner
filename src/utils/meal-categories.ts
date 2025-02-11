import { CategoryType } from "@/types/shared";
import { Food } from "@/types/food";

const CATEGORY_KEYS: CategoryType[] = [
  "proteins",
  "grains",
  "fruits",
  "vegetables",
  "milk",
  "ranch",
  "condiments",
  "other",
];

export function isCategoryKey(key: string): key is CategoryType {
  return CATEGORY_KEYS.includes(key as CategoryType);
}

export function getCategoryFoods(
  category: CategoryType,
  foodOptions: Record<CategoryType, Food[]>
): Food[] {
  return foodOptions[category] || [];
}

export function getValidCategory(category: string): CategoryType | null {
  return isCategoryKey(category) ? category : null;
}
