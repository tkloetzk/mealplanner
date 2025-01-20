// src/services/meal/mealService.ts
import type { MealPlanOperationResult, MealHistoryFilters } from "./mealTypes";

export class MealService {
  async getMealHistory(
    filters: MealHistoryFilters
  ): Promise<MealPlanOperationResult> {
    // Early validation of required parameters
    if (!filters || !filters.kidId) {
      return {
        success: false,
        error: "kidId is required",
      };
    }

    try {
      // Convert filters to URL search params
      const searchParams = new URLSearchParams();

      // Validate and append required kidId
      if (typeof filters.kidId !== "string" || filters.kidId.trim() === "") {
        return {
          success: false,
          error: "Invalid kidId",
        };
      }
      searchParams.append("kidId", filters.kidId.trim());

      // Conditionally add optional filters with type checking
      if (filters.startDate instanceof Date) {
        searchParams.append("startDate", filters.startDate.toISOString());
      }
      if (filters.endDate instanceof Date) {
        searchParams.append("endDate", filters.endDate.toISOString());
      }
      if (filters.mealType && typeof filters.mealType === "string") {
        searchParams.append("mealType", filters.mealType);
      }

      // Fetch meal history
      const response = await fetch(`/api/meal-history?${searchParams}`);

      // Defensive check for response before attempting to parse
      if (!response) {
        return {
          success: false,
          error: "No response received from server",
        };
      }

      // Handle non-OK responses
      if (!response.ok) {
        // Try to parse error message, but handle cases where parsing might fail
        try {
          const errorData = await response.json();
          return {
            success: false,
            error: errorData.message || "Failed to fetch meal history",
          };
        } catch {
          // Fallback error if JSON parsing fails
          return {
            success: false,
            error: `HTTP error! status: ${response.status}`,
          };
        }
      }

      // Parse and return successful response
      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      // Comprehensive error handling
      console.error("Meal history fetch error:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error occurred while fetching meal history",
      };
    }
  }
}

// Export a singleton instance
export const mealService = new MealService();
