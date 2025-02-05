// src/components/features/nutrition/NutritionSummary/__tests__/NutritionSummary.test.tsx
import { render, screen, fireEvent, within } from "@testing-library/react";
import { NutritionSummary } from "../NutritionSummary";
import { DAILY_GOALS } from "@/constants/meal-goals";
import { MealType, DayType } from "@/types/meals";
import { useMealStore } from "@/store/useMealStore";

const createMockStore = (overrides = {}) => ({
  // State
  selections: {},
  selectedKid: "1",
  selectedDay: "monday" as DayType,
  selectedMeal: "breakfast" as MealType,
  mealHistory: {},

  // Selection actions
  setSelectedKid: jest.fn(),
  setSelectedDay: jest.fn(),
  setSelectedMeal: jest.fn(),

  // Meal management actions
  initializeKids: jest.fn(),
  handleFoodSelect: jest.fn(),
  handleServingAdjustment: jest.fn(),
  handleMilkToggle: jest.fn(),

  // Utility functions
  getCurrentMealSelection: jest.fn(),
  resetMeal: jest.fn(),
  calculateMealNutrition: jest.fn().mockReturnValue({
    calories: 200,
    protein: 25,
    carbs: 0,
    fat: 12,
  }),
  calculateDailyTotals: jest.fn().mockReturnValue({
    calories: 600,
    protein: 75,
    carbs: 0,
    fat: 36,
  }),
  ...overrides,
});

// Mock the useMealStore hook
jest.mock("@/store/useMealStore", () => ({
  useMealStore: jest.fn((selector) => selector(createMockStore())),
}));

describe("NutritionSummary", () => {
  const defaultProps = {
    selectedMeal: "breakfast" as MealType,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("displays basic nutrition information correctly", async () => {
    const mockStore = createMockStore();
    jest
      .mocked(useMealStore)
      .mockImplementation((selector) => selector(mockStore));

    const { debug } = render(<NutritionSummary {...defaultProps} />);

    // Debug output to see what's being rendered
    debug();

    // Get the nutrition values from the mock
    const nutrition = mockStore.calculateMealNutrition();

    // Find the nutrient cards by their test IDs
    const proteinCard = screen.getByTestId("nutrient-protein");
    const carbsCard = screen.getByTestId("nutrient-carbs");
    const fatCard = screen.getByTestId("nutrient-fat");

    // Check each nutrient value within its card
    expect(
      within(proteinCard).getByText(`${nutrition.protein.toFixed(1)}g`)
    ).toBeInTheDocument();
    expect(
      within(carbsCard).getByText(`${nutrition.carbs.toFixed(1)}g`)
    ).toBeInTheDocument();
    expect(
      within(fatCard).getByText(`${nutrition.fat.toFixed(1)}g`)
    ).toBeInTheDocument();

    // Check calories with target
    const caloriesValue = screen.getByTestId("calories-value");
    expect(caloriesValue).toHaveTextContent(
      `${nutrition.calories} / ${DAILY_GOALS.mealCalories.breakfast}`
    );

    // Check meal title is displayed correctly
    expect(screen.getByText(/breakfast total/i)).toBeInTheDocument();
  });

  it("toggles between meal and daily view correctly", () => {
    const mockStore = createMockStore();
    jest
      .mocked(useMealStore)
      .mockImplementation((selector) => selector(mockStore));

    render(<NutritionSummary {...defaultProps} />);

    // Check initial meal view
    const expectedMealCalories = `${
      mockStore.calculateMealNutrition().calories
    } / ${DAILY_GOALS.mealCalories.breakfast}`;
    expect(screen.getByTestId("calories-value")).toHaveTextContent(
      expectedMealCalories
    );
    expect(screen.getByText("Breakfast Total")).toBeInTheDocument();

    // Toggle to daily view
    fireEvent.click(screen.getByTestId("nutrition-summary"));

    // Check daily view values
    const expectedDailyCalories = `${
      mockStore.calculateDailyTotals().calories
    } / ${DAILY_GOALS.dailyTotals.calories}`;
    expect(screen.getByTestId("calories-value")).toHaveTextContent(
      expectedDailyCalories
    );
    expect(screen.getByText("Daily Total")).toBeInTheDocument();
  });

  it("shows correct goal ranges in daily view", () => {
    render(<NutritionSummary {...defaultProps} />);

    // Switch to daily view
    fireEvent.click(screen.getByTestId("nutrition-summary"));

    // Check target ranges are displayed
    const proteinRange = `${DAILY_GOALS.dailyTotals.protein.min}-${DAILY_GOALS.dailyTotals.protein.max}g`;
    const fatRange = `${DAILY_GOALS.dailyTotals.fat.min}-${DAILY_GOALS.dailyTotals.fat.max}g`;

    expect(screen.getByText(`Target: ${proteinRange}`)).toBeInTheDocument();
    expect(screen.getByText(`Target: ${fatRange}`)).toBeInTheDocument();
  });

  it("handles empty selections gracefully", () => {
    // Mock the store to return empty values
    jest.mocked(useMealStore).mockImplementation((selector) =>
      selector(
        createMockStore({
          calculateMealNutrition: jest.fn().mockReturnValue({
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
          }),
          calculateDailyTotals: jest.fn().mockReturnValue({
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
          }),
        })
      )
    );

    render(<NutritionSummary {...defaultProps} />);

    // Check that zero values are displayed
    expect(screen.getByText(/0 \//)).toBeInTheDocument();
    expect(screen.getAllByText(/0\.0g/)).toHaveLength(3);
  });

  it("maintains UI state when switching meals", () => {
    const { rerender } = render(<NutritionSummary {...defaultProps} />);

    // Switch to daily view
    fireEvent.click(screen.getByTestId("nutrition-summary"));
    expect(screen.getByText("Daily Total")).toBeInTheDocument();

    // Change meal
    rerender(<NutritionSummary selectedMeal="lunch" />);

    // Daily view should still be active
    expect(screen.getByText("Daily Total")).toBeInTheDocument();
  });

  it("displays correct progress bar colors based on values", () => {
    // Mock the store with values that will trigger different progress bar colors
    jest.mocked(useMealStore).mockImplementation((selector) =>
      selector(
        createMockStore({
          calculateMealNutrition: jest.fn().mockReturnValue({
            // Set calories to 120% of breakfast target to trigger red color
            calories: DAILY_GOALS.mealCalories.breakfast * 1.2,
            protein: 25,
            carbs: 0,
            fat: 12,
          }),
        })
      )
    );

    render(<NutritionSummary {...defaultProps} />);

    const progressBar = screen.getByTestId("calories-progress");
    expect(progressBar).toHaveClass("bg-red-500");
  });

  it("displays nutrition status indicators correctly", () => {
    render(<NutritionSummary {...defaultProps} />);

    // Check if status indicators are present
    expect(screen.getByText(/meets calorie goal/i)).toBeInTheDocument();
    expect(screen.getByText(/meets protein goal/i)).toBeInTheDocument();
    expect(screen.getByText(/meets fat goal/i)).toBeInTheDocument();
  });
});
