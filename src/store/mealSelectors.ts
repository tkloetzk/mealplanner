import { useMemo } from "react";
import { useMealStore } from "./useMealStore";
import { MealType } from "@/types/meals";

// Get current meal's selections
export const useCurrentMealSelection = () => {
  const getCurrentMealSelection = useMealStore(
    (state) => state.getCurrentMealSelection
  );
  return useMemo(() => getCurrentMealSelection(), [getCurrentMealSelection]);
};

// Get nutrition info for a specific meal
export const useMealNutrition = (meal: MealType) => {
  const calculateMealNutrition = useMealStore(
    (state) => state.calculateMealNutrition
  );
  return useMemo(
    () => calculateMealNutrition(meal),
    [calculateMealNutrition, meal]
  );
};

// Get daily nutrition totals
export const useDailyNutrition = () => {
  const calculateDailyTotals = useMealStore(
    (state) => state.calculateDailyTotals
  );
  return useMemo(() => calculateDailyTotals(), [calculateDailyTotals]);
};

// Get milk inclusion status for all meals
export const useMilkInclusion = () => {
  const selectedKid = useMealStore((state) => state.selectedKid);
  const selectedDay = useMealStore((state) => state.selectedDay);
  const selections = useMealStore((state) => state.selections);

  return useMemo(() => {
    if (!selectedKid || !selectedDay) {
      return {
        breakfast: false,
        lunch: false,
        dinner: false,
        snack: false,
      };
    }

    return {
      breakfast: !!selections[selectedKid]?.[selectedDay]?.breakfast?.milk,
      lunch: !!selections[selectedKid]?.[selectedDay]?.lunch?.milk,
      dinner: !!selections[selectedKid]?.[selectedDay]?.dinner?.milk,
      snack: !!selections[selectedKid]?.[selectedDay]?.snack?.milk,
    };
  }, [selectedKid, selectedDay, selections]);
};
