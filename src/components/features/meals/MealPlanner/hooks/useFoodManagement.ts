// hooks/useFoodManagement.ts
import { useState, useCallback } from "react";
import { produce } from "immer";
import { CategoryType } from "@/types/shared";
import { Food } from "@/types/food";
import { isCategoryKey } from "@/utils/meal-categories";
import { handleApiResponse, safeAsync } from "@/utils/errorUtils";

export interface FoodContext {
  category: CategoryType;
  food: Food;
  mode: "serving" | "edit" | "add";
  currentServings?: number;
}

export function useFoodManagement() {
  const [foodOptions, setFoodOptions] = useState<Record<CategoryType, Food[]>>({
    proteins: [],
    grains: [],
    fruits: [],
    vegetables: [],
    milk: [],
    ranch: [],
    condiments: [],
    other: [],
  });

  const [selectedFoodContext, setSelectedFoodContext] = useState<FoodContext | null>(null);

  const fetchFoodOptions = useCallback(async () => {
    const result = await safeAsync(async () => {
      const response = await fetch("/api/foods");
      return handleApiResponse(response);
    }, "Fetch food options");

    if (result.success) {
      const data = result.data;

      // Since data is always pre-grouped, directly set it as food options
      // Just ensure the categories are valid
      const validGroupedData = Object.entries(data).reduce(
        (acc, [category, foods]) => {
          if (isCategoryKey(category)) {
            acc[category] = Array.isArray(foods) ? foods : [];
          }
          return acc;
        },
        {
          proteins: [],
          grains: [],
          fruits: [],
          vegetables: [],
          milk: [],
          ranch: [],
          condiments: [],
          other: [],
        } as Record<CategoryType, Food[]>
      );

      setFoodOptions(validGroupedData);
    }
    // Error is already handled by safeAsync
  }, []);

  const handleToggleVisibility = useCallback(async (food: Food) => {
    const newHiddenState = !food.hiddenFromChild;

    try {
      setFoodOptions(
        produce((draft) => {
          if (!isCategoryKey(food.category)) return;

          draft[food.category] = draft[food.category].map((f) =>
            f.id === food.id ? { ...f, hiddenFromChild: newHiddenState } : f
          );
        })
      );

      const response = await fetch(`/api/foods/${food.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hiddenFromChild: newHiddenState }),
      });

      if (!response.ok) {
        throw new Error("Failed to update food visibility");
      }
    } catch (error) {
      console.error("Error updating food visibility:", error);
      // Revert on error
      setFoodOptions(
        produce((draft) => {
          if (!isCategoryKey(food.category)) return;

          draft[food.category] = draft[food.category].map((f) =>
            f.id === food.id ? { ...f, hiddenFromChild: !newHiddenState } : f
          );
        })
      );
    }
  }, []);

  const handleToggleAllOtherFoodVisibility = useCallback(() => {
    setFoodOptions(
      produce((draft) => {
        if (draft.other) {
          const allHidden = draft.other.every((f) => f.hiddenFromChild);
          draft.other = draft.other.map((f) => ({
            ...f,
            hiddenFromChild: !allHidden,
          }));
        }
      })
    );
  }, []);

  const handleSaveFood = useCallback(async (food: Food) => {
    try {
      const response = await fetch("/api/foods", {
        method: food.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(food),
      });
      if (!response.ok) throw new Error("Failed to save food");
      setSelectedFoodContext(null);
      // Refresh food options after save
      await fetchFoodOptions();
    } catch (error) {
      console.error("Error saving food:", error);
    }
  }, [fetchFoodOptions]);

  const handleDeleteFood = useCallback(async (foodId: string) => {
    try {
      const response = await fetch(`/api/foods/${foodId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete food");
      setSelectedFoodContext(null);
      await fetchFoodOptions();
    } catch (error) {
      console.error("Error deleting food:", error);
    }
  }, [fetchFoodOptions]);

  return {
    foodOptions,
    selectedFoodContext,
    setSelectedFoodContext,
    fetchFoodOptions,
    handleToggleVisibility,
    handleToggleAllOtherFoodVisibility,
    handleSaveFood,
    handleDeleteFood,
  };
}