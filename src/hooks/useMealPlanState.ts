// hooks/useMealPlanState.ts
import { useState, useCallback, useEffect } from "react";
import {
  MealType,
  DayType,
  CategoryType,
  Food,
  SelectedFood,
  MealPlan,
  MealHistoryRecord,
} from "@/types/food";
import {
  DEFAULT_MEAL_PLAN,
  MILK_OPTION,
  RANCH_OPTION,
} from "@/constants/meal-goals";
import { Kid } from "@/types/user";
import { MEAL_TYPES } from "@/constants";

// Utility function for safe local storage operations
const safeLocalStorage = {
  getItem: <T>(key: string, defaultValue: T): T => {
    try {
      const serializedItem = localStorage.getItem(key);
      return serializedItem ? JSON.parse(serializedItem) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  setItem: (key: string, value: unknown): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
    }
  },
};

// Utility function to get the current day
const DAYS: readonly DayType[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const getCurrentDay = (): DayType => {
  return DAYS[new Date().getDay()];
};

// Deep clone utility function
const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(deepClone) as T;
  const clonedObj: Partial<T> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      clonedObj[key] = deepClone(obj[key]);
    }
  }
  return clonedObj as T;
};

// Create initial meal plan
const createInitialMealPlan = (
  initialKids: Kid[]
): Record<string, MealPlan> => {
  if (initialKids.length === 0) {
    throw new Error("At least one kid is required to initialize meal plan");
  }
  return initialKids.reduce<Record<string, MealPlan>>((acc, kid) => {
    acc[kid.id] = deepClone(DEFAULT_MEAL_PLAN);
    return acc;
  }, {});
};

export function useMealPlanState(initialKids: Kid[]) {
  if (initialKids.length === 0) {
    throw new Error("At least one kid is required to use meal plan state");
  }

  // Core selection state
  const [selectedKid, setSelectedKid] = useState<string>(initialKids[0].id);
  const [selectedDay, setSelectedDay] = useState<DayType>(getCurrentDay());
  const [selectedMeal, setSelectedMeal] = useState<MealType>("breakfast");
  const [activeHistoryEntry, setActiveHistoryEntry] =
    useState<MealHistoryRecord | null>(null);

  // Selections state with persistent storage
  const [selections, setSelections] = useState<Record<string, MealPlan>>(() => {
    const savedSelections = safeLocalStorage.getItem(
      "meal-selections",
      createInitialMealPlan(initialKids)
    );

    initialKids.forEach((kid) => {
      if (!savedSelections[kid.id]) {
        savedSelections[kid.id] = deepClone(DEFAULT_MEAL_PLAN);
      }
    });

    return savedSelections;
  });

  // Meal history state
  const [mealHistory, setMealHistory] = useState<
    Record<string, MealHistoryRecord[]>
  >({
    [initialKids[0].id]: [],
  });

  // Synchronize selections with local storage
  useEffect(() => {
    if (selectedKid) {
      safeLocalStorage.setItem("meal-selections", selections);
    }
  }, [selections, selectedKid]);

  useEffect(() => {
    const fetchMealHistory = async () => {
      if (!selectedKid) return;

      try {
        const response = await fetch(`/api/meal-history?kidId=${selectedKid}`);
        if (!response.ok) {
          throw new Error("Failed to fetch meal history");
        }
        const history = await response.json();
        setMealHistory((prev) => ({
          ...prev,
          [selectedKid]: history,
        }));
      } catch (error) {
        console.error("Failed to fetch meal history:", error);
      }
    };

    fetchMealHistory();
  }, [selectedKid]);

  // Food selection handler
  const handleFoodSelect = useCallback(
    async (category: CategoryType, food: Food) => {
      if (!selectedMeal || !selectedDay || !selectedKid) return;

      setSelections((prev) => {
        const newSelections = structuredClone(prev);
        const currentMeal =
          // @ts-expect-error TypeScript doesn't understand the dynamic keys here
          newSelections[selectedKid][selectedDay][selectedMeal];

        currentMeal[category] =
          currentMeal[category]?.name === food.name
            ? null
            : {
                ...food,
                servings: 1,
                adjustedCalories: food.calories,
                adjustedProtein: food.protein,
                adjustedCarbs: food.carbs,
                adjustedFat: food.fat,
              };

        // Save to history
        const saveToHistory = async () => {
          try {
            const response = await fetch("/api/meal-history", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                kidId: selectedKid,
                mealData: {
                  meal: selectedMeal,
                  selections: currentMeal,
                },
              }),
            });

            if (!response.ok) {
              throw new Error("Failed to save meal history");
            }

            const savedEntry = await response.json();
            setMealHistory((prev) => ({
              ...prev,
              [selectedKid]: [
                ...(prev[selectedKid] || []).filter(
                  (entry) =>
                    !(
                      entry.meal === savedEntry.meal &&
                      new Date(entry.date).toDateString() ===
                        new Date(savedEntry.date).toDateString()
                    )
                ),
                savedEntry,
              ].sort(
                (a, b) =>
                  new Date(b.date).getTime() - new Date(a.date).getTime()
              ),
            }));

            setActiveHistoryEntry(savedEntry);
          } catch (error) {
            console.error("Failed to save meal history:", error);
          }
        };

        saveToHistory();
        return newSelections;
      });
    },
    [selectedKid, selectedDay, selectedMeal]
  );

  // Serving adjustment handler
  const handleServingAdjustment = useCallback(
    async (category: CategoryType, adjustedFood: SelectedFood) => {
      if (!selectedMeal || !selectedDay || !selectedKid) return;

      setSelections((prev) => {
        const newSelections = deepClone(prev);

        if (adjustedFood && adjustedFood.servings > 0) {
          // @ts-expect-error TypeScript doesn't understand the dynamic keys here
          newSelections[selectedKid][selectedDay][selectedMeal][category] = {
            ...adjustedFood,
            adjustedCalories: adjustedFood.calories * adjustedFood.servings,
            adjustedProtein: adjustedFood.protein * adjustedFood.servings,
            adjustedCarbs: adjustedFood.carbs * adjustedFood.servings,
            adjustedFat: adjustedFood.fat * adjustedFood.servings,
          };

          // Save updated meal to history
        }

        return newSelections;
      });
    },
    [selectedMeal, selectedDay, selectedKid]
  );

  // Calculate meal nutrition
  const calculateMealNutrition = useCallback(
    (meal: MealType) => {
      if (!selectedKid || !selectedDay || !meal) {
        return { calories: 0, protein: 0, carbs: 0, fat: 0 };
      }

      // @ts-expect-error TypeScript doesn't understand the dynamic keys here
      const mealSelections = selections[selectedKid]?.[selectedDay]?.[meal];
      if (!mealSelections) {
        return { calories: 0, protein: 0, carbs: 0, fat: 0 };
      }

      return Object.values(mealSelections).reduce(
        (sum, food) => {
          if (!food) return sum;
          return {
            // @ts-expect-error TODO: fix

            calories: sum.calories + (food.adjustedCalories ?? food.calories),
            // @ts-expect-error TODO: fix

            protein: sum.protein + (food.adjustedProtein ?? food.protein),
            // @ts-expect-error TODO: fix

            carbs: sum.carbs + (food.adjustedCarbs ?? food.carbs),
            // @ts-expect-error TODO: fix

            fat: sum.fat + (food.adjustedFat ?? food.fat),
          };
        },
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );
    },
    [selections, selectedKid, selectedDay]
  );

  // Calculate daily totals
  const calculateDailyTotals = useCallback(() => {
    if (!selectedKid || !selectedDay) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }

    return MEAL_TYPES.reduce(
      (dailyTotals, mealType) => {
        const mealNutrition = calculateMealNutrition(mealType);
        return {
          // @ts-expect-error TODO: fix

          calories: dailyTotals.calories + mealNutrition.calories,
          // @ts-expect-error TODO: fix

          protein: dailyTotals.protein + mealNutrition.protein,
          // @ts-expect-error TODO: fix

          carbs: dailyTotals.carbs + mealNutrition.carbs,
          // @ts-expect-error TODO: fix

          fat: dailyTotals.fat + mealNutrition.fat,
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [selectedKid, selectedDay, calculateMealNutrition]);

  // Milk toggle handler
  const handleMilkToggle = useCallback(
    (mealType: MealType, value: boolean) => {
      if (!selectedKid || !selectedDay) return;

      setSelections((prev) => {
        const newSelections = deepClone(prev);
        // @ts-expect-error TODO: fix

        const milkFood: SelectedFood = {
          ...MILK_OPTION,
          category: "milk",
          servings: 1,
          adjustedCalories: MILK_OPTION.calories,
          adjustedProtein: MILK_OPTION.protein,
          adjustedCarbs: MILK_OPTION.carbs,
          adjustedFat: MILK_OPTION.fat,
        };

        //@ts-expect-error TypeScript doesn't understand the dynamic keys here
        newSelections[selectedKid][selectedDay][mealType].milk = value
          ? milkFood
          : null;

        return newSelections;
      });
    },
    [selectedKid, selectedDay]
  );

  // Ranch toggle handler
  const handleRanchToggle = useCallback(
    (mealType: MealType, value: boolean, servings: number) => {
      if (!selectedKid || !selectedDay) return;

      setSelections((prev) => {
        const newSelections = deepClone(prev);
        // @ts-expect-error TODO: fix

        const ranchFood: SelectedFood = {
          ...RANCH_OPTION,
          category: "vegetables",
          servings,
          adjustedCalories: RANCH_OPTION.calories * servings,
          adjustedProtein: RANCH_OPTION.protein * servings,
          adjustedCarbs: RANCH_OPTION.carbs * servings,
          adjustedFat: RANCH_OPTION.fat * servings,
        };

        //@ts-expect-error TypeScript doesn't understand the dynamic keys here
        newSelections[selectedKid][selectedDay][mealType].ranch = value
          ? ranchFood
          : null;

        return newSelections;
      });
    },
    [selectedKid, selectedDay]
  );

  return {
    selectedKid,
    selectedDay,
    selectedMeal,
    selections,
    mealHistory,
    activeHistoryEntry,
    setSelectedKid,
    setSelectedDay,
    setSelectedMeal,
    setSelections,
    handleFoodSelect,
    handleServingAdjustment,
    handleMilkToggle,
    handleRanchToggle,
    calculateMealNutrition,
    calculateDailyTotals,
  };
}
