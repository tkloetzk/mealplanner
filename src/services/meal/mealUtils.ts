// src/services/meal/mealUtils.ts

export function formatMealDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function validateMealPlan(plan: any): boolean {
  // Add validation logic
  return true;
}
