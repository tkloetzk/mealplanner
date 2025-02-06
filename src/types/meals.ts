import { Food } from "./food";

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export type DayType =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";
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
  ranch: Food | null;
  condiments: Food[];
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
  _id?: string;
  kidId: string;
  date: Date | string;
  meal: MealType;
  selections: MealSelection;
  consumptionData?: {
    percentEaten: number;
    notes?: string;
  };
}

export interface MealState {
  selections: Record<string, Record<DayType, Record<MealType, MealSelection>>>;
  selectedKid: string | null;
  selectedDay: DayType | null;
  selectedMeal: MealType | null;
  mealHistory: Record<string, MealHistoryRecord[]>;
}
