import { create } from "zustand";
import { produce } from "immer";
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

interface MealSelectionResponse {
  kidId: string;
  day: DayType;
  meal: MealType;
  selections: MealSelection;
}

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

export const useMealStore = create<MealStore>((set, get) => ({
  // Initial state
  selections: {},
  selectedKid: "",
  selectedDay: DEFAULT_DAY,
  selectedMeal: "breakfast" as MealType,
  mealHistory: {},

  // Selection actions
  setSelectedKid: async (kidId) => {
    set({ selectedKid: kidId });

    // Load meal selections from database
    if (kidId) {
      const state = get();
      try {
        const response = await fetch(
          `/api/meal-selections?kidId=${kidId}&day=${state.selectedDay}`
        );
        if (!response.ok) throw new Error("Failed to fetch meal selections");

        const selections = (await response.json()) as MealSelectionResponse[];

        // Update store with fetched selections
        set(
          produce((state) => {
            if (!state.selections[kidId]) {
              state.selections[kidId] = structuredClone(DEFAULT_MEAL_PLAN);
            }

            // Update selections with data from database
            selections.forEach((selection) => {
              if (selection.meal && selection.selections) {
                state.selections[kidId][state.selectedDay][selection.meal] =
                  selection.selections;
              }
            });
          })
        );
      } catch (error) {
        console.error("Failed to load meal selections:", error);
        // Initialize with default meal plan if fetch fails
        set(
          produce((state) => {
            if (!state.selections[kidId]) {
              state.selections[kidId] = structuredClone(DEFAULT_MEAL_PLAN);
            }
          })
        );
      }
    }
  },
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

  handleFoodSelect: async (category: CategoryType, food: Food) => {
    const state = get();
    const { selectedKid, selectedDay, selectedMeal } = state;
    if (!selectedKid || !selectedDay || !selectedMeal) return;

    set(
      produce((state) => {
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
    );

    // Save to database
    try {
      await fetch("/api/meal-selections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kidId: selectedKid,
          day: selectedDay,
          meal: selectedMeal,
          selections: state.selections[selectedKid][selectedDay][selectedMeal],
        }),
      });
    } catch (error) {
      console.error("Failed to save meal selection:", error);
    }
  },

  handleServingAdjustment: async (
    category: CategoryType,
    id: string,
    servings: number
  ) => {
    const state = get();
    const { selectedKid, selectedDay, selectedMeal } = state;
    if (!selectedKid || !selectedDay || !selectedMeal) return;

    set(
      produce((state) => {
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
    );

    // Save to database
    try {
      await fetch("/api/meal-selections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kidId: selectedKid,
          day: selectedDay,
          meal: selectedMeal,
          selections: state.selections[selectedKid][selectedDay][selectedMeal],
        }),
      });
    } catch (error) {
      console.error("Failed to save serving adjustment:", error);
    }
  },

  handleMilkToggle: async (mealType: MealType, enabled: boolean) => {
    const state = get();
    const { selectedKid, selectedDay } = state;
    if (!selectedKid || !selectedDay) return;

    set(
      produce((state) => {
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
    );

    // Save to database
    try {
      await fetch("/api/meal-selections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kidId: selectedKid,
          day: selectedDay,
          meal: mealType,
          selections: state.selections[selectedKid][selectedDay][mealType],
        }),
      });
    } catch (error) {
      console.error("Failed to save milk toggle:", error);
    }
  },

  // Utility functions
  getCurrentMealSelection: () => {
    const { selectedKid, selectedDay, selectedMeal, selections } = get();
    if (!selectedKid || !selectedDay || !selectedMeal) return null;
    return selections[selectedKid]?.[selectedDay]?.[selectedMeal] || null;
  },

  calculateMealNutrition: (meal: MealType) => {
    const state = get();
    const { selectedKid, selectedDay } = state;
    if (!selectedKid || !selectedDay) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }

    const mealSelections = state.selections[selectedKid]?.[selectedDay]?.[meal];
    if (!mealSelections) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }

    // Initialize totals
    const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };

    // Calculate nutrition for regular food items
    Object.entries(mealSelections).forEach(([category, food]) => {
      if (!food || category === "condiments") return;

      totals.calories += food.adjustedCalories || 0;
      totals.protein += food.adjustedProtein || 0;
      totals.carbs += food.adjustedCarbs || 0;
      totals.fat += food.adjustedFat || 0;
    });

    // Add condiments if they exist for this meal
    if (mealSelections.condiments && Array.isArray(mealSelections.condiments)) {
      mealSelections.condiments.forEach((condiment) => {
        if (!condiment) return;
        totals.calories += condiment.adjustedCalories || 0;
        totals.protein += condiment.adjustedProtein || 0;
        totals.carbs += condiment.adjustedCarbs || 0;
        totals.fat += condiment.adjustedFat || 0;
      });
    }

    return totals;
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
}));
