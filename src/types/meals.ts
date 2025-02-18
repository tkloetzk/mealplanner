import { Food } from "./food";
import { MealType, DayType, ConsumptionInfo } from "./shared";

export interface MealSelection {
  proteins: Food | null;
  grains: Food | null;
  fruits: Food | null;
  vegetables: Food | null;
  milk: Food | null;
  ranch: Food | null;
  condiments: Food[];
  other: Food | null;
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
  consumptionData?: ConsumptionInfo;
}

export interface MealState {
  selections: Record<string, Record<DayType, Record<MealType, MealSelection>>>;
  selectedKid: string | null;
  selectedDay: DayType | null;
  selectedMeal: MealType | null;
  mealHistory: Record<string, MealHistoryRecord[]>;
}
