import { Food } from "./food";
import type { DayType, ConsumptionInfo } from "./shared";

export type MealType = import("./shared").MealType;

export interface MealSelection {
  proteins: Food[];
  grains: Food[];
  fruits: Food[];
  vegetables: Food[];
  milk: Food | null;
  ranch: Food | null;
  condiments: Food[];
  other: Food[];
}

export interface DayMeals {
  breakfast: MealSelection;
  lunch: MealSelection;
  dinner: MealSelection;
  midmorning_snack: MealSelection;
  afternoon_snack: MealSelection;
  bedtime_snack: MealSelection;
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
  date: string;
  meal: MealType;
  selections: MealSelection;
  consumptionData?: ConsumptionInfo;
}

export interface MealState {
  selections: Record<string, Record<DayType, Record<MealType, MealSelection>>>;
  selectedKid: string | null;
  selectedDay: DayType | null;
  selectedMeal: MealType | null;
  mealHistory: Record<string, MealHistoryRecord[]>;
}
