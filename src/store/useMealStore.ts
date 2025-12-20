import { create } from "zustand";
import { produce } from "immer";
import { DEFAULT_MEAL_PLAN, MILK_OPTION } from "@/constants/meal-goals";
import { MEAL_TYPES } from "@/constants";
import type {
  MealHistoryRecord,
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

interface MealStore
  extends Omit<MealState, "selectedKid" | "selectedDay" | "selectedMeal"> {
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

  updateConsumptionData: (
    kidId: string,
    date: Date,
    meal: MealType,
    consumptionInfo: ConsumptionInfo
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
  record: MealHistoryRecord
) => {
  const kidId = record.kidId;
  if (!draft.mealHistory[kidId]) {
    draft.mealHistory[kidId] = [];
  }

  const recordDayKey = format(new Date(record.date), "yyyy-MM-dd");

  const existingIndex = draft.mealHistory[kidId].findIndex((r) => {
    if (r._id === record._id) return true;
    return (
      r.meal === record.meal &&
      format(new Date(r.date), "yyyy-MM-dd") === recordDayKey
    );
  });

  if (existingIndex >= 0) {
    draft.mealHistory[kidId][existingIndex] = record;
  } else {
    draft.mealHistory[kidId].push(record);
  }
};

const adjustFoodServings = (food: Food, newServings: number): SelectedFood => {
  return {
    ...food,
    servings: newServings,
    adjustedCalories: food.calories * newServings,
    adjustedProtein: food.protein * newServings,
    adjustedCarbs: food.carbs * newServings,
    adjustedFat: food.fat * newServings,
  };
};

export const useMealStore = create<MealStore>()(
  // Use subscribeWithSelector middleware for better performance
  (set, get) => ({
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
          })
        );

        // Load meal selections from database async (don't await)
        const loadSelections = async () => {
          try {
            const state = get();
            const response = await fetch(
              `/api/meal-selections?kidId=${kidId}&day=${state.selectedDay}`
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
                    state.selections[kidId][state.selectedDay][selection.meal] =
                      selection.selections;
                  }
                });
              })
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
      const state = get();
      const { selectedKid, selectedDay, selectedMeal } = state;
      if (!selectedKid || !selectedDay || !selectedMeal) return;

      // Update local state first
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

      // Get the updated selections after state change
      const updatedState = get();
      const updatedSelections =
        updatedState.selections[selectedKid][selectedDay][selectedMeal];

      // Save to database
      try {
        const targetDate = calculateTargetDate(selectedDay);
        const saved = await saveMealHistory({
          kidId: selectedKid,
          meal: selectedMeal,
          date: targetDate,
          selections: updatedSelections,
        });

        if (saved) {
          set(
            produce((draft: MealStore) => {
              upsertMealHistoryRecord(draft, saved);
            })
          );
        }
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

      // Get the updated selections after state change
      const updatedState = get();
      const updatedSelections =
        updatedState.selections[selectedKid][selectedDay][selectedMeal];

      // Save to database
      try {
        const targetDate = calculateTargetDate(selectedDay);
        const saved = await saveMealHistory({
          kidId: selectedKid,
          meal: selectedMeal,
          date: targetDate,
          selections: updatedSelections,
        });

        if (saved) {
          set(
            produce((draft: MealStore) => {
              upsertMealHistoryRecord(draft, saved);
            })
          );
        }
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

      // Get the updated selections after state change
      const updatedState = get();
      const updatedSelections =
        updatedState.selections[selectedKid][selectedDay][mealType];

      // Save to database
      try {
        const targetDate = calculateTargetDate(selectedDay);
        const saved = await saveMealHistory({
          kidId: selectedKid,
          meal: mealType,
          date: targetDate,
          selections: updatedSelections,
        });

        if (saved) {
          set(
            produce((draft: MealStore) => {
              upsertMealHistoryRecord(draft, saved);
            })
          );
        }
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

      const mealSelections =
        state.selections[selectedKid]?.[selectedDay]?.[meal];
      if (!mealSelections) {
        return { calories: 0, protein: 0, carbs: 0, fat: 0 };
      }

      // Initialize totals
      const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };

      // Check if there's consumption data for this meal
      // Convert selectedDay to Date object to compare consistently
      const selectedDate = new Date(selectedDay);
      const consumptionData = state.mealHistory[selectedKid]?.find(
        (record) =>
          record.meal === meal &&
          new Date(record.date).toDateString() === selectedDate.toDateString()
      )?.consumptionData;

      // Calculate nutrition for regular food items
      Object.entries(mealSelections).forEach(([category, food]) => {
        if (!food || category === "condiments") return;

        let multiplier = 1; // Default to 100% consumption

        // If consumption data exists, adjust based on the consumption status
        if (consumptionData && consumptionData.foods) {
          // Find the consumption status for this specific food
          const foodConsumption = consumptionData.foods.find(
            (f) => f.foodId === food.id
          );

          if (foodConsumption) {
            if (foodConsumption.status === "not_eaten") {
              multiplier = 0; // 0% consumed
            } else if (
              foodConsumption.status === "partially_eaten" &&
              foodConsumption.percentageEaten !== undefined
            ) {
              multiplier = foodConsumption.percentageEaten / 100; // Convert percentage to fraction
            }
            // If status is 'eaten', multiplier remains 1 (100% consumed)
          }
        }

        // Add the adjusted nutrition values based on consumption
        totals.calories += (food.adjustedCalories || 0) * multiplier;
        totals.protein += (food.adjustedProtein || 0) * multiplier;
        totals.carbs += (food.adjustedCarbs || 0) * multiplier;
        totals.fat += (food.adjustedFat || 0) * multiplier;
      });

      // Add condiments if they exist for this meal
      if (
        mealSelections.condiments &&
        Array.isArray(mealSelections.condiments)
      ) {
        mealSelections.condiments.forEach((condiment) => {
          if (!condiment) return;

          let multiplier = 1; // Default to 100% consumption

          // If consumption data exists, check consumption status for condiments
          if (consumptionData && consumptionData.foods) {
            // Find the consumption status for this specific condiment
            const foodConsumption = consumptionData.foods.find(
              (f) => f.foodId === condiment.id
            );

            if (foodConsumption) {
              if (foodConsumption.status === "not_eaten") {
                multiplier = 0; // 0% consumed
              } else if (
                foodConsumption.status === "partially_eaten" &&
                foodConsumption.percentageEaten !== undefined
              ) {
                multiplier = foodConsumption.percentageEaten / 100; // Convert percentage to fraction
              }
              // If status is 'eaten', multiplier remains 1 (100% consumed)
            }
          }

          totals.calories += (condiment.adjustedCalories || 0) * multiplier;
          totals.protein += (condiment.adjustedProtein || 0) * multiplier;
          totals.carbs += (condiment.adjustedCarbs || 0) * multiplier;
          totals.fat += (condiment.adjustedFat || 0) * multiplier;
        });
      }

      return {
        calories: Math.round(totals.calories),
        protein: Math.round(totals.protein),
        carbs: Math.round(totals.carbs),
        fat: Math.round(totals.fat),
      };
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

    loadSelectionsFromHistory: async ({ kidId, date }: LoadHistoryOptions) => {
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
          `/api/meal-history?kidId=${kidId}&date=${date.toISOString()}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            `Failed to load meal history: ${JSON.stringify(errorData)}`
          );
        }

        const { history } = await response.json();

        if (history?.length) {
          const dayKey = format(date, "EEEE").toLowerCase() as DayType;

          // Helper function to find matching food from options
          const findMatchingFood = (
            savedFood: Food | null,
            category: CategoryType,
            foodOptions: Record<CategoryType, Food[]>
          ): Food | null => {
            if (!savedFood) return null;

            const categoryFoods = foodOptions[category] || [];

            // Try to match by name first (most reliable)
            const matchByName = categoryFoods.find(
              (f: Food) => f.name.toLowerCase() === savedFood.name.toLowerCase()
            );
            if (matchByName) {
              return {
                ...matchByName,
                servings: savedFood.servings || 1,
                adjustedCalories:
                  savedFood.adjustedCalories ||
                  matchByName.calories * (savedFood.servings || 1),
                adjustedProtein:
                  savedFood.adjustedProtein ||
                  matchByName.protein * (savedFood.servings || 1),
                adjustedCarbs:
                  savedFood.adjustedCarbs ||
                  matchByName.carbs * (savedFood.servings || 1),
                adjustedFat:
                  savedFood.adjustedFat ||
                  matchByName.fat * (savedFood.servings || 1),
              };
            }

            // Then try UPC if available
            if (savedFood.upc) {
              const matchByUpc = categoryFoods.find(
                (f: Food) => f.upc === savedFood.upc
              );
              if (matchByUpc) {
                return {
                  ...matchByUpc,
                  servings: savedFood.servings || 1,
                  adjustedCalories:
                    savedFood.adjustedCalories ||
                    matchByUpc.calories * (savedFood.servings || 1),
                  adjustedProtein:
                    savedFood.adjustedProtein ||
                    matchByUpc.protein * (savedFood.servings || 1),
                  adjustedCarbs:
                    savedFood.adjustedCarbs ||
                    matchByUpc.carbs * (savedFood.servings || 1),
                  adjustedFat:
                    savedFood.adjustedFat ||
                    matchByUpc.fat * (savedFood.servings || 1),
                };
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
                  // Match each food item with available options
                  const selections: MealSelection = {
                    proteins: findMatchingFood(
                      entry.selections.proteins,
                      "proteins",
                      foodOptions
                    ),
                    grains: findMatchingFood(
                      entry.selections.grains,
                      "grains",
                      foodOptions
                    ),
                    fruits: findMatchingFood(
                      entry.selections.fruits,
                      "fruits",
                      foodOptions
                    ),
                    vegetables: findMatchingFood(
                      entry.selections.vegetables,
                      "vegetables",
                      foodOptions
                    ),
                    milk: findMatchingFood(
                      entry.selections.milk,
                      "milk",
                      foodOptions
                    ),
                    ranch: findMatchingFood(
                      entry.selections.ranch,
                      "ranch",
                      foodOptions
                    ),
                    condiments: Array.isArray(entry.selections.condiments)
                      ? entry.selections.condiments
                          .map((c) =>
                            findMatchingFood(c, "condiments", foodOptions)
                          )
                          .filter((c): c is Food => c !== null)
                      : [],
                    other: findMatchingFood(
                      entry.selections.other,
                      "other",
                      foodOptions
                    ),
                  };

                  // Update the selections in state using Immer
                  if (state.selections[kidId]?.[dayKey]) {
                    state.selections[kidId][dayKey][entry.meal] = selections;
                  }
                }
              });
            })
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
      consumptionData: ConsumptionInfo
    ) => {
      const state = get();
      const dayKey = format(date, "yyyy-MM-dd") as DayType;

      try {
        // Update the local state first
        set(
          produce((draft: MealStore) => {
            if (!draft.mealHistory[kidId]) {
              draft.mealHistory[kidId] = [];
            }

            // Find existing record or create new one
            const existingIndex = draft.mealHistory[kidId].findIndex(
              (record) =>
                record.kidId === kidId &&
                record.meal === meal &&
                format(new Date(record.date), "yyyy-MM-dd") === dayKey
            );

            if (existingIndex !== -1) {
              // Update existing record
              draft.mealHistory[kidId][existingIndex].consumptionData =
                consumptionData;
            } else {
              // Create new record if it doesn't exist
              draft.mealHistory[kidId].push({
                _id: createLocalHistoryId(),
                kidId,
                date: date.toISOString(),
                meal,
                // For now we'll create an empty selections object, but in real usage this would come from the state
                selections: state.selections[kidId]?.[dayKey]?.[meal] || {
                  proteins: null,
                  grains: null,
                  fruits: null,
                  vegetables: null,
                  milk: null,
                  ranch: null,
                  condiments: [],
                  other: null,
                },
                consumptionData,
              });
            }
          })
        );

        // Update the server
        const response = await fetch("/api/meal-history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kidId,
            mealData: {
              date: date.toISOString(),
              meal,
              selections: state.selections[kidId]?.[dayKey]?.[meal] || {
                proteins: null,
                grains: null,
                fruits: null,
                vegetables: null,
                milk: null,
                ranch: null,
                condiments: [],
                other: null,
              },
              consumptionData,
            },
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            `Failed to update consumption data: ${JSON.stringify(errorData)}`
          );
        }

        console.log("Consumption data updated successfully");
      } catch (error) {
        console.error("Error updating consumption data:", error);
        throw error;
      }
    },

    updateFoodConsumptionStatus: async (
      kidId: string,
      date: Date,
      meal: MealType,
      foodId: string,
      foodStatus: "not_eaten" | "partially_eaten" | "eaten",
      percentage?: number,
      notes?: string
    ) => {
      const state = get();
      const dayKey = format(date, "yyyy-MM-dd") as DayType;

      try {
        // Get existing consumption data or create new one
        let existingConsumption: ConsumptionInfo | undefined = undefined;

        if (state.mealHistory[kidId]) {
          const existingRecord = state.mealHistory[kidId].find(
            (record) =>
              record.kidId === kidId &&
              record.meal === meal &&
              format(new Date(record.date), "yyyy-MM-dd") === dayKey
          );
          existingConsumption = existingRecord?.consumptionData;
        }

        // Create or update the foods array with the new status for this food
        const updatedFoods = [...(existingConsumption?.foods || [])];
        const existingFoodIndex = updatedFoods.findIndex(
          (f) => f.foodId === foodId
        );

        if (existingFoodIndex !== -1) {
          // Update existing food status
          updatedFoods[existingFoodIndex] = {
            foodId,
            status: foodStatus,
            percentageEaten: percentage,
            notes,
          };
        } else {
          // Add new food status
          updatedFoods.push({
            foodId,
            status: foodStatus,
            percentageEaten: percentage,
            notes,
          });
        }

        // Determine overall status based on food statuses
        let overallStatus: "offered" | "partially_eaten" | "eaten" = "offered";
        if (updatedFoods.length > 0) {
          const eatenCount = updatedFoods.filter(
            (f) => f.status === "eaten"
          ).length;
          const notEatenCount = updatedFoods.filter(
            (f) => f.status === "not_eaten"
          ).length;

          if (eatenCount === updatedFoods.length) {
            overallStatus = "eaten";
          } else if (notEatenCount === updatedFoods.length) {
            overallStatus = "offered"; // If nothing eaten, mark as offered
          } else {
            overallStatus = "partially_eaten";
          }
        }

        const updatedConsumptionData: ConsumptionInfo = {
          foods: updatedFoods,
          overallStatus,
          notes: existingConsumption?.notes, // Preserve existing notes
        };

        // Update the local state first
        set(
          produce((draft: MealStore) => {
            if (!draft.mealHistory[kidId]) {
              draft.mealHistory[kidId] = [];
            }

            // Find existing record or create new one
            const existingIndex = draft.mealHistory[kidId].findIndex(
              (record) =>
                record.kidId === kidId &&
                record.meal === meal &&
                format(new Date(record.date), "yyyy-MM-dd") === dayKey
            );

            if (existingIndex !== -1) {
              // Update existing record
              draft.mealHistory[kidId][existingIndex].consumptionData =
                updatedConsumptionData;
            } else {
              // Create new record if it doesn't exist
              draft.mealHistory[kidId].push({
                _id: createLocalHistoryId(),
                kidId,
                date: date.toISOString(),
                meal,
                // For now we'll create an empty selections object, but in real usage this would come from the state
                selections: state.selections[kidId]?.[dayKey]?.[meal] || {
                  proteins: null,
                  grains: null,
                  fruits: null,
                  vegetables: null,
                  milk: null,
                  ranch: null,
                  condiments: [],
                  other: null,
                },
                consumptionData: updatedConsumptionData,
              });
            }
          })
        );

        // Update the server
        const response = await fetch("/api/meal-history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kidId,
            mealData: {
              date: date.toISOString(),
              meal,
              selections: state.selections[kidId]?.[dayKey]?.[meal] || {
                proteins: null,
                grains: null,
                fruits: null,
                vegetables: null,
                milk: null,
                ranch: null,
                condiments: [],
                other: null,
              },
              consumptionData: updatedConsumptionData,
            },
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            `Failed to update food consumption status: ${JSON.stringify(
              errorData
            )}`
          );
        }

        console.log("Food consumption status updated successfully");
      } catch (error) {
        console.error("Error updating food consumption status:", error);
        throw error;
      }
    },
  })
);
