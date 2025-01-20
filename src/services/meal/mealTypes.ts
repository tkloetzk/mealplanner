import type { MealType, MealSelection, MealHistoryRecord } from "@/types/food";
import type { Kid } from "@/types/user";

// Service-specific types
export interface MealPlanServiceConfig {
  defaultServings: number;
  maxHistoryItems: number;
}

export interface MealPlanOperationResult {
  success: boolean;
  error?: string;
  data?: any;
}

export interface MealHistoryFilters {
  startDate?: Date;
  endDate?: Date;
  mealType?: MealType;
  kidId: string;
}
