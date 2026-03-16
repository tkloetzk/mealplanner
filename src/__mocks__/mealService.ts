// src/__mocks__/mealService.ts
import { MealHistoryRecord } from "@/types/meals";

const mockMealHistory: MealHistoryRecord[] = [
  {
    _id: "1",
    kidId: "1",
    date: "2024-01-01",
    meal: "breakfast",
    selections: {
      proteins: [],
      fruits: [],
      vegetables: [],
      grains: [],
      condiments: [],
      milk: null,
      ranch: null,
      other: [],
    },
  },
];

export const mealService = {
  async getMealHistory(filters: { kidId: string; date?: Date }) {
    return {
      success: true,
      data: mockMealHistory.filter((record) => record.kidId === filters.kidId),
    };
  },
};