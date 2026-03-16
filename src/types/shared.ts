// Common type definitions shared across the application

export const CATEGORY_STYLES = {
  proteins: "proteins",
  grains: "grains",
  fruits: "fruits",
  vegetables: "vegetables",
  milk: "milk",
  ranch: "ranch",
  condiments: "condiments",
  other: "other",
} as const;

export type CategoryType = keyof typeof CATEGORY_STYLES;

export type MealType =
  | "breakfast"
  | "lunch"
  | "dinner"
  | "midmorning_snack"
  | "afternoon_snack"
  | "bedtime_snack";

export type DayType =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sodium?: number;  // Add optional sodium (mg)
  sugar?: number;   // Optional: added sugars (g)
  saturatedFat?: number;  // Optional: saturated fat (g)
  fiber?: number;        // g
  transFat?: number;     // g
  cholesterol?: number;  // mg
}

export interface AdjustedNutritionInfo extends NutritionInfo {
  adjustedCalories: number;
  adjustedProtein: number;
  adjustedCarbs: number;
  adjustedFat: number;
}

export interface FoodConsumptionStatus {
  foodId: string;
  status: "not_eaten" | "partially_eaten" | "eaten";
  percentageEaten?: number;
  notes?: string;
}

/** Quick parent rating for how long a meal kept the child full */
export type SatietyRating = 1 | 2 | 3;

export interface SatietyEntry {
  /** ISO 8601 datetime — when the child reported being hungry again */
  hungryAgainAt?: string;
  /** Quick parent rating: 1 = hungry fast, 2 = moderate, 3 = stayed full */
  satietyRating?: SatietyRating;
  /** Free-form note, e.g. "asked for crackers 45 min later" */
  notes?: string;
}

/**
 * Compute the duration in minutes between a meal time and a "hungry again" time.
 * Returns undefined if either timestamp is missing or invalid.
 */
export function computeSatietyDuration(
  mealTime: string | undefined,
  hungryAgainAt: string | undefined,
): number | undefined {
  if (!mealTime || !hungryAgainAt) return undefined;
  const start = new Date(mealTime).getTime();
  const end = new Date(hungryAgainAt).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return undefined;
  return Math.round((end - start) / 60_000);
}

/**
 * Format a duration in minutes as a human-readable string.
 * e.g. 90 → "1h 30m", 45 → "45m"
 */
export function formatDuration(minutes: number | undefined): string {
  if (minutes == null || minutes <= 0) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export interface ConsumptionInfo {
  foods: FoodConsumptionStatus[];
  overallStatus: "offered" | "partially_eaten" | "eaten";
  notes?: string;
  /** ISO 8601 datetime — when the child actually ate (clock time, not calendar day) */
  mealTime?: string;
  /** Satiety / fullness tracking logged after the meal */
  satietyLog?: SatietyEntry;
}
