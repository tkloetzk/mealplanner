import { renderHook, act } from "@testing-library/react";
import { useMealPlanState } from "../useMealPlanState";
import {
  MOCK_KIDS,
  MOCK_FOODS,
  SELECTED_DAY,
  BREAKFAST,
  PROTEINS,
  FRUITS,
  VEGETABLES,
} from "@/constants/tests/testConstants";
import { defaultObj, MILK_OPTION, RANCH_OPTION } from "@/constants/meal-goals";

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

beforeEach(() => {
  // Sunday (index 0) is the default in your current implementation
  jest.spyOn(Date.prototype, "getDay").mockReturnValue(0);
  localStorageMock.clear();
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

describe("useMealPlanState Hook", () => {
  it("throws an error if no kids are provided", () => {
    const testHook = () => {
      renderHook(() => useMealPlanState([]));
    };

    expect(testHook).toThrow(
      "At least one kid is required to use meal plan state"
    );
  });

  it("initializes with first kid and Sunday as selected day", () => {
    const { result } = renderHook(() => useMealPlanState(MOCK_KIDS));

    expect(result.current.selectedKid).toBe(MOCK_KIDS[0].id);
    expect(result.current.selectedDay).toBe(SELECTED_DAY);
    expect(result.current.selectedMeal).toBe(BREAKFAST);
  });

  it("handles food selection", () => {
    const { result } = renderHook(() => useMealPlanState(MOCK_KIDS));

    // Set a specific day and meal first
    act(() => {
      result.current.setSelectedDay(SELECTED_DAY);
      result.current.setSelectedMeal(BREAKFAST);
    });

    // Perform food selection
    act(() => {
      result.current.handleFoodSelect(FRUITS, MOCK_FOODS.fruits[0]);
    });

    // Verify the selection
    const selectedFood =
      result.current.selections[MOCK_KIDS[0].id][SELECTED_DAY][BREAKFAST][
        FRUITS
      ];

    expect(selectedFood).toEqual({
      ...MOCK_FOODS.fruits[0],
      servings: 1,
      adjustedCalories: MOCK_FOODS.fruits[0].calories,
      adjustedProtein: MOCK_FOODS.fruits[0].protein,
      adjustedCarbs: MOCK_FOODS.fruits[0].carbs,
      adjustedFat: MOCK_FOODS.fruits[0].fat,
    });
  });

  it("toggles food selection", () => {
    const { result } = renderHook(() => useMealPlanState(MOCK_KIDS));

    // First selection
    act(() => {
      result.current.handleFoodSelect(FRUITS, MOCK_FOODS.fruits[0]);
    });

    // Second selection (should remove the food)
    act(() => {
      result.current.handleFoodSelect(FRUITS, MOCK_FOODS.fruits[0]);
    });

    const selectedFood =
      result.current.selections[MOCK_KIDS[0].id][SELECTED_DAY][BREAKFAST][
        FRUITS
      ];
    expect(selectedFood).toBeNull();
  });

  // In useMealPlanState.test.ts

  it("calculates meal nutrition correctly", () => {
    const { result } = renderHook(() => useMealPlanState(MOCK_KIDS));

    act(() => {
      result.current.setSelectedDay(SELECTED_DAY);
      result.current.setSelectedMeal(BREAKFAST);
      result.current.handleFoodSelect(FRUITS, MOCK_FOODS.fruits[0]);
    });

    const mealNutrition = result.current.calculateMealNutrition(BREAKFAST);
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
    const { result } = renderHook(() => useMealPlanState(MOCK_KIDS));

    // First, add food
    act(() => {
      result.current.handleFoodSelect(FRUITS, MOCK_FOODS.fruits[0]);
    });

    // Then adjust serving
    act(() => {
      result.current.handleServingAdjustment(FRUITS, {
        ...MOCK_FOODS.fruits[0],
        servings: 2,
        adjustedCalories: MOCK_FOODS.fruits[0].calories * 2,
        adjustedProtein: MOCK_FOODS.fruits[0].protein * 2,
        adjustedCarbs: MOCK_FOODS.fruits[0].carbs * 2,
        adjustedFat: MOCK_FOODS.fruits[0].fat * 2,
      });
    });

    const mealNutrition = result.current.calculateMealNutrition(BREAKFAST);

    // The test is expecting doubled values because we set servings to 2
    expect(mealNutrition).toEqual({
      calories: 190,
      protein: 1,
      carbs: 50,
      fat: 0.6,
    });
  });

  it("adds to meal history", () => {
    const { result } = renderHook(() => useMealPlanState(MOCK_KIDS));

    act(() => {
      result.current.addToMealHistory(MOCK_FOODS.fruits[0]);
    });

    expect(result.current.mealHistory[MOCK_KIDS[0].id].length).toBe(1);
    expect(
      result.current.mealHistory[MOCK_KIDS[0].id][0].selections.fruits
    ).toEqual({
      ...MOCK_FOODS.fruits[0],
      servings: 1,
      adjustedCalories: MOCK_FOODS.fruits[0].calories,
      adjustedProtein: MOCK_FOODS.fruits[0].protein,
      adjustedCarbs: MOCK_FOODS.fruits[0].carbs,
      adjustedFat: MOCK_FOODS.fruits[0].fat,
    });
  });

  it("handles milk toggle correctly with nutrition update", () => {
    const { result } = renderHook(() => useMealPlanState(MOCK_KIDS));

    act(() => {
      result.current.handleMilkToggle(BREAKFAST, true);
    });

    const mealPlan = result.current.selections[MOCK_KIDS[0].id];
    const breakfastSelections = mealPlan[SELECTED_DAY][BREAKFAST];
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

    const mealNutrition = result.current.calculateMealNutrition(BREAKFAST);
    expect(mealNutrition).toEqual({
      calories: MILK_OPTION.calories,
      protein: MILK_OPTION.protein,
      carbs: MILK_OPTION.carbs,
      fat: MILK_OPTION.fat,
    });
  });

  it("handles ranch toggle correctly with nutrition update", () => {
    const { result } = renderHook(() => useMealPlanState(MOCK_KIDS));

    act(() => {
      result.current.handleRanchToggle("lunch", true, 2);
    });

    const ranchSelection =
      result.current.selections[MOCK_KIDS[0].id][SELECTED_DAY]["lunch"][
        "ranch"
      ];
    const mealNutrition = result.current.calculateMealNutrition("lunch");

    expect(ranchSelection).toEqual({
      ...RANCH_OPTION,
      category: VEGETABLES,
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
    const { result } = renderHook(() => useMealPlanState(MOCK_KIDS));

    act(() => {
      result.current.handleFoodSelect(FRUITS, MOCK_FOODS.fruits[0]);
      result.current.handleFoodSelect(PROTEINS, MOCK_FOODS.proteins[0]);
      result.current.handleMilkToggle(BREAKFAST, true);
      result.current.handleRanchToggle(BREAKFAST, true, 1);
    });

    const dailyNutrition = result.current.calculateDailyTotals();

    expect(dailyNutrition).toEqual({
      calories:
        MOCK_FOODS.fruits[0].calories +
        MOCK_FOODS.proteins[0].calories +
        MILK_OPTION.calories +
        RANCH_OPTION.calories,
      protein:
        MOCK_FOODS.fruits[0].protein +
        MOCK_FOODS.proteins[0].protein +
        MILK_OPTION.protein +
        RANCH_OPTION.protein,
      carbs:
        MOCK_FOODS.fruits[0].carbs +
        MOCK_FOODS.proteins[0].carbs +
        MILK_OPTION.carbs +
        RANCH_OPTION.carbs,
      fat:
        MOCK_FOODS.fruits[0].fat +
        MOCK_FOODS.proteins[0].fat +
        MILK_OPTION.fat +
        RANCH_OPTION.fat,
    });
  });

  it("removes milk when toggled off", () => {
    const { result } = renderHook(() => useMealPlanState(MOCK_KIDS));

    act(() => {
      result.current.handleMilkToggle(BREAKFAST, true);
      result.current.handleMilkToggle(BREAKFAST, false);
    });

    const milkSelection =
      result.current.selections[MOCK_KIDS[0].id][SELECTED_DAY][BREAKFAST][
        "milk"
      ];

    expect(milkSelection).toBeNull();
  });

  it("removes ranch when toggled off", () => {
    const { result } = renderHook(() => useMealPlanState(MOCK_KIDS));

    act(() => {
      result.current.handleRanchToggle("lunch", true, 2);
      result.current.handleRanchToggle("lunch", false, 0);
    });

    const ranchSelection =
      result.current.selections[MOCK_KIDS[0].id][SELECTED_DAY]["lunch"][
        "ranch"
      ];

    expect(ranchSelection).toBeNull();
  });

  it("handles different kid selections", () => {
    const { result } = renderHook(() => useMealPlanState(MOCK_KIDS));

    act(() => {
      // Select first kid and add a food
      result.current.handleFoodSelect(FRUITS, MOCK_FOODS.fruits[0]);

      // Change to second kid
      result.current.setSelectedKid("kid2");
    });

    // Check that first kid's selection remains
    expect(
      result.current.selections[MOCK_KIDS[0].id][SELECTED_DAY][BREAKFAST][
        FRUITS
      ]
    ).toEqual({
      ...MOCK_FOODS.fruits[0],
      servings: 1,
      adjustedCalories: MOCK_FOODS.fruits[0].calories,
      adjustedProtein: MOCK_FOODS.fruits[0].protein,
      adjustedCarbs: MOCK_FOODS.fruits[0].carbs,
      adjustedFat: MOCK_FOODS.fruits[0].fat,
    });

    // Verify second kid's initial state
    expect(
      result.current.selections[MOCK_KIDS[1].id][SELECTED_DAY][BREAKFAST][
        FRUITS
      ]
    ).toBeNull();
  });
  it("ensures food is selected on first click when no food is currently selected", () => {
    const { result } = renderHook(() => useMealPlanState(MOCK_KIDS));

    // Explicitly set the context for the selection
    act(() => {
      result.current.setSelectedDay(SELECTED_DAY);
      result.current.setSelectedMeal(BREAKFAST);
    });

    // Perform first selection
    act(() => {
      result.current.handleFoodSelect(FRUITS, MOCK_FOODS.fruits[0]);
    });

    // Retrieve the selected food
    const selectedFood =
      result.current.selections[MOCK_KIDS[0].id][SELECTED_DAY][BREAKFAST][
        FRUITS
      ];

    // Assertions to verify the selection
    expect(selectedFood).toBeDefined(); // Ensure something is selected
    expect(selectedFood).not.toBeNull(); // Ensure it's not null
    expect(selectedFood?.name).toBe(MOCK_FOODS.fruits[0].name); // Verify correct food is selected

    // Deep comparison of the selected food structure
    expect(selectedFood).toEqual(
      expect.objectContaining({
        ...MOCK_FOODS.fruits[0],
        servings: 1,
        adjustedCalories: MOCK_FOODS.fruits[0].calories,
        adjustedProtein: MOCK_FOODS.fruits[0].protein,
        adjustedCarbs: MOCK_FOODS.fruits[0].carbs,
        adjustedFat: MOCK_FOODS.fruits[0].fat,
      })
    );
  });
});
describe("Advanced useMealPlanState Scenarios", () => {
  it("handles complex meal selection with multiple interactions", () => {
    const { result } = renderHook(() => useMealPlanState(MOCK_KIDS));

    // Simulate a complex scenario
    act(() => {
      // Select multiple foods across different categories
      result.current.handleFoodSelect(PROTEINS, MOCK_FOODS.proteins[0]);
      result.current.handleFoodSelect(FRUITS, MOCK_FOODS.fruits[0]);
      result.current.handleFoodSelect(VEGETABLES, MOCK_FOODS.vegetables[0]);

      // Toggle milk and ranch
      result.current.handleMilkToggle(BREAKFAST, true);
      result.current.handleRanchToggle(BREAKFAST, true, 2);
    });

    // Verify comprehensive state
    const breakfastSelections =
      result.current.selections[MOCK_KIDS[0].id][SELECTED_DAY][BREAKFAST];

    expect(breakfastSelections.proteins).not.toBeNull();
    expect(breakfastSelections.fruits).not.toBeNull();
    expect(breakfastSelections.vegetables).not.toBeNull();
    expect(breakfastSelections.milk).not.toBeNull();
    expect(breakfastSelections.ranch).not.toBeNull();
  });

  it.skip("prevents duplicate food entries in meal history", () => {
    const { result } = renderHook(() => useMealPlanState(MOCK_KIDS));

    act(() => {
      // Add same food multiple times
      result.current.addToMealHistory(MOCK_FOODS.fruits[0]);
      result.current.addToMealHistory(MOCK_FOODS.proteins[0]);
      result.current.addToMealHistory(MOCK_FOODS.vegetables[0]);
    });

    // Should only have one entry
    expect(result.current.mealHistory[MOCK_KIDS[0].id].length).toBe(1);
  });

  it("handles meal plan reset or clear scenarios", () => {
    const { result } = renderHook(() => useMealPlanState(MOCK_KIDS));

    act(() => {
      // Populate some selections
      result.current.handleFoodSelect(PROTEINS, MOCK_FOODS.proteins[0]);
      result.current.handleMilkToggle(BREAKFAST, true);
    });

    // Simulate a reset or clear action
    act(() => {
      const newSelections = { ...result.current.selections };
      newSelections[MOCK_KIDS[0].id][SELECTED_DAY][BREAKFAST] = defaultObj;
      result.current.setSelections(newSelections);
    });

    const breakfastSelections =
      result.current.selections[MOCK_KIDS[0].id][SELECTED_DAY][BREAKFAST];

    expect(breakfastSelections).toEqual(defaultObj);
  });

  it("calculates nutrition across different servings and foods", () => {
    const { result } = renderHook(() => useMealPlanState(MOCK_KIDS));

    const multiServingFood = {
      ...MOCK_FOODS.proteins[0],
      calories: 100,
      protein: 10,
      carbs: 5,
      fat: 2,
    };

    act(() => {
      // Add foods with different serving sizes
      result.current.handleFoodSelect(PROTEINS, multiServingFood);
      result.current.handleServingAdjustment(PROTEINS, {
        ...multiServingFood,
        servings: 3,
        adjustedCalories: multiServingFood.calories * 3,
        adjustedProtein: multiServingFood.protein * 3,
        adjustedCarbs: multiServingFood.carbs * 3,
        adjustedFat: multiServingFood.fat * 3,
      });
    });

    const nutrition = result.current.calculateMealNutrition(BREAKFAST);

    expect(nutrition).toEqual({
      calories: multiServingFood.calories * 3,
      protein: multiServingFood.protein * 3,
      carbs: multiServingFood.carbs * 3,
      fat: multiServingFood.fat * 3,
    });
  });
});
