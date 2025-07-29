// utils/mealApiUtils.ts
import { MealType } from "@/types/shared";
import { MealSelection } from "@/types/meals";
import { handleApiResponse, handleAsyncError } from "./errorUtils";

interface SaveMealHistoryParams {
  kidId: string;
  meal: MealType;
  date: Date;
  selections: MealSelection;
}

/**
 * Centralized function to save meal history to avoid code duplication
 * Used by all meal store actions that need to persist changes
 */
export async function saveMealHistory(params: SaveMealHistoryParams): Promise<void> {
  const { kidId, meal, date, selections } = params;
  
  try {
    // Development logging
    if (process.env.NODE_ENV === 'development') {
      console.log("Saving meal history:", {
        meal,
        date: date.toISOString(),
        selections,
      });
    }

    const response = await fetch("/api/meal-history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kidId,
        mealData: {
          meal,
          date: date.toISOString(),
          selections,
        },
      }),
    });

    const result = await handleApiResponse(response);
    
    if (process.env.NODE_ENV === 'development') {
      console.log("Save result:", result);
    }
  } catch (error) {
    handleAsyncError(error, "Save meal history");
  }
}