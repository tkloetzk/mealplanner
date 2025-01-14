import { renderHook, act } from "@testing-library/react";
import { useMealPlanState } from "../useMealPlanState";
import { Kid } from "@/types/user";
import { Food, CategoryType, MealType } from "@/types/food";

// Sample data for testing
const mockKids: Kid[] = [
  { id: "kid1", name: "Child One" },
  { id: "kid2", name: "Child Two" },
];

const mockFood: Food = {
  name: "Apple",
  category: "fruits",
  calories: 95,
  protein: 0.5,
  carbs: 25,
  fat: 0.3,
  meal: ["breakfast", "lunch", "dinner"],
  servingSize: "1",
  servingSizeUnit: "piece",
};

describe("useMealPlanState Hook", () => {
  it("throws an error if no kids are provided", () => {
    const testHook = () => {
      renderHook(() => useMealPlanState([]));
    };

    expect(testHook).toThrow(
      "At least one kid is required to use meal plan state"
    );
  });

  it("initializes with first kid selected", () => {
    const { result } = renderHook(() => useMealPlanState(mockKids));

    expect(result.current.selectedKid).toBe(mockKids[0].id);
    expect(result.current.selectedDay).toBeDefined();
    expect(result.current.selectedMeal).toBe("breakfast");
  });

  it("handles food selection", () => {
    const { result } = renderHook(() => useMealPlanState(mockKids));

    // Set a specific day and meal first
    act(() => {
      result.current.setSelectedDay("monday");
      result.current.setSelectedMeal("breakfast");
    });

    // Perform food selection
    act(() => {
      result.current.handleFoodSelect("fruits", mockFood);
    });

    // Verify the selection
    const selectedFood =
      result.current.selections["kid1"]["monday"]["breakfast"]["fruits"];

    expect(selectedFood).toEqual({
      ...mockFood,
      servings: 1,
      adjustedCalories: mockFood.calories,
      adjustedProtein: mockFood.protein,
      adjustedCarbs: mockFood.carbs,
      adjustedFat: mockFood.fat,
    });
  });

  it("toggles food selection", () => {
    const { result } = renderHook(() => useMealPlanState(mockKids));

    // First selection
    act(() => {
      result.current.handleFoodSelect("fruits" as CategoryType, mockFood);
    });

    // Second selection (should remove the food)
    act(() => {
      result.current.handleFoodSelect("fruits" as CategoryType, mockFood);
    });

    const selectedFood =
      result.current.selections["kid1"]["sunday"]["breakfast"]["fruits"];
    expect(selectedFood).toBeNull();
  });

  // In useMealPlanState.test.ts

  it("calculates meal nutrition correctly", () => {
    const { result } = renderHook(() => useMealPlanState(mockKids));

    act(() => {
      result.current.setSelectedDay("monday");
      result.current.setSelectedMeal("breakfast");
      result.current.handleFoodSelect("fruits", mockFood);
    });

    const mealNutrition = result.current.calculateMealNutrition("breakfast");
    console.log("Selections after setting food:", result.current.selections);
    console.log("Calculated nutrition:", mealNutrition);

    expect(mealNutrition).toEqual({
      calories: 95,
      protein: 0.5,
      carbs: 25,
      fat: 0.3,
    });
  });

  // In useMealPlanState.test.ts

  it("handles serving adjustment", () => {
    const { result } = renderHook(() => useMealPlanState(mockKids));

    // First, add food
    act(() => {
      result.current.handleFoodSelect("fruits", mockFood);
    });

    // Then adjust serving
    act(() => {
      result.current.handleServingAdjustment("fruits", {
        ...mockFood,
        servings: 2,
        adjustedCalories: mockFood.calories * 2,
        adjustedProtein: mockFood.protein * 2,
        adjustedCarbs: mockFood.carbs * 2,
        adjustedFat: mockFood.fat * 2,
      });
    });

    const mealNutrition = result.current.calculateMealNutrition(
      "breakfast" as MealType
    );

    // The test is expecting doubled values because we set servings to 2
    expect(mealNutrition).toEqual({
      calories: 190,
      protein: 1,
      carbs: 50,
      fat: 0.6,
    });
  });

  it("adds to meal history", () => {
    const { result } = renderHook(() => useMealPlanState(mockKids));

    act(() => {
      result.current.addToMealHistory(mockFood);
    });

    expect(result.current.mealHistory["kid1"].length).toBe(1);
    expect(result.current.mealHistory["kid1"][0].selections.fruits).toEqual({
      ...mockFood,
      servings: 1,
      adjustedCalories: mockFood.calories,
      adjustedProtein: mockFood.protein,
      adjustedCarbs: mockFood.carbs,
      adjustedFat: mockFood.fat,
    });
  });
});
