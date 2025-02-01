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
import { DEFAULT_MEAL_PLAN, MILK_OPTION } from "@/constants/meal-goals";
import { Kid } from "@/types/user";
import { BREAKFAST, MEAL_TYPES } from "@/constants";

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

export const useMealPlanState = (initialKids: Kid[]) => {
  if (initialKids.length === 0) {
    throw new Error("At least one kid is required to use meal plan state");
  }

  const [selectedKid, setSelectedKid] = useState<string | null>(
    initialKids.length > 0 ? initialKids[0].id : null
  );

  const [selectedDay, setSelectedDay] = useState<DayType>(getCurrentDay());
  const [selectedMeal, setSelectedMeal] = useState<MealType>(BREAKFAST);
  const [selections, setSelections] = useState<Record<string, MealPlan>>(() =>
    initialKids.reduce<Record<string, MealPlan>>((acc, kid) => {
      acc[kid.id] = structuredClone(DEFAULT_MEAL_PLAN);
      return acc;
    }, {})
  );

  const [mealHistory, setMealHistory] = useState<
    Record<string, MealHistoryRecord[]>
  >({});

  const fetchMealHistory = useCallback(async (kidId: string) => {
    try {
      const response = await fetch(`/api/meal-history?kidId=${kidId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch meal history");
      }
      const history = await response.json();
      setMealHistory((prev) => ({
        ...prev,
        [kidId]: history,
      }));
    } catch (error) {
      console.error("Error fetching meal history:", error);
    }
  }, []);

  useEffect(() => {
    if (selectedKid) {
      fetchMealHistory(selectedKid);
    }
  }, [selectedKid, fetchMealHistory]);

  const handleFoodSelect = useCallback(
    (category: CategoryType, food: Food) => {
      if (!selectedMeal || !selectedDay || !selectedKid) return;

      setSelections((prevSelections) => {
        // Create a deep clone of previous selections
        const newSelections = JSON.parse(JSON.stringify(prevSelections));

        // Get the current meal's selections
        const currentMeal =
          newSelections[selectedKid][selectedDay][selectedMeal];

        if (category === "condiments") {
          const existingCondimentIndex = currentMeal.condiments.findIndex(
            (c) => c.foodId === food.id
          );

          if (existingCondimentIndex >= 0) {
            // Remove condiment if it exists
            currentMeal.condiments = currentMeal.condiments.filter(
              (c) => c.foodId !== food.id
            );
          } else {
            // Add new condiment
            currentMeal.condiments.push({
              foodId: food.id,
              servings: 1,
              adjustedCalories: food.calories,
              adjustedProtein: food.protein,
              adjustedCarbs: food.carbs,
              adjustedFat: food.fat,
            });
          }
        } else {
          // For main food categories
          const isSelectedInCurrentMeal = currentMeal[category]?.id === food.id;

          if (isSelectedInCurrentMeal) {
            // Deselect if already selected in this meal
            currentMeal[category] = null;
          } else {
            // Check if the food is compatible with the current meal type
            if (food.meal.includes(selectedMeal)) {
              // Select the food only for this meal
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
        }

        // Remove the food from meals where it's not compatible or not explicitly selected
        MEAL_TYPES.forEach((mealType) => {
          const mealSelections =
            newSelections[selectedKid][selectedDay][mealType];

          // If the food exists in other meal categories
          if (
            mealType !== selectedMeal &&
            mealSelections[category]?.id === food.id
          ) {
            // Remove the food if it's not compatible with this meal type
            // or it wasn't the meal where it was originally selected
            if (!food.meal.includes(mealType)) {
              mealSelections[category] = null;
            }
          }
        });

        return newSelections;
      });
    },
    [selectedKid, selectedDay, selectedMeal]
  );

  // Rest of the code remains the same...
  const handleServingAdjustment = useCallback(
    (category: CategoryType, adjustedFood: SelectedFood) => {
      if (!selectedMeal || !selectedDay || !selectedKid) return;

      const newSelections = structuredClone(selections);
      const currentMeal = newSelections[selectedKid][selectedDay][selectedMeal];

      if (category === "condiments") {
        const condimentIndex = currentMeal.condiments?.findIndex(
          (c) => c.foodId === adjustedFood.id
        );

        if (condimentIndex >= 0 && currentMeal.condiments) {
          currentMeal.condiments[condimentIndex] = {
            foodId: adjustedFood.id,
            servings: adjustedFood.servings,
            adjustedCalories: adjustedFood.calories * adjustedFood.servings,
            adjustedProtein: adjustedFood.protein * adjustedFood.servings,
            adjustedCarbs: adjustedFood.carbs * adjustedFood.servings,
            adjustedFat: adjustedFood.fat * adjustedFood.servings,
          };
        }
      } else {
        currentMeal[category] = adjustedFood;
      }

      setSelections(newSelections);
    },
    [selectedKid, selectedDay, selectedMeal, selections]
  );

  const handleMilkToggle = useCallback(
    (mealType: string, value: boolean) => {
      if (!selectedKid || !selectedDay) return;

      const newSelections = structuredClone(selections);
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

      setSelections(newSelections);
    },
    [selectedKid, selectedDay, selections]
  );

  const calculateMealNutrition = useCallback(
    (meal: MealType) => {
      if (!selectedKid || !selectedDay) {
        return { calories: 0, protein: 0, carbs: 0, fat: 0 };
      }

      const mealSelections = selections[selectedKid]?.[selectedDay]?.[meal];

      if (!mealSelections) {
        return { calories: 0, protein: 0, carbs: 0, fat: 0 };
      }

      const baseNutrition = Object.entries(mealSelections)
        .filter(
          ([category]) => category !== "condiments" && category !== "milk"
        )
        .reduce(
          (sum, [, food]) => ({
            calories: sum.calories + (food?.adjustedCalories || 0),
            protein: sum.protein + (food?.adjustedProtein || 0),
            carbs: sum.carbs + (food?.adjustedCarbs || 0),
            fat: sum.fat + (food?.adjustedFat || 0),
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );

      const condimentNutrition = mealSelections.condiments?.reduce(
        (sum, condiment) => ({
          calories: sum.calories + (condiment?.adjustedCalories || 0),
          protein: sum.protein + (condiment?.adjustedProtein || 0),
          carbs: sum.carbs + (condiment?.adjustedCarbs || 0),
          fat: sum.fat + (condiment?.adjustedFat || 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      ) || { calories: 0, protein: 0, carbs: 0, fat: 0 };

      return {
        calories: baseNutrition.calories + condimentNutrition.calories,
        protein: baseNutrition.protein + condimentNutrition.protein,
        carbs: baseNutrition.carbs + condimentNutrition.carbs,
        fat: baseNutrition.fat + condimentNutrition.fat,
      };
    },
    [selections, selectedKid, selectedDay]
  );

  const calculateDailyTotals = useCallback(() => {
    if (!selectedKid || !selectedDay) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }

    return MEAL_TYPES.reduce(
      (dailyTotals, mealType) => {
        const mealNutrition = calculateMealNutrition(mealType);
        return {
          calories: dailyTotals.calories + mealNutrition.calories,
          protein: dailyTotals.protein + mealNutrition.protein,
          carbs: dailyTotals.carbs + mealNutrition.carbs,
          fat: dailyTotals.fat + mealNutrition.fat,
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [selectedKid, selectedDay, calculateMealNutrition]);

  // Helper function to check if a meal has any selections
  const hasMealSelections = useCallback((meal: MealSelection) => {
    // Check main food categories
    const hasMainFoodSelected = Object.entries(meal)
      .filter(([category]) => category !== "condiments")
      .some(([, food]) => food !== null);

    // Check condiments
    const hasCondiments = meal.condiments && meal.condiments.length > 0;

    return hasMainFoodSelected || hasCondiments;
  }, []);

  // Effect to handle saving meal history
  useEffect(() => {
    const updateMealHistory = async () => {
      if (!selectedKid || !selectedDay || !selectedMeal) return;

      // Get the current meal selections
      const currentSelections =
        selections[selectedKid]?.[selectedDay]?.[selectedMeal];
      if (!currentSelections) return;

      // Only save if the meal has actual selections
      if (!hasMealSelections(currentSelections)) return;

      try {
        const mealData = {
          meal: selectedMeal,
          date: new Date(),
          selections: currentSelections,
        };

        const response = await fetch("/api/meal-history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kidId: selectedKid, mealData }),
        });

        if (!response.ok) {
          throw new Error("Failed to save meal history");
        }

        // Fetch updated history
        const historyResponse = await fetch(
          `/api/meal-history?kidId=${selectedKid}`
        );
        if (!historyResponse.ok) {
          throw new Error("Failed to fetch meal history");
        }

        const history = await historyResponse.json();
        setMealHistory((prev) => ({
          ...prev,
          [selectedKid]: history,
        }));
      } catch (error) {
        console.error("Error updating meal history:", error);
      }
    };

    // Skip effect if required values aren't present
    if (!selectedKid || !selectedDay || !selectedMeal) return;

    // Debounce the update to prevent too many requests
    const timeoutId = setTimeout(updateMealHistory, 500);
    return () => clearTimeout(timeoutId);
  }, [selectedKid, selectedDay, selectedMeal, selections, hasMealSelections]);

  return {
    selectedKid,
    selectedDay,
    selectedMeal,
    selections,
    mealHistory,
    setSelectedKid,
    setSelections,
    setSelectedDay,
    setSelectedMeal,
    handleFoodSelect,
    handleServingAdjustment,
    handleMilkToggle,
    calculateMealNutrition,
    calculateDailyTotals,
  };
};
