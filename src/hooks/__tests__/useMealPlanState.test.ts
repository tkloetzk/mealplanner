import { renderHook, act } from "@testing-library/react";
import { useMealPlanState } from "../useMealPlanState";
import { Kid } from "@/types/user";
import { Food, CategoryType, MealType } from "@/types/food";
import { MILK_OPTION, RANCH_OPTION } from "@/constants/meal-goals";

// Mock localStorage to prevent state persistence between tests
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
  };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

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
  beforeEach(() => {
    // Sunday (index 0) is the default in your current implementation
    jest.spyOn(Date.prototype, "getDay").mockReturnValue(0);
    localStorageMock.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it("throws an error if no kids are provided", () => {
    const testHook = () => {
      renderHook(() => useMealPlanState([]));
    };

    expect(testHook).toThrow(
      "At least one kid is required to use meal plan state"
    );
  });

  it("initializes with first kid and Sunday as selected day", () => {
    const { result } = renderHook(() => useMealPlanState(mockKids));

    expect(result.current.selectedKid).toBe(mockKids[0].id);
    expect(result.current.selectedDay).toBe("sunday");
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
      result.current.setSelectedDay("sunday");
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

  it("handles milk toggle correctly with nutrition update", () => {
    const { result } = renderHook(() => useMealPlanState(mockKids));

    act(() => {
      result.current.handleMilkToggle("breakfast", true);
    });

    const mealPlan = result.current.selections[mockKids[0].id];
    const breakfastSelections = mealPlan["sunday"]["breakfast"];
    const milkSelection = breakfastSelections["milk"];

    expect(milkSelection).toBeDefined();
    expect(milkSelection).not.toBeNull();
    expect(milkSelection).toEqual(
      expect.objectContaining({
        ...MILK_OPTION,
        category: "milk",
        servings: 1,
        adjustedCalories: MILK_OPTION.calories,
        adjustedProtein: MILK_OPTION.protein,
        adjustedCarbs: MILK_OPTION.carbs,
        adjustedFat: MILK_OPTION.fat,
      })
    );

    const mealNutrition = result.current.calculateMealNutrition("breakfast");
    expect(mealNutrition).toEqual({
      calories: MILK_OPTION.calories,
      protein: MILK_OPTION.protein,
      carbs: MILK_OPTION.carbs,
      fat: MILK_OPTION.fat,
    });
  });

  it("handles ranch toggle correctly with nutrition update", () => {
    const { result } = renderHook(() => useMealPlanState(mockKids));

    act(() => {
      result.current.handleRanchToggle("lunch", true, 2);
    });

    const ranchSelection =
      result.current.selections["kid1"]["sunday"]["lunch"]["ranch"];
    const mealNutrition = result.current.calculateMealNutrition("lunch");

    expect(ranchSelection).toEqual({
      ...RANCH_OPTION,
      category: "vegetables",
      servings: 2,
      adjustedCalories: RANCH_OPTION.calories * 2,
      adjustedProtein: RANCH_OPTION.protein * 2,
      adjustedCarbs: RANCH_OPTION.carbs * 2,
      adjustedFat: RANCH_OPTION.fat * 2,
    });

    expect(mealNutrition).toEqual({
      calories: RANCH_OPTION.calories * 2,
      protein: RANCH_OPTION.protein * 2,
      carbs: RANCH_OPTION.carbs * 2,
      fat: RANCH_OPTION.fat * 2,
    });
  });

  it("handles daily nutrition calculation with multiple foods", () => {
    const { result } = renderHook(() => useMealPlanState(mockKids));

    const anotherFood: Food = {
      name: "Chicken Breast",
      category: "proteins",
      calories: 165,
      protein: 31,
      carbs: 0,
      fat: 3.6,
      meal: ["breakfast", "lunch", "dinner"],
      servingSize: "1",
      servingSizeUnit: "piece",
    };

    act(() => {
      result.current.handleFoodSelect("fruits", mockFood);
      result.current.handleFoodSelect("proteins", anotherFood);
      result.current.handleMilkToggle("breakfast", true);
      result.current.handleRanchToggle("breakfast", true, 1);
    });

    const dailyNutrition = result.current.calculateDailyTotals();

    expect(dailyNutrition).toEqual({
      calories:
        mockFood.calories +
        anotherFood.calories +
        MILK_OPTION.calories +
        RANCH_OPTION.calories,
      protein:
        mockFood.protein +
        anotherFood.protein +
        MILK_OPTION.protein +
        RANCH_OPTION.protein,
      carbs:
        mockFood.carbs +
        anotherFood.carbs +
        MILK_OPTION.carbs +
        RANCH_OPTION.carbs,
      fat: mockFood.fat + anotherFood.fat + MILK_OPTION.fat + RANCH_OPTION.fat,
    });
  });

  it("removes milk when toggled off", () => {
    const { result } = renderHook(() => useMealPlanState(mockKids));

    act(() => {
      result.current.handleMilkToggle("breakfast", true);
      result.current.handleMilkToggle("breakfast", false);
    });

    const milkSelection =
      result.current.selections["kid1"]["sunday"]["breakfast"]["milk"];

    expect(milkSelection).toBeNull();
  });

  it("removes ranch when toggled off", () => {
    const { result } = renderHook(() => useMealPlanState(mockKids));

    act(() => {
      result.current.handleRanchToggle("lunch", true, 2);
      result.current.handleRanchToggle("lunch", false, 0);
    });

    const ranchSelection =
      result.current.selections["kid1"]["sunday"]["lunch"]["ranch"];

    expect(ranchSelection).toBeNull();
  });

  it("handles different kid selections", () => {
    const { result } = renderHook(() => useMealPlanState(mockKids));

    act(() => {
      // Select first kid and add a food
      result.current.handleFoodSelect("fruits", mockFood);

      // Change to second kid
      result.current.setSelectedKid("kid2");
    });

    // Check that first kid's selection remains
    expect(
      result.current.selections["kid1"]["sunday"]["breakfast"]["fruits"]
    ).toEqual({
      ...mockFood,
      servings: 1,
      adjustedCalories: mockFood.calories,
      adjustedProtein: mockFood.protein,
      adjustedCarbs: mockFood.carbs,
      adjustedFat: mockFood.fat,
    });

    // Verify second kid's initial state
    expect(
      result.current.selections["kid2"]["sunday"]["breakfast"]["fruits"]
    ).toBeNull();
  });
  it("ensures food is selected on first click when no food is currently selected", () => {
    const { result } = renderHook(() => useMealPlanState(mockKids));

    // Explicitly set the context for the selection
    act(() => {
      result.current.setSelectedDay("sunday");
      result.current.setSelectedMeal("breakfast");
    });

    // Perform first selection
    act(() => {
      result.current.handleFoodSelect("fruits", mockFood);
    });

    // Retrieve the selected food
    const selectedFood =
      result.current.selections["kid1"]["sunday"]["breakfast"]["fruits"];

    // Assertions to verify the selection
    expect(selectedFood).toBeDefined(); // Ensure something is selected
    expect(selectedFood).not.toBeNull(); // Ensure it's not null
    expect(selectedFood?.name).toBe(mockFood.name); // Verify correct food is selected

    // Deep comparison of the selected food structure
    expect(selectedFood).toEqual(
      expect.objectContaining({
        ...mockFood,
        servings: 1,
        adjustedCalories: mockFood.calories,
        adjustedProtein: mockFood.protein,
        adjustedCarbs: mockFood.carbs,
        adjustedFat: mockFood.fat,
      })
    );
  });
});
