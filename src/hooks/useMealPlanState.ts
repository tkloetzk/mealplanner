import { useState, useCallback, useEffect } from "react";
import {
  MealType,
  DayType,
  CategoryType,
  Food,
  SelectedFood,
  MealPlan,
  MealHistoryEntry,
} from "@/types/food";
import {
  DEFAULT_MEAL_PLAN,
  MILK_OPTION,
  RANCH_OPTION,
} from "@/constants/meal-goals";
import { Kid } from "@/types/user";

// Utility function for safe local storage operations
const safeLocalStorage = {
  getItem: <T>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading ${key} from localStorage:`, error);
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

// Utility function to create a deep clone of the default meal plan
const createInitialMealPlan = (
  initialKids: Kid[]
): Record<string, MealPlan> => {
  if (initialKids.length === 0) {
    throw new Error("At least one kid is required to initialize meal plan");
  }
  return initialKids.reduce<Record<string, MealPlan>>((acc, kid) => {
    acc[kid.id] = structuredClone(DEFAULT_MEAL_PLAN);
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

  // Selections state with persistent storage
  const [selections, setSelections] = useState<Record<string, MealPlan>>(() => {
    const savedSelections = safeLocalStorage.getItem(
      "meal-selections",
      createInitialMealPlan(initialKids)
    );

    // Ensure all kids have a meal plan
    initialKids.forEach((kid) => {
      if (!savedSelections[kid.id]) {
        savedSelections[kid.id] = structuredClone(DEFAULT_MEAL_PLAN);
      }
    });

    return savedSelections;
  });

  // Meal history state
  const [mealHistory, setMealHistory] = useState<
    Record<string, MealHistoryEntry[]>
  >({
    [initialKids[0].id]: [],
  });

  // Synchronize selections with local storage
  useEffect(() => {
    if (selectedKid) {
      safeLocalStorage.setItem("meal-selections", selections);
    }
  }, [selections, selectedKid]);

  // Meal history management method
  const addToMealHistory = useCallback(
    (food: Food) => {
      if (!selectedKid || !selectedMeal) return;

      setMealHistory((prev) => {
        const kidHistory = prev[selectedKid] || [];

        // Create a complete MealSelection object
        const currentSelections = selections[selectedKid]?.[selectedDay]?.[
          selectedMeal
        ] || {
          grains: null,
          fruits: null,
          proteins: null,
          vegetables: null,
          milk: null,
          ranch: null,
        };

        // Prevent duplicate entries
        const isDuplicate = kidHistory.some(
          (entry) =>
            entry.meal === selectedMeal &&
            entry.selections[food.category as keyof typeof entry.selections]
              ?.name === food.name
        );

        if (isDuplicate) return prev;

        // Create new history entry with full MealSelection
        const newHistoryEntry: MealHistoryEntry = {
          date: new Date().toISOString(),
          meal: selectedMeal,
          selections: {
            ...currentSelections,
            [food.category]: {
              ...food,
              servings: 1,
              adjustedCalories: food.calories,
              adjustedProtein: food.protein,
              adjustedCarbs: food.carbs,
              adjustedFat: food.fat,
            } as SelectedFood,
          },
        };

        // Update history, limiting to last 10 entries
        return {
          ...prev,
          [selectedKid]: [newHistoryEntry, ...kidHistory].slice(0, 10),
        };
      });
    },
    [selectedKid, selectedMeal, selectedDay, selections]
  );

  // Advanced food selection method with comprehensive validation
  const handleFoodSelect = useCallback(
    (category: CategoryType, food: Food) => {
      // Validate selection context
      if (!selectedMeal || !selectedDay || !selectedKid) {
        console.warn("Incomplete selection context", {
          meal: selectedMeal,
          day: selectedDay,
          kid: selectedKid,
        });
        return;
      }

      // Validate food compatibility with selected meal
      if (!food.meal.includes(selectedMeal)) {
        console.warn(
          `Food ${food.name} is not compatible with ${selectedMeal}`
        );
        return;
      }

      setSelections((prev) => {
        // Create a deep copy of previous selections
        const newSelections = structuredClone(prev);

        // Ensure kid's meal plan exists
        if (!newSelections[selectedKid]) {
          newSelections[selectedKid] = structuredClone(DEFAULT_MEAL_PLAN);
        }

        // Get current selection for the specific category
        const currentSelection =
          newSelections[selectedKid][selectedDay][selectedMeal][category];

        // Determine new food selection (toggle logic)
        const newFoodSelection =
          currentSelection?.name === food.name
            ? null
            : {
                ...food,
                servings: 1,
                adjustedCalories: food.calories,
                adjustedProtein: food.protein,
                adjustedCarbs: food.carbs,
                adjustedFat: food.fat,
              };

        // Update the specific selection
        newSelections[selectedKid][selectedDay][selectedMeal][category] =
          newFoodSelection;

        return newSelections;
      });

      // Optionally add to meal history
      addToMealHistory(food);
    },
    [selectedMeal, selectedDay, selectedKid, addToMealHistory]
  );

  // Serving adjustment method
  const handleServingAdjustment = useCallback(
    (category: CategoryType, adjustedFood: SelectedFood) => {
      if (!selectedMeal || !selectedDay || !selectedKid) return;

      setSelections((prev) => {
        const newSelections = structuredClone(prev);

        if (adjustedFood && adjustedFood.servings > 0) {
          newSelections[selectedKid][selectedDay][selectedMeal][category] = {
            ...adjustedFood,
            adjustedCalories: adjustedFood.calories * adjustedFood.servings,
            adjustedProtein: adjustedFood.protein * adjustedFood.servings,
            adjustedCarbs: adjustedFood.carbs * adjustedFood.servings,
            adjustedFat: adjustedFood.fat * adjustedFood.servings,
          };
        }

        return newSelections;
      });
    },
    [selectedMeal, selectedDay, selectedKid]
  );

  // Memoized nutrition calculation methods
  const calculateMealNutrition = useCallback(
    (meal: MealType) => {
      if (
        !selectedKid ||
        !selectedDay ||
        !selections[selectedKid]?.[selectedDay]?.[meal]
      ) {
        return {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
        };
      }

      const mealSelections = selections[selectedKid][selectedDay][meal];
      return Object.values(mealSelections).reduce(
        (sum, item) => {
          if (!item) return sum;
          return {
            calories:
              sum.calories + (item.adjustedCalories ?? item.calories ?? 0),
            protein: sum.protein + (item.adjustedProtein ?? item.protein ?? 0),
            carbs: sum.carbs + (item.adjustedCarbs ?? item.carbs ?? 0),
            fat: sum.fat + (item.adjustedFat ?? item.fat ?? 0),
          };
        },
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );
    },
    [selections, selectedKid, selectedDay]
  );

  // Calculate daily nutrition totals
  const calculateDailyTotals = useCallback(() => {
    if (
      !selectedKid ||
      !selectedDay ||
      !selections[selectedKid]?.[selectedDay]
    ) {
      return {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
      };
    }

    const daySelections = selections[selectedKid][selectedDay];
    return Object.values(daySelections).reduce(
      (totals, mealSelections) => {
        if (!mealSelections) return totals;

        Object.values(
          mealSelections as Record<string, SelectedFood | null>
        ).forEach((food: SelectedFood | null) => {
          if (food) {
            totals.calories += food.adjustedCalories ?? food.calories ?? 0;
            totals.protein += food.adjustedProtein ?? food.protein ?? 0;
            totals.carbs += food.adjustedCarbs ?? food.carbs ?? 0;
            totals.fat += food.adjustedFat ?? food.fat ?? 0;
          }
        });
        return totals;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [selections, selectedKid, selectedDay]);

  // Milk toggle method
  const handleMilkToggle = useCallback(
    (mealType: MealType, value: boolean) => {
      if (!selectedKid || !selectedDay) return;

      setSelections((prev) => {
        const newSelections = structuredClone(prev);

        // Ensure kid's meal plan exists
        if (!newSelections[selectedKid]) {
          newSelections[selectedKid] = structuredClone(DEFAULT_MEAL_PLAN);
        }

        // Toggle milk
        const milkFood: SelectedFood = {
          ...MILK_OPTION,
          category: "milk",
          servings: 1,
          adjustedCalories: MILK_OPTION.calories,
          adjustedProtein: MILK_OPTION.protein,
          adjustedCarbs: MILK_OPTION.carbs,
          adjustedFat: MILK_OPTION.fat,
        };

        newSelections[selectedKid][selectedDay][mealType].milk = value
          ? milkFood
          : null;

        return newSelections;
      });
    },
    [selectedKid, selectedDay]
  );

  // Ranch toggle method
  const handleRanchToggle = useCallback(
    (mealType: MealType, value: boolean, servings: number) => {
      if (!selectedKid || !selectedDay) return;

      setSelections((prev) => {
        const newSelections = structuredClone(prev);

        // Ensure kid's meal plan exists
        if (!newSelections[selectedKid]) {
          newSelections[selectedKid] = structuredClone(DEFAULT_MEAL_PLAN);
        }

        // Toggle ranch
        const ranchFood: SelectedFood = {
          ...RANCH_OPTION,
          category: "vegetables", // Use 'vegetables' category
          servings,
          adjustedCalories: RANCH_OPTION.calories * servings,
          adjustedProtein: RANCH_OPTION.protein * servings,
          adjustedCarbs: RANCH_OPTION.carbs * servings,
          adjustedFat: RANCH_OPTION.fat * servings,
        };

        newSelections[selectedKid][selectedDay][mealType].ranch = value
          ? ranchFood
          : null;

        return newSelections;
      });
    },
    [selectedKid, selectedDay]
  );

  // Return the hook's state and methods
  return {
    // State values
    selectedKid,
    selectedDay,
    selectedMeal,
    selections,
    mealHistory,

    // State setters
    setSelectedKid,
    setSelectedDay,
    setSelectedMeal,
    setSelections,

    // Core methods
    handleFoodSelect,
    handleServingAdjustment,
    handleMilkToggle,
    handleRanchToggle,
    addToMealHistory,

    // Calculation methods
    calculateMealNutrition,
    calculateDailyTotals,
  };
}
