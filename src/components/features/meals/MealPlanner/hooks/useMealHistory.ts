// hooks/useMealHistory.ts
import { useState, useCallback } from "react";
import { mealService } from "@/services/meal/mealService";
import { useMealStore } from "@/store/useMealStore";
import { MealHistoryRecord, MealSelection } from "@/types/meals";
import { MealType } from "@/types/shared";

export function useMealHistory() {
  const [isLoading, setIsLoading] = useState(false);

  const fetchMealHistory = useCallback(async (selectedKid: string | null) => {
    if (!selectedKid) return;

    setIsLoading(true);
    try {
      const result = await mealService.getMealHistory({
        kidId: selectedKid,
      });

      if (result.success && result.data) {
        // Update the store with the fetched meal history
        useMealStore.setState((state) => ({
          ...state,
          mealHistory: {
            ...state.mealHistory,
            [selectedKid]: result.data as MealHistoryRecord[],
          },
        }));
      } else {
        console.error("Failed to fetch meal history:", result.error);
      }
    } catch (error) {
      console.error("Error fetching meal history:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSaveMeal = useCallback(
    async (
      name: string,
      selections: MealSelection,
      selectedMeal: MealType | null,
      selectedKid: string | null
    ) => {
      try {
        const response = await fetch("/api/meals", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            selections,
            mealType: selectedMeal,
            kidId: selectedKid,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to save meal");
        }

        // Refresh meal data
        await fetchMealHistory(selectedKid);
      } catch (error) {
        console.error("Error saving meal:", error);
        throw error;
      }
    },
    [fetchMealHistory]
  );

  return {
    isLoading,
    fetchMealHistory,
    handleSaveMeal,
  };
}