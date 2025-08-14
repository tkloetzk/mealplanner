import { useMemo } from "react";
import { shallow } from "zustand/shallow";
import { useMealStore } from "./useMealStore";
import { MealType } from "@/types/meals";

// Get current meal's selections
export const useCurrentMealSelection = () => {
  return useMealStore(
    (state) => {
      const { selectedKid, selectedDay, selectedMeal, selections } = state;
      if (!selectedKid || !selectedDay || !selectedMeal) return null;
      return selections[selectedKid]?.[selectedDay]?.[selectedMeal] || null;
    },
    shallow
  );
};

// Get nutrition info for a specific meal
export const useMealNutrition = (meal: MealType) => {
  const selections = useMealStore((state) => state.selections, shallow);
  const selectedKid = useMealStore((state) => state.selectedKid);
  const selectedDay = useMealStore((state) => state.selectedDay);
  
  return useMemo(() => {
    if (!selectedKid || !selectedDay) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }

    const mealSelections = selections[selectedKid]?.[selectedDay]?.[meal];
    if (!mealSelections) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }

    const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };

    Object.entries(mealSelections).forEach(([category, food]) => {
      if (!food || category === "condiments") return;

      totals.calories += food.adjustedCalories || 0;
      totals.protein += food.adjustedProtein || 0;
      totals.carbs += food.adjustedCarbs || 0;
      totals.fat += food.adjustedFat || 0;
    });

    if (mealSelections.condiments && Array.isArray(mealSelections.condiments)) {
      mealSelections.condiments.forEach((condiment) => {
        if (!condiment) return;
        totals.calories += condiment.adjustedCalories || 0;
        totals.protein += condiment.adjustedProtein || 0;
        totals.carbs += condiment.adjustedCarbs || 0;
        totals.fat += condiment.adjustedFat || 0;
      });
    }

    return totals;
  }, [selections, selectedKid, selectedDay, meal]);
};

// Get daily nutrition totals
export const useDailyNutrition = () => {
  const selections = useMealStore((state) => state.selections, shallow);
  const selectedKid = useMealStore((state) => state.selectedKid);
  const selectedDay = useMealStore((state) => state.selectedDay);
  
  return useMemo(() => {
    if (!selectedKid || !selectedDay) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }

    const daySelections = selections[selectedKid]?.[selectedDay];
    if (!daySelections) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }

    const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };

    // Calculate totals for each meal
    Object.values(daySelections).forEach((mealSelections) => {
      if (!mealSelections) return;

      // Calculate nutrition for regular food items
      Object.entries(mealSelections).forEach(([category, food]) => {
        if (!food || category === "condiments") return;

        totals.calories += food.adjustedCalories || 0;
        totals.protein += food.adjustedProtein || 0;
        totals.carbs += food.adjustedCarbs || 0;
        totals.fat += food.adjustedFat || 0;
      });

      // Add condiments if they exist for this meal
      if (mealSelections.condiments && Array.isArray(mealSelections.condiments)) {
        mealSelections.condiments.forEach((condiment) => {
          if (!condiment) return;
          totals.calories += condiment.adjustedCalories || 0;
          totals.protein += condiment.adjustedProtein || 0;
          totals.carbs += condiment.adjustedCarbs || 0;
          totals.fat += condiment.adjustedFat || 0;
        });
      }
    });

    return totals;
  }, [selections, selectedKid, selectedDay]);
};

// Get milk inclusion status for all meals  
export const useMilkInclusion = () => {
  const selections = useMealStore((state) => state.selections, shallow);
  const selectedKid = useMealStore((state) => state.selectedKid);
  const selectedDay = useMealStore((state) => state.selectedDay);
  
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
  }, [selections, selectedKid, selectedDay]);
};
