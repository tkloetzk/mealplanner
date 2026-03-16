import { useMemo } from "react";
import { format } from "date-fns";
import { useMealStore } from "./useMealStore";
import type { MealSelection } from "@/types/meals";
import type { MealType } from "@/types/shared";
import { computeMealNutrition, computeDailyNutrition } from "@/utils/nutritionUtils";
import { MEAL_TYPES } from "@/constants";
import { calculateTargetDate } from "@/utils/dateUtils";

const EMPTY_NUTRITION = { calories: 0, protein: 0, carbs: 0, fat: 0, sodium: 0, sugar: 0, saturatedFat: 0 };

// Get current meal's selections
export const useCurrentMealSelection = (): MealSelection | null => {
  return useMealStore((state) => {
    const { selectedKid, selectedDay, selectedMeal, selections } = state;
    if (!selectedKid || !selectedDay || !selectedMeal) return null;
    return selections[selectedKid]?.[selectedDay]?.[selectedMeal] || null;
  });
};

// Get nutrition info for a specific meal, including consumption data
export const useMealNutrition = (meal: MealType | null) => {
  const selections = useMealStore((s) => s.selections);
  const selectedKid = useMealStore((s) => s.selectedKid);
  const selectedDay = useMealStore((s) => s.selectedDay);
  const mealHistory = useMealStore((s) => s.mealHistory);

  return useMemo(() => {
    if (!meal || !selectedKid || !selectedDay) return EMPTY_NUTRITION;
    const mealSelections = selections[selectedKid]?.[selectedDay]?.[meal];
    const targetDateKey = format(calculateTargetDate(selectedDay), "yyyy-MM-dd");
    const consumptionData = mealHistory[selectedKid]?.find(
      (record) =>
        record.meal === meal &&
        format(new Date(record.date), "yyyy-MM-dd") === targetDateKey
    )?.consumptionData;
    return computeMealNutrition(mealSelections, consumptionData?.foods);
  }, [selections, selectedKid, selectedDay, mealHistory, meal]);
};

// Get daily nutrition totals, including consumption data
export const useDailyNutrition = () => {
  const selections = useMealStore((s) => s.selections);
  const selectedKid = useMealStore((s) => s.selectedKid);
  const selectedDay = useMealStore((s) => s.selectedDay);
  const mealHistory = useMealStore((s) => s.mealHistory);

  return useMemo(() => {
    if (!selectedKid || !selectedDay) return EMPTY_NUTRITION;
    const targetDateKey = format(calculateTargetDate(selectedDay), "yyyy-MM-dd");
    return computeDailyNutrition((meal) => {
      const mealSelections = selections[selectedKid]?.[selectedDay]?.[meal];
      const consumptionData = mealHistory[selectedKid]?.find(
        (record) =>
          record.meal === meal &&
          format(new Date(record.date), "yyyy-MM-dd") === targetDateKey
      )?.consumptionData;
      return computeMealNutrition(mealSelections, consumptionData?.foods);
    });
  }, [selections, selectedKid, selectedDay, mealHistory]);
};

// Get milk inclusion status for all meals
export const useMilkInclusion = () => {
  const selections = useMealStore((state) => state.selections);
  const selectedKid = useMealStore((state) => state.selectedKid);
  const selectedDay = useMealStore((state) => state.selectedDay);

  return useMemo(() => {
    if (!selectedKid || !selectedDay) {
      return Object.fromEntries(
        (MEAL_TYPES as readonly MealType[]).map((meal) => [meal, false])
      ) as Record<MealType, boolean>;
    }

    return Object.fromEntries(
      (MEAL_TYPES as readonly MealType[]).map((meal) => [
        meal,
        !!selections[selectedKid]?.[selectedDay]?.[meal]?.milk,
      ])
    ) as Record<MealType, boolean>;
  }, [selections, selectedKid, selectedDay]);
};
