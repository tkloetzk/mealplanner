import {
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import { MealPlanner } from "../MealPlanner";
import { useMealPlanState } from "@/hooks/useMealPlanState";
import { DEFAULT_MEAL_PLAN } from "@/constants/meal-goals";
import { CategoryType, Food } from "@/types/food";
import { act } from "react";
import {
  BREAKFAST,
  FRUITS,
  MOCK_FOODS,
  MOCK_KIDS,
  SELECTED_DAY,
} from "@/constants/tests/testConstants";
// Create a proper mock return value for the hook

// Mock the useMealPlanState hook
jest.mock("@/hooks/useMealPlanState", () => ({
  useMealPlanState: jest.fn(),
}));

jest.mock("@/components/NutritionSummary");
jest.mock("@/components/CompactNutritionProgress");

// Mock food data
const mockFoodData: Record<CategoryType, Food[]> = {
  grains: [],
  fruits: [],
  proteins: [],
  vegetables: [],
  milk: [],
};

describe("MealPlanner - Basic Render", () => {
  const mockHookReturn = () => ({
    selectedKid: MOCK_KIDS[0].id,
    selectedDay: SELECTED_DAY,
    selectedMeal: BREAKFAST,
    selections: {
      [MOCK_KIDS[0].id]: DEFAULT_MEAL_PLAN,
    },
    mealHistory: { [MOCK_KIDS[0].id]: [] },
    setSelectedKid: jest.fn(),
    setSelectedDay: jest.fn(),
    setSelectedMeal: jest.fn(),
    handleFoodSelect: (category: CategoryType, food: Food) => {
      const newSelections = JSON.parse(
        JSON.stringify(mockHookReturn().selections)
      );
      if (!mockHookReturn().selectedMeal || !mockHookReturn().selectedDay)
        return;

      newSelections[mockHookReturn().selectedKid][mockHookReturn().selectedDay][
        mockHookReturn().selectedMeal
      ][category] = {
        ...food,
        servings: 1,
        adjustedCalories: food.calories,
        adjustedProtein: food.protein,
        adjustedCarbs: food.carbs,
        adjustedFat: food.fat,
      };

      mockHookReturn().setSelections(newSelections);
    },
    calculateMealNutrition: () => ({
      calories: MOCK_FOODS.fruits[0].calories,
      protein: MOCK_FOODS.fruits[0].protein,
      carbs: MOCK_FOODS.fruits[0].carbs,
      fat: MOCK_FOODS.fruits[0].fat,
    }),
    calculateDailyTotals: () => ({
      calories: MOCK_FOODS.fruits[0].calories,
      protein: MOCK_FOODS.fruits[0].protein,
      carbs: MOCK_FOODS.fruits[0].carbs,
      fat: MOCK_FOODS.fruits[0].fat,
    }),
  });

  // Mock console.error
  const originalConsoleError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Initialize the hook mock before each test
    (useMealPlanState as jest.Mock).mockReturnValue(mockHookReturn());

    // Setup fetch mock
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            ...mockFoodData,
            fruits: [MOCK_FOODS.fruits[0]], // Ensure we have the test food
          }),
      })
    ) as jest.Mock;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("renders without crashing and loads food data", async () => {
    await act(async () => {
      render(<MealPlanner />);
    });

    await waitFor(() => {
      expect(screen.getByText("Meal Planner")).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("shows loading state before food data loads", async () => {
    // Create a controlled Promise for fetch
    let resolveFetchPromise: (value: any) => void;
    const fetchPromise = new Promise((resolve) => {
      resolveFetchPromise = resolve;
    });

    // Override fetch mock for this test
    global.fetch = jest.fn(() => fetchPromise) as jest.Mock;

    await act(async () => {
      render(<MealPlanner />);
    });

    // Check loading state
    expect(screen.getByRole("status")).toBeInTheDocument();

    // Resolve the fetch
    await act(async () => {
      resolveFetchPromise!({
        ok: true,
        json: () => Promise.resolve(mockFoodData),
      });
    });

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });
  });
  it("selects a food item on first click", async () => {
    // Render the component
    await act(async () => {
      render(<MealPlanner />);
    });

    // Wait for food data to load
    await waitFor(() => {
      expect(screen.getByText(MOCK_FOODS.fruits[0].name)).toBeInTheDocument();
    });

    // Find and click the food item
    const foodItem = screen.getByText(MOCK_FOODS.fruits[0].name);
    await act(async () => {
      fireEvent.click(foodItem);
    });

    // Verify the food item is selected
    // Look for elements that indicate selection
    await waitFor(() => {
      // Check for nutritional information being displayed
      expect(
        screen.getByText(`${MOCK_FOODS.fruits[0].calories} cal`)
      ).toBeInTheDocument();

      // Check for visual selection indicator (the selected food should have a specific style)
      const selectedContainer = foodItem.closest("button");
      expect(selectedContainer).toHaveClass("bg-blue-100");

      // Check for serving size information
      expect(screen.getByText("1 serving(s)")).toBeInTheDocument();
    });
  });
  it("handles fetch error gracefully", async () => {
    const mockError = new Error("Failed to fetch");
    global.fetch = jest.fn(() => Promise.reject(mockError)) as jest.Mock;

    await act(async () => {
      render(<MealPlanner />);
    });

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        "Error loading data:",
        mockError
      );
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });
  });
});
