export interface Food {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MealSelection {
  grains: Food | null;
  fruits: Food | null;
  proteins: Food | null;
  vegetables: Food | null;
}

export interface DayMeals {
  breakfast: MealSelection;
  lunch: MealSelection;
  dinner: MealSelection;
  snack: MealSelection;
}

export interface MealPlan {
  userId: string;
  selections: {
    [key: string]: DayMeals;
  };
  updatedAt: Date;
}
