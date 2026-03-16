import { create } from "zustand";
import { produce, type Draft } from "immer";
import { DEFAULT_MEAL_PLAN } from "@/constants/meal-goals";
import { MEAL_TYPES } from "@/constants";
import type {
  MealHistoryRecord,
  OptimisticMealHistoryRecord,
  MealState,
  MealSelection,
} from "@/types/meals";
import type {
  CategoryType,
  MealType,
  DayType,
  ConsumptionInfo,
} from "@/types/shared";
import type { Kid } from "@/types/user";
import type { Food, SelectedFood, NutritionSummary } from "@/types/food";
import { format } from "date-fns";
import { calculateTargetDate } from "@/utils/dateUtils";
import { saveMealHistory } from "@/utils/mealApiUtils";
import { calculateNutritionForServing } from "@/utils/foodMigration";
import {
  computeMealNutrition,
  computeDailyNutrition,
  createEmptyMealSelection,
} from "@/utils/nutritionUtils";
import { useAppSettingsStore } from "@/store/useAppSettingsStore";

interface MealSelectionResponse {
  kidId: string;
  day: DayType;
  meal: MealType;
  selections: MealSelection;
}

interface LoadHistoryOptions {
  kidId: string;
  date: Date;
}

interface MealStore extends Omit<
  MealState,
  "selectedKid" | "selectedDay" | "selectedMeal"
> {
  selectedKid: string;
  selectedDay: DayType;
  selectedMeal: MealType;
  // Selection actions
  setSelectedKid: (kidId: string) => void;
  setSelectedDay: (day: DayType | undefined) => void;
  setSelectedMeal: (meal: MealType) => void;
  loadSelectionsFromHistory: (options: LoadHistoryOptions) => Promise<void>;

  // Meal management actions
  initializeKids: (kids: Kid[]) => void;
  handleFoodSelect: (category: CategoryType, food: Food) => Promise<void>;
  handleBatchFoodSelect: (
    selections: Array<{ category: CategoryType; food: Food; servings: number }>,
  ) => Promise<void>;
  handleServingAdjustment: (
    category: CategoryType,
    id: string,
    servings: number,
  ) => Promise<void>;
  handleMilkToggle: (mealType: MealType, enabled: boolean) => Promise<void>;

  // Utility functions
  getCurrentMealSelection: () => MealSelection | null;
  resetMeal: (kidId: string, day: DayType, meal: MealType) => void;
  copyMealToKid: (targetKidId: string) => Promise<void>;
  copyDayToKid: (targetKidId: string) => Promise<void>;
  calculateMealNutrition: (meal: MealType) => NutritionSummary;
  calculateDailyTotals: () => NutritionSummary;

  updateConsumptionData: (
    kidId: string,
    date: Date,
    meal: MealType,
    consumptionInfo: ConsumptionInfo,
  ) => Promise<void>;
  updateFoodConsumptionStatus: (
    kidId: string,
    date: Date,
    meal: MealType,
    foodId: string,
    foodStatus: "not_eaten" | "partially_eaten" | "eaten",
    percentage?: number,
    notes?: string,
  ) => Promise<void>;
}

const DEFAULT_DAY: DayType = "monday";

const createLocalHistoryId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const upsertMealHistoryRecord = (
  draft: MealStore,
  record: MealHistoryRecord,
) => {
  const kidId = record.kidId;
  if (!draft.mealHistory[kidId]) {
    draft.mealHistory[kidId] = [];
  }

  const recordDayKey = format(new Date(record.date), "yyyy-MM-dd");

  const existingIndex = draft.mealHistory[kidId].findIndex((r) => {
    if (r._id === record._id) return true;
    // Replace optimistic record for same meal+date
    if (
      (r as OptimisticMealHistoryRecord)._optimistic &&
      r.meal === record.meal &&
      format(new Date(r.date), "yyyy-MM-dd") === recordDayKey
    ) {
      return true;
    }
    return false;
  });

  if (existingIndex >= 0) {
    draft.mealHistory[kidId][existingIndex] = record;
  } else {
    draft.mealHistory[kidId].push(record);
  }
};

const adjustFoodServings = (food: Food, newServings: number): SelectedFood => {
  let calories, protein, carbs, fat;
  if (food.baseNutritionPer100g && food.servingSizes?.[0]?.gramsEquivalent) {
    const n = calculateNutritionForServing(
      food.baseNutritionPer100g,
      food.servingSizes[0].gramsEquivalent,
      newServings,
    );
    calories = Math.round(n.calories);
    protein = n.protein;
    carbs = n.carbs;
    fat = n.fat;
  } else {
    calories = food.calories * newServings;
    protein = food.protein * newServings;
    carbs = food.carbs * newServings;
    fat = food.fat * newServings;
  }
  return {
    ...food,
    servings: newServings,
    adjustedCalories: calories,
    adjustedProtein: protein,
    adjustedCarbs: carbs,
    adjustedFat: fat,
  };
};

export const useMealStore = create<MealStore>()(
  // Use subscribeWithSelector middleware for better performance
  (set, get) => {
    const withOptimisticSave = async (
      mutate: (draft: Draft<MealStore>) => void,
      saveParams: {
        kidId: string;
        meal: MealType;
        day: DayType;
        readMeal?: MealType;
      },
    ) => {
      const { kidId, meal, day, readMeal } = saveParams;
      const mealKey = readMeal ?? meal;

      const prevSelections = structuredClone(
        get().selections[kidId]?.[day]?.[mealKey],
      );

      set(produce(mutate));

      try {
        const updatedSelections = get().selections[kidId][day][mealKey];
        const targetDate = calculateTargetDate(day);
        const saved = await saveMealHistory({
          kidId,
          meal,
          date: targetDate,
          selections: updatedSelections,
        });

        if (saved) {
          set(
            produce((draft: MealStore) => {
              upsertMealHistoryRecord(draft, saved);
            }),
          );
        }
      } catch (error) {
        set(
          produce((draft: MealStore) => {
            if (prevSelections !== undefined) {
              draft.selections[kidId][day][mealKey] = prevSelections;
            }
          }),
        );
        throw error;
      }
    };

    const withOptimisticHistoryUpdate = async (
      kidId: string,
      mutate: (draft: Draft<MealStore>) => void,
      serverPayload: Record<string, unknown>,
    ) => {
      const prevHistory = structuredClone(get().mealHistory[kidId] ?? []);

      set(produce(mutate));

      try {
        const response = await fetch("/api/meal-history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(serverPayload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(JSON.stringify(errorData));
        }
      } catch (error) {
        set(
          produce((draft: MealStore) => {
            draft.mealHistory[kidId] = prevHistory;
          }),
        );
        throw error;
      }
    };

    return {
      // Initial state
      selections: {},
      selectedKid: "",
      selectedDay: DEFAULT_DAY,
      selectedMeal: "breakfast" as MealType,
      mealHistory: {},

      // Selection actions
      setSelectedKid: (kidId) => {
        // Only update if different to prevent unnecessary re-renders
        const currentKidId = get().selectedKid;
        if (currentKidId === kidId) return;

        set({ selectedKid: kidId });

        // Initialize with default meal plan if not exists (sync operation)
        if (kidId) {
          set(
            produce((state) => {
              if (!state.selections[kidId]) {
                state.selections[kidId] = structuredClone(DEFAULT_MEAL_PLAN);
              }
            }),
          );

          // Load meal selections from database async (don't await)
          const loadSelections = async () => {
            try {
              const state = get();
              const response = await fetch(
                `/api/meal-selections?kidId=${kidId}&day=${state.selectedDay}`,
              );
              if (!response.ok)
                throw new Error("Failed to fetch meal selections");

              const selections =
                (await response.json()) as MealSelectionResponse[];

              // Update store with fetched selections
              set(
                produce((state) => {
                  // Update selections with data from database
                  selections.forEach((selection) => {
                    if (selection.meal && selection.selections) {
                      state.selections[kidId][state.selectedDay][
                        selection.meal
                      ] = selection.selections;
                    }
                  });
                }),
              );
            } catch (error) {
              console.error("Failed to load meal selections:", error);
            }
          };

          loadSelections();
        }
      },
      setSelectedDay: (day) => {
        const currentDay = get().selectedDay;
        if (currentDay === day) return;
        set({ selectedDay: day });
      },
      setSelectedMeal: (meal) => {
        const currentMeal = get().selectedMeal;
        if (currentMeal === meal) return;
        set({ selectedMeal: meal });
      },

      // Meal management actions
      initializeKids: (kids) => {
        const currentState = get();
        let needsUpdate = false;

        const newSelections = { ...currentState.selections };
        let newSelectedKid = currentState.selectedKid;

        kids.forEach((kid) => {
          if (!newSelections[kid.id]) {
            newSelections[kid.id] = structuredClone(DEFAULT_MEAL_PLAN);
            needsUpdate = true;
          }
        });

        if (!newSelectedKid && kids.length > 0) {
          newSelectedKid = kids[0].id;
          needsUpdate = true;
        }

        if (needsUpdate) {
          set({ selections: newSelections, selectedKid: newSelectedKid });
        }
      },

      handleFoodSelect: async (category: CategoryType, food: Food) => {
        const { selectedKid, selectedDay, selectedMeal } = get();
        if (!selectedKid || !selectedDay || !selectedMeal) return;

        await withOptimisticSave(
          (state) => {
            const currentMeal =
              state.selections[selectedKid][selectedDay][selectedMeal];
            if (!currentMeal) return;

            const adjustedFood = adjustFoodServings(food, 1);
            if (Array.isArray(currentMeal[category])) {
              const arr = currentMeal[category] as Food[];
              const existingIndex = arr.findIndex(
                (c: Food) => c.id === food.id,
              );
              if (existingIndex >= 0) {
                arr.splice(existingIndex, 1);
              } else {
                arr.push(adjustedFood);
              }
            } else {
              const isSelected =
                (currentMeal[category] as Food | null)?.id === food.id;
              (currentMeal as Record<CategoryType, Food | Food[] | null>)[
                category
              ] = isSelected ? null : adjustedFood;
            }
          },
          { kidId: selectedKid, meal: selectedMeal, day: selectedDay },
        );
      },

      handleBatchFoodSelect: async (
        selections: Array<{
          category: CategoryType;
          food: Food;
          servings: number;
        }>,
      ) => {
        const { selectedKid, selectedDay, selectedMeal } = get();
        if (!selectedKid || !selectedDay || !selectedMeal) return;

        await withOptimisticSave(
          (state) => {
            const currentMeal =
              state.selections[selectedKid][selectedDay][selectedMeal];
            if (!currentMeal) return;

            selections.forEach(({ category, food, servings }) => {
              const adjustedFood = adjustFoodServings(food, servings);
              if (Array.isArray(currentMeal[category])) {
                (currentMeal[category] as Food[]).push(adjustedFood);
              } else {
                (currentMeal as Record<CategoryType, Food | Food[] | null>)[
                  category
                ] = adjustedFood;
              }
            });
          },
          { kidId: selectedKid, meal: selectedMeal, day: selectedDay },
        );
      },

      handleServingAdjustment: async (
        category: CategoryType,
        id: string,
        servings: number,
      ) => {
        const { selectedKid, selectedDay, selectedMeal } = get();
        if (!selectedKid || !selectedDay || !selectedMeal) return;

        await withOptimisticSave(
          (state) => {
            const currentMeal =
              state.selections[selectedKid][selectedDay][selectedMeal];
            if (!currentMeal) return;

            if (Array.isArray(currentMeal[category])) {
              const arr = currentMeal[category] as Food[];
              const index = arr.findIndex((c: Food) => c.id === id);
              if (index >= 0) {
                arr[index] = adjustFoodServings(arr[index], servings);
              }
            } else {
              const food = currentMeal[category] as Food | null;
              if (food?.id === id) {
                (currentMeal as Record<CategoryType, Food | Food[] | null>)[
                  category
                ] = adjustFoodServings(food, servings);
              }
            }
          },
          { kidId: selectedKid, meal: selectedMeal, day: selectedDay },
        );
      },

      handleMilkToggle: async (mealType: MealType, enabled: boolean) => {
        const { selectedKid, selectedDay } = get();
        if (!selectedKid || !selectedDay) return;

        await withOptimisticSave(
          (state) => {
            const currentMeal =
              state.selections[selectedKid][selectedDay][mealType];
            if (!currentMeal) return;

            if (enabled) {
              const milkFood = useAppSettingsStore.getState().milkFood;
              currentMeal.milk = adjustFoodServings(milkFood, 1);
            } else {
              currentMeal.milk = null;
            }
          },
          { kidId: selectedKid, meal: mealType, day: selectedDay },
        );
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
          return {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            sodium: 0,
            sugar: 0,
            saturatedFat: 0,
          };
        }
        const mealSelections =
          state.selections[selectedKid]?.[selectedDay]?.[meal];
        const targetDateKey = format(
          calculateTargetDate(selectedDay),
          "yyyy-MM-dd",
        );
        const consumptionData = state.mealHistory[selectedKid]?.find(
          (record) =>
            record.meal === meal &&
            format(new Date(record.date), "yyyy-MM-dd") === targetDateKey,
        )?.consumptionData;
        return computeMealNutrition(mealSelections, consumptionData?.foods);
      },

      calculateDailyTotals: () => {
        const state = get();
        return computeDailyNutrition((meal) =>
          state.calculateMealNutrition(meal),
        );
      },

      resetMeal: (kidId, day, meal) =>
        set(
          produce((state) => {
            state.selections[kidId][day][meal] = structuredClone(
              DEFAULT_MEAL_PLAN.monday.breakfast,
            );
          }),
        ),

      copyDayToKid: async (targetKidId: string) => {
        const state = get();
        const { selectedKid, selectedDay } = state;
        if (!selectedKid || !selectedDay) return;

        const sourceDay = state.selections[selectedKid]?.[selectedDay];
        if (!sourceDay) return;

        const copiedDay = structuredClone(sourceDay);
        const prevTargetDay = structuredClone(
          state.selections[targetKidId]?.[selectedDay],
        );

        set(
          produce((draft: MealStore) => {
            if (!draft.selections[targetKidId]) {
              draft.selections[targetKidId] =
                structuredClone(DEFAULT_MEAL_PLAN);
            }
            draft.selections[targetKidId][selectedDay] = copiedDay;
          }),
        );

        try {
          const targetDate = calculateTargetDate(selectedDay);
          await Promise.all(
            (MEAL_TYPES as readonly MealType[]).map(async (meal) => {
              const mealSelections = copiedDay[meal];
              if (!mealSelections) return;
              const saved = await saveMealHistory({
                kidId: targetKidId,
                meal,
                date: targetDate,
                selections: mealSelections,
              });
              if (saved) {
                set(
                  produce((draft: MealStore) => {
                    upsertMealHistoryRecord(draft, saved);
                  }),
                );
              }
            }),
          );
        } catch (error) {
          set(
            produce((draft: MealStore) => {
              if (prevTargetDay) {
                draft.selections[targetKidId][selectedDay] = prevTargetDay;
              }
            }),
          );
          throw error;
        }
      },

      copyMealToKid: async (targetKidId: string) => {
        const state = get();
        const { selectedKid, selectedDay, selectedMeal } = state;
        if (!selectedKid || !selectedDay || !selectedMeal) return;

        const sourceMeal =
          state.selections[selectedKid]?.[selectedDay]?.[selectedMeal];
        if (!sourceMeal) return;

        const copiedMeal = structuredClone(sourceMeal);

        set(
          produce((draft: MealStore) => {
            if (!draft.selections[targetKidId]) {
              draft.selections[targetKidId] =
                structuredClone(DEFAULT_MEAL_PLAN);
            }
            draft.selections[targetKidId][selectedDay][selectedMeal] =
              copiedMeal;
          }),
        );

        try {
          const targetDate = calculateTargetDate(selectedDay);
          const saved = await saveMealHistory({
            kidId: targetKidId,
            meal: selectedMeal,
            date: targetDate,
            selections: copiedMeal,
          });

          if (saved) {
            set(
              produce((draft: MealStore) => {
                upsertMealHistoryRecord(draft, saved);
              }),
            );
          }
        } catch (error) {
          console.error("Failed to copy meal to kid:", error);
          throw error;
        }
      },

      loadSelectionsFromHistory: async ({
        kidId,
        date,
      }: LoadHistoryOptions) => {
        try {
          // First, fetch the available food options
          const foodResponse = await fetch("/api/foods");
          if (!foodResponse.ok) {
            throw new Error("Failed to fetch food options");
          }
          const foodOptions: Record<CategoryType, Food[]> =
            await foodResponse.json();

          // Then fetch the history
          const response = await fetch(
            `/api/meal-history?kidId=${kidId}&date=${date.toISOString()}`,
          );

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
              `Failed to load meal history: ${JSON.stringify(errorData)}`,
            );
          }

          const { history } = await response.json();

          if (history?.length) {
            const dayKey = format(date, "EEEE").toLowerCase() as DayType;

            // Helper function to find matching food from options
            const findMatchingFood = (
              savedFood: Food | null,
              category: CategoryType,
              foodOptions: Record<CategoryType, Food[]>,
            ): Food | null => {
              if (!savedFood) return null;

              const categoryFoods = foodOptions[category] || [];

              // Try to match by name first (most reliable)
              const matchByName = categoryFoods.find(
                (f: Food) =>
                  f.name.toLowerCase() === savedFood.name.toLowerCase(),
              );
              if (matchByName) {
                return adjustFoodServings(matchByName, savedFood.servings ?? 1);
              }

              // Then try UPC if available
              if (savedFood.upc) {
                const matchByUpc = categoryFoods.find(
                  (f: Food) => f.upc === savedFood.upc,
                );
                if (matchByUpc) {
                  return adjustFoodServings(
                    matchByUpc,
                    savedFood.servings ?? 1,
                  );
                }
              }

              return null;
            };

            set(
              produce((state) => {
                // Initialize the kid's selections if they don't exist
                if (!state.selections[kidId]) {
                  state.selections[kidId] = structuredClone(DEFAULT_MEAL_PLAN);
                }

                // Update selections for each meal found in history
                history.forEach((entry: MealHistoryRecord) => {
                  if (entry.meal && entry.selections) {
                    // Helper to restore array fields (supports both old Food|null and new Food[] format)
                    const restoreArray = (
                      raw: Food | Food[] | null | undefined,
                      category: CategoryType,
                    ): Food[] => {
                      if (!raw) return [];
                      const items = Array.isArray(raw) ? raw : [raw];
                      return items
                        .map((f) => findMatchingFood(f, category, foodOptions))
                        .filter((f): f is Food => f !== null);
                    };

                    // Match each food item with available options
                    const selections: MealSelection = {
                      proteins: restoreArray(
                        entry.selections.proteins as Food | Food[] | null,
                        "proteins",
                      ),
                      grains: restoreArray(
                        entry.selections.grains as Food | Food[] | null,
                        "grains",
                      ),
                      fruits: restoreArray(
                        entry.selections.fruits as Food | Food[] | null,
                        "fruits",
                      ),
                      vegetables: restoreArray(
                        entry.selections.vegetables as Food | Food[] | null,
                        "vegetables",
                      ),
                      milk: findMatchingFood(
                        entry.selections.milk,
                        "milk",
                        foodOptions,
                      ),
                      ranch: findMatchingFood(
                        entry.selections.ranch,
                        "ranch",
                        foodOptions,
                      ),
                      condiments: restoreArray(
                        entry.selections.condiments,
                        "condiments",
                      ),
                      other: restoreArray(
                        entry.selections.other as Food | Food[] | null,
                        "other",
                      ),
                    };

                    // Update the selections in state using Immer
                    if (state.selections[kidId]?.[dayKey]) {
                      state.selections[kidId][dayKey][entry.meal] = selections;
                    }
                  }
                });
              }),
            );
          }
        } catch (error) {
          console.error("Error loading selections:", error);
          throw error;
        }
      },

      updateConsumptionData: async (
        kidId: string,
        date: Date,
        meal: MealType,
        consumptionData: ConsumptionInfo,
      ) => {
        const state = get();
        const dayKey = format(date, "yyyy-MM-dd") as DayType;
        const selections =
          state.selections[kidId]?.[dayKey]?.[meal] ??
          createEmptyMealSelection();

        await withOptimisticHistoryUpdate(
          kidId,
          (draft) => {
            if (!draft.mealHistory[kidId]) {
              draft.mealHistory[kidId] = [];
            }

            const existingIndex = draft.mealHistory[kidId].findIndex(
              (record) =>
                record.kidId === kidId &&
                record.meal === meal &&
                format(new Date(record.date), "yyyy-MM-dd") === dayKey,
            );

            if (existingIndex !== -1) {
              draft.mealHistory[kidId][existingIndex].consumptionData =
                consumptionData;
            } else {
              (draft.mealHistory[kidId] as OptimisticMealHistoryRecord[]).push({
                _id: createLocalHistoryId(),
                _optimistic: true,
                kidId,
                date: date.toISOString(),
                meal,
                selections,
                consumptionData,
              });
            }
          },
          {
            kidId,
            mealData: {
              date: date.toISOString(),
              meal,
              selections,
              consumptionData,
            },
          },
        );
      },

      updateFoodConsumptionStatus: async (
        kidId: string,
        date: Date,
        meal: MealType,
        foodId: string,
        foodStatus: "not_eaten" | "partially_eaten" | "eaten",
        percentage?: number,
        notes?: string,
      ) => {
        const state = get();
        const dayKey = format(date, "yyyy-MM-dd") as DayType;

        const existingRecord = state.mealHistory[kidId]?.find(
          (record) =>
            record.kidId === kidId &&
            record.meal === meal &&
            format(new Date(record.date), "yyyy-MM-dd") === dayKey,
        );
        const existingConsumption = existingRecord?.consumptionData;

        const updatedFoods = [...(existingConsumption?.foods || [])];
        const existingFoodIndex = updatedFoods.findIndex(
          (f) => f.foodId === foodId,
        );

        if (existingFoodIndex !== -1) {
          updatedFoods[existingFoodIndex] = {
            foodId,
            status: foodStatus,
            percentageEaten: percentage,
            notes,
          };
        } else {
          updatedFoods.push({
            foodId,
            status: foodStatus,
            percentageEaten: percentage,
            notes,
          });
        }

        const eatenCount = updatedFoods.filter(
          (f) => f.status === "eaten",
        ).length;
        const notEatenCount = updatedFoods.filter(
          (f) => f.status === "not_eaten",
        ).length;
        const overallStatus: "offered" | "partially_eaten" | "eaten" =
          eatenCount === updatedFoods.length
            ? "eaten"
            : notEatenCount === updatedFoods.length
              ? "offered"
              : "partially_eaten";

        const updatedConsumptionData: ConsumptionInfo = {
          foods: updatedFoods,
          overallStatus,
          notes: existingConsumption?.notes,
        };

        const selections =
          state.selections[kidId]?.[dayKey]?.[meal] ??
          createEmptyMealSelection();

        await withOptimisticHistoryUpdate(
          kidId,
          (draft) => {
            if (!draft.mealHistory[kidId]) {
              draft.mealHistory[kidId] = [];
            }

            const existingIndex = draft.mealHistory[kidId].findIndex(
              (record) =>
                record.kidId === kidId &&
                record.meal === meal &&
                format(new Date(record.date), "yyyy-MM-dd") === dayKey,
            );

            if (existingIndex !== -1) {
              draft.mealHistory[kidId][existingIndex].consumptionData =
                updatedConsumptionData;
            } else {
              (draft.mealHistory[kidId] as OptimisticMealHistoryRecord[]).push({
                _id: createLocalHistoryId(),
                _optimistic: true,
                kidId,
                date: date.toISOString(),
                meal,
                selections,
                consumptionData: updatedConsumptionData,
              });
            }
          },
          {
            kidId,
            mealData: {
              date: date.toISOString(),
              meal,
              selections,
              consumptionData: updatedConsumptionData,
            },
          },
        );
      },
    };
  },
);
