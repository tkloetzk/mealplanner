import { Food } from "./food";

export type DayType =
  | "sunday"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday";
export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export type CategoryType =
  | "proteins"
  | "grains"
  | "fruits"
  | "vegetables"
  | "milk"
  | "condiments"
  | "ranch"
  | "other";

export interface MealSelection {
  proteins: Food | null;
  grains: Food | null;
  fruits: Food | null;
  vegetables: Food | null;
  milk: Food | null;
  condiments: Food[];
  ranch: Food | null;
  other?: Food | null;
}

export interface DayMeals {
  breakfast: MealSelection;
  lunch: MealSelection;
  dinner: MealSelection;
  snack: MealSelection;
}

export interface MealPlan {
  [key: string]: DayMeals;
  sunday: DayMeals;
  monday: DayMeals;
  tuesday: DayMeals;
  wednesday: DayMeals;
  thursday: DayMeals;
  friday: DayMeals;
  saturday: DayMeals;
}

export interface MealHistoryRecord {
  _id: string;
  kidId: string;
  meal: MealType;
  date: Date;
  selections: MealSelection;
  consumptionData?: {
    percentEaten: number;
    notes?: string;
  };
}

export interface MealState {
  selections: Record<string, MealPlan>;
  selectedKid: string | null;
  selectedDay: DayType | null;
  selectedMeal: MealType | null;
  mealHistory: Record<string, MealHistoryRecord[]>;
}
