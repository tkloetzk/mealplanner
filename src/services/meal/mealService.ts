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

      // Always send a date parameter - if not provided, use current date
      const date = filters.date || new Date();
      searchParams.append("date", date.toISOString());

      // Fetch meal history with improved error handling
      const response = await fetch(`/api/meal-history?${searchParams}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

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
            error:
              errorData.error ||
              errorData.message ||
              `HTTP error! status: ${response.status}`,
            details: errorData.details || undefined,
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

      // Validate the response structure
      if (!data || !data.history) {
        return {
          success: false,
          error: "Invalid response format from server",
        };
      }

      return {
        success: true,
        data: data.history,
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
