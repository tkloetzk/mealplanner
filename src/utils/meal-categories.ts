import { Food } from "@/types/food";
import { CategoryType, MealSelection } from "@/types/meals";

type SingleFoodCategory = keyof {
  [K in keyof MealSelection as MealSelection[K] extends Food | null
    ? K
    : never]: MealSelection[K];
};

export const isCategoryKey = (
  category: CategoryType
): category is SingleFoodCategory => {
  return category !== "condiments";
};
