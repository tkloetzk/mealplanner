import { create } from "zustand";
import { produce } from "immer";
import { persist } from "zustand/middleware";
import { DEFAULT_MEAL_PLAN, MILK_OPTION } from "@/constants/meal-goals";
import { MEAL_TYPES } from "@/constants";
import type {
  MealState,
  CategoryType,
  MealType,
  DayType,
  MealSelection,
} from "@/types/meals";
import type { Kid } from "@/types/user";
import { Food, NutritionSummary } from "@/types/food";

interface MealStore
  extends Omit<MealState, "selectedKid" | "selectedDay" | "selectedMeal"> {
  selectedKid: string;
  selectedDay: DayType;
  selectedMeal: MealType;
  // Selection actions
  setSelectedKid: (kidId: string) => void;
  setSelectedDay: (day: DayType | undefined) => void;
  setSelectedMeal: (meal: MealType) => void;

  // Meal management actions
  initializeKids: (kids: Kid[]) => void;
  handleFoodSelect: (category: CategoryType, food: Food) => void;
  handleServingAdjustment: (
    category: CategoryType,
    id: string,
    servings: number
  ) => void;
  handleMilkToggle: (mealType: MealType, enabled: boolean) => void;

  // Utility functions
  getCurrentMealSelection: () => MealSelection | null;
  resetMeal: (kidId: string, day: DayType, meal: MealType) => void;
  calculateMealNutrition: (meal: MealType) => NutritionSummary;
  calculateDailyTotals: () => NutritionSummary;
}

const DEFAULT_DAY: DayType = "monday";

const adjustFoodServings = (food: Food, newServings: number) => ({
  ...food,
  servings: newServings,
  adjustedCalories: food.calories * newServings,
  adjustedProtein: food.protein * newServings,
  adjustedCarbs: food.carbs * newServings,
  adjustedFat: food.fat * newServings,
});

export const useMealStore = create<MealStore>()(
  persist(
    (set, get) => ({
      // Initial state
      selections: {},
      selectedKid: "1",
      selectedDay: DEFAULT_DAY,
      selectedMeal: "breakfast" as MealType,
      mealHistory: {},

      // Selection actions
      setSelectedKid: (kidId) => set({ selectedKid: kidId }),
      setSelectedDay: (day) => set({ selectedDay: day }),
      setSelectedMeal: (meal) => set({ selectedMeal: meal }),

      // Meal management actions
      initializeKids: (kids) =>
        set(
          produce((state) => {
            kids.forEach((kid) => {
              if (!state.selections[kid.id]) {
                state.selections[kid.id] = structuredClone(DEFAULT_MEAL_PLAN);
              }
            });
            if (!state.selectedKid && kids.length > 0) {
              state.selectedKid = kids[0].id;
            }
          })
        ),

      handleFoodSelect: (category, food) =>
        set(
          produce((state) => {
            const { selectedKid, selectedDay, selectedMeal } = state;
            if (!selectedKid || !selectedDay || !selectedMeal) return;

            // Get a reference to the current meal
            const currentMeal =
              state.selections[selectedKid][selectedDay][selectedMeal];

            if (!currentMeal) {
              console.error("No meal found for selection");
              return;
            }

            if (category === "condiments") {
              const existingIndex = currentMeal.condiments.findIndex(
                (c: Food) => c.id === food.id
              );
              if (existingIndex >= 0) {
                currentMeal.condiments.splice(existingIndex, 1);
              } else {
                currentMeal.condiments.push({
                  ...food,
                  servings: 1,
                  adjustedCalories: food.calories,
                  adjustedProtein: food.protein,
                  adjustedCarbs: food.carbs,
                  adjustedFat: food.fat,
                });
              }
            } else {
              const isSelected = currentMeal[category]?.id === food.id;

              if (isSelected) {
                currentMeal[category] = null;
              } else {
                currentMeal[category] = {
                  ...food,
                  servings: 1,
                  adjustedCalories: food.calories,
                  adjustedProtein: food.protein,
                  adjustedCarbs: food.carbs,
                  adjustedFat: food.fat,
                };
              }
            }
          })
        ),

      handleServingAdjustment: (category, id, servings) =>
        set(
          produce((state) => {
            const { selectedKid, selectedDay, selectedMeal } = state;
            if (!selectedKid || !selectedDay || !selectedMeal) return;

            const currentMeal =
              state.selections[selectedKid][selectedDay][selectedMeal];

            if (!currentMeal) {
              console.error("No meal found for serving adjustment");
              return;
            }

            if (category === "condiments") {
              const index = currentMeal.condiments.findIndex(
                (c: Food) => c.id === id
              );
              if (index >= 0) {
                currentMeal.condiments[index] = adjustFoodServings(
                  currentMeal.condiments[index],
                  servings
                );
              }
            } else {
              const food = currentMeal[category];
              if (food?.id === id) {
                currentMeal[category] = adjustFoodServings(food, servings);
              }
            }
          })
        ),

      handleMilkToggle: (mealType, enabled) =>
        set(
          produce((state) => {
            const { selectedKid, selectedDay } = state;
            if (!selectedKid || !selectedDay) return;

            const currentMeal =
              state.selections[selectedKid][selectedDay][mealType];

            if (!currentMeal) return;

            if (enabled) {
              currentMeal.milk = {
                ...MILK_OPTION,
                servings: 1,
                adjustedCalories: MILK_OPTION.calories,
                adjustedProtein: MILK_OPTION.protein,
                adjustedCarbs: MILK_OPTION.carbs,
                adjustedFat: MILK_OPTION.fat,
              };
            } else {
              currentMeal.milk = null;
            }
          })
        ),

      // Utility functions
      getCurrentMealSelection: () => {
        const { selectedKid, selectedDay, selectedMeal, selections } = get();
        console.log("getting current meal selections", selections);
        if (!selectedKid || !selectedDay || !selectedMeal) return null;
        return selections[selectedKid]?.[selectedDay]?.[selectedMeal] || null;
      },

      calculateMealNutrition: (meal: MealType) => {
        const state = get();
        const { selectedKid, selectedDay } = state;
        if (!selectedKid || !selectedDay) {
          return { calories: 0, protein: 0, carbs: 0, fat: 0 };
        }

        const mealSelections =
          state.selections[selectedKid]?.[selectedDay]?.[meal];
        if (!mealSelections) {
          return { calories: 0, protein: 0, carbs: 0, fat: 0 };
        }

        return Object.values(mealSelections).reduce(
          (totals, food) => {
            if (!food) return totals;
            if (Array.isArray(food)) {
              return food.reduce(
                (acc, condiment) => ({
                  calories: acc.calories + (condiment.adjustedCalories || 0),
                  protein: acc.protein + (condiment.adjustedProtein || 0),
                  carbs: acc.carbs + (condiment.adjustedCarbs || 0),
                  fat: acc.fat + (condiment.adjustedFat || 0),
                }),
                totals
              );
            }
            return {
              calories: totals.calories + (food.adjustedCalories || 0),
              protein: totals.protein + (food.adjustedProtein || 0),
              carbs: totals.carbs + (food.adjustedCarbs || 0),
              fat: totals.fat + (food.adjustedFat || 0),
            };
          },
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );
      },

      calculateDailyTotals: () => {
        const state = get();
        return MEAL_TYPES.reduce(
          (totals, meal) => {
            const mealNutrition = state.calculateMealNutrition(meal);
            return {
              calories: totals.calories + mealNutrition.calories,
              protein: totals.protein + mealNutrition.protein,
              carbs: totals.carbs + mealNutrition.carbs,
              fat: totals.fat + mealNutrition.fat,
            };
          },
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );
      },

      resetMeal: (kidId, day, meal) =>
        set(
          produce((state) => {
            state.selections[kidId][day][meal] = structuredClone(
              DEFAULT_MEAL_PLAN.monday.breakfast
            );
          })
        ),
    }),
    {
      name: "meal-storage",
      partialize: (state) => ({
        selections: state.selections,
        mealHistory: state.mealHistory,
      }),
    }
  )
);
