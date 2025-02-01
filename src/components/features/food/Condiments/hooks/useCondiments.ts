// src/hooks/useCondiments.ts
import { useState, useCallback, useMemo } from "react";
import { Food } from "@/types/food";
import { CondimentSelection } from "@/constants";

export function useCondiments(condiments: Food[]) {
  const [selectedCondiments, setSelectedCondiments] = useState<
    CondimentSelection[]
  >([]);

  const handleCondimentToggle = useCallback(
    (condiment: Food, servings: number = 1) => {
      setSelectedCondiments((prev) => {
        const existingIndex = prev.findIndex((c) => c.foodId === condiment.id);

        if (existingIndex >= 0) {
          // Remove condiment if it exists
          return prev.filter((c) => c.foodId !== condiment.id);
        } else {
          // Add new condiment with adjusted nutrition values
          const adjustedValues = {
            foodId: condiment.id,
            servings,
            adjustedCalories: condiment.calories * servings,
            adjustedProtein: condiment.protein * servings,
            adjustedCarbs: condiment.carbs * servings,
            adjustedFat: condiment.fat * servings,
          };
          return [...prev, adjustedValues];
        }
      });
    },
    []
  );

  const handleServingsChange = useCallback(
    (foodId: string, servings: number) => {
      setSelectedCondiments((prev) => {
        return prev.map((condiment) => {
          if (condiment.foodId === foodId) {
            // Find the original food data to recalculate nutrition
            const originalFood = condiments.find((f) => f.id === foodId);
            if (!originalFood) return condiment;

            return {
              ...condiment,
              servings,
              adjustedCalories: originalFood.calories * servings,
              adjustedProtein: originalFood.protein * servings,
              adjustedCarbs: originalFood.carbs * servings,
              adjustedFat: originalFood.fat * servings,
            };
          }
          return condiment;
        });
      });
    },
    []
  );

  const totalCondimentNutrition = useMemo(() => {
    return selectedCondiments.reduce(
      (total, condiment) => ({
        calories: total.calories + condiment.adjustedCalories,
        protein: total.protein + condiment.adjustedProtein,
        carbs: total.carbs + condiment.adjustedCarbs,
        fat: total.fat + condiment.adjustedFat,
      }),
      {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
      }
    );
  }, [selectedCondiments]);

  return {
    selectedCondiments,
    handleCondimentToggle,
    handleServingsChange,
    totalCondimentNutrition,
    setSelectedCondiments,
  };
}
