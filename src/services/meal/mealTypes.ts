import type { MealType } from "@/types/food";

// Service-specific types
export interface MealPlanServiceConfig {
  defaultServings: number;
  maxHistoryItems: number;
}

export interface MealPlanOperationResult {
  success: boolean;
  error?: string;
  data?: unknown;
}

export interface MealHistoryFilters {
  startDate?: Date;
  endDate?: Date;
  mealType?: MealType;
  kidId: string;
}
