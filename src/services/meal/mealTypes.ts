import type { MealType } from "@/types/meals";

// Service-specific types
export interface MealPlanServiceConfig {
  defaultServings: number;
  maxHistoryItems: number;
}

export interface MealPlanOperationResult {
  success: boolean;
  error?: string;
  details?: string;
  data?: unknown;
}

export interface MealHistoryFilters {
  kidId: string;
  date?: Date;
  mealType?: MealType;
}
