// constants/meal-goals.ts
export const DAILY_GOALS = {
  mealCalories: {
    breakfast: 400,
    lunch: 400,
    dinner: 400,
    snack: 200,
  },
  dailyTotals: {
    protein: {
      min: 20,
      max: 25,
    },
    fat: {
      min: 33,
      max: 62,
    },
    calories: 1400, // Total of all meals (400 * 3 + 200)
  },
};
