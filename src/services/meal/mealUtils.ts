// src/services/meal/mealUtils.ts

export function formatMealDate(date: Date): string {
  return date.toISOString().split("T")[0];
}
