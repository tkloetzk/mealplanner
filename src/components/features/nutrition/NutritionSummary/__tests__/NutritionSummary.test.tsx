// src/components/features/nutrition/NutritionSummary/__tests__/NutritionSummary.test.tsx
import { render, screen, fireEvent, within } from "@testing-library/react";
import { NutritionSummary } from "../NutritionSummary";
import { DAILY_GOALS } from "@/constants/meal-goals";
import { MealType, DayType } from "@/types/meals";
import { useMealStore } from "@/store/useMealStore";
import { useAppSettingsStore } from "@/store/useAppSettingsStore";
import * as nutritionUtils from "@/utils/nutritionUtils";
import { useMealNutrition, useDailyNutrition } from "@/store/mealSelectors";

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
    sodium: 800,
    sugar: 15,
    saturatedFat: 8,
  }),
  calculateDailyTotals: jest.fn().mockReturnValue({
    calories: 600,
    protein: 75,
    carbs: 0,
    fat: 36,
    sodium: 1500,
    sugar: 20,
    saturatedFat: 12,
  }),
  ...overrides,
});

// Mock the useMealStore hook
jest.mock("@/store/useMealStore", () => ({
  useMealStore: jest.fn((selector) => selector(createMockStore())),
}));

// Mock the mealSelectors hooks
jest.mock("@/store/mealSelectors", () => ({
  useMealNutrition: jest.fn(),
  useDailyNutrition: jest.fn(),
  useCurrentMealSelection: jest.fn().mockReturnValue(null),
}));

// Mock the useAppSettingsStore hook
jest.mock("@/store/useAppSettingsStore", () => ({
  useAppSettingsStore: jest.fn((selector) => selector({
    kids: [{ id: "1", name: "Test Kid", age: 5 }],
    getTargetsForKid: jest.fn().mockReturnValue({
      dailyCalories: 1800,
      mealCalories: { breakfast: 400, lunch: 500, dinner: 600, snacks: 300 },
      protein: { min: 20, max: 25 },
      carbs: { min: 0, max: 0 },
      fat: { min: 35, max: 49 },
      sodium: { max: 1500 }, // mg
      sugar: { max: 25 }, // g
      saturatedFat: { max: 20 }, // g
    }),
  })),
}));

// Mock the nutritionUtils functions to match the expected call signature in renderNutrientCard
jest.mock("@/utils/nutritionUtils", () => ({
  ...jest.requireActual("@/utils/nutritionUtils"),
  // Note: renderNutrientCard calls colorFunction(value, min, max)
  // so we need to mock to accept 3 params but use the first and third
  getSodiumColor: jest.fn((current, min, max) => {
    if (current > max) return "text-red-600";
    if (current > max * 0.8) return "text-yellow-600";
    return "text-green-600";
  }),
  getSugarColor: jest.fn((current, min, max) => {
    if (current > max) return "text-red-600";
    if (current > max * 0.8) return "text-yellow-600";
    return "text-green-600";
  }),
  getSaturatedFatColor: jest.fn((current, min, max) => {
    if (current > max) return "text-red-600";
    if (current > max * 0.8) return "text-yellow-600";
    return "text-green-600";
  }),
}));

describe("NutritionSummary", () => {
  const defaultProps = {
    selectedMeal: "breakfast" as MealType,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useMealNutrition).mockReturnValue({ calories: 200, protein: 25, carbs: 0, fat: 12, sodium: 800, sugar: 15, saturatedFat: 8 });
    jest.mocked(useDailyNutrition).mockReturnValue({ calories: 600, protein: 75, carbs: 0, fat: 36, sodium: 1500, sugar: 20, saturatedFat: 12 });
  });

  it("displays basic nutrition information correctly", async () => {
    const { debug } = render(<NutritionSummary {...defaultProps} />);

    // Debug output to see what's being rendered
    debug();

    // Get the nutrition values from the mock
    const nutrition = { calories: 200, protein: 25, carbs: 0, fat: 12, sodium: 800, sugar: 15, saturatedFat: 8 };

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
    render(<NutritionSummary {...defaultProps} />);

    // Check initial meal view
    expect(screen.getByTestId("calories-value")).toHaveTextContent(
      `200 / ${DAILY_GOALS.mealCalories.breakfast}`
    );
    expect(screen.getByText("Breakfast Total")).toBeInTheDocument();

    // Toggle to daily view
    fireEvent.click(screen.getByTestId("nutrition-summary"));

    // Check daily view values
    expect(screen.getByTestId("calories-value")).toHaveTextContent(
      `600 / ${DAILY_GOALS.dailyTotals.calories}`
    );
    expect(screen.getByText("Daily Total")).toBeInTheDocument();
  });

  it("shows correct goal ranges in daily view", () => {
    render(<NutritionSummary {...defaultProps} />);

    // Switch to daily view
    fireEvent.click(screen.getByTestId("nutrition-summary"));

    // Check target ranges are displayed - using a function to match text across multiple elements
    expect(screen.getByText((content, element) => {
      const hasText = (node) => node.textContent === 'Target: 20g-25g';
      const elementHasText = hasText(element);
      return elementHasText;
    })).toBeInTheDocument();

    expect(screen.getByText((content, element) => {
      const hasText = (node) => node.textContent === 'Target: 35g-49g';
      const elementHasText = hasText(element);
      return elementHasText;
    })).toBeInTheDocument();
  });

  it("handles empty selections gracefully", () => {
    jest.mocked(useMealNutrition).mockReturnValue({ calories: 0, protein: 0, carbs: 0, fat: 0, sodium: 0, sugar: 0, saturatedFat: 0 });
    jest.mocked(useDailyNutrition).mockReturnValue({ calories: 0, protein: 0, carbs: 0, fat: 0, sodium: 0, sugar: 0, saturatedFat: 0 });

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
    jest.mocked(useMealNutrition).mockReturnValue({
      // Set calories to 120% of breakfast target to trigger red color
      calories: DAILY_GOALS.mealCalories.breakfast * 1.2,
      protein: 25,
      carbs: 0,
      fat: 12,
      sodium: 0,
      sugar: 0,
      saturatedFat: 0,
    });

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

  it("displays sodium in daily view", () => {

    render(<NutritionSummary {...defaultProps} />);

    // Switch to daily view
    fireEvent.click(screen.getByTestId("nutrition-summary"));

    // Check that sodium is displayed with correct value
    const sodiumCard = screen.getByTestId("nutrient-sodium");
    expect(within(sodiumCard).getByText("1500.0mg")).toBeInTheDocument();

    // Check that sodium target is displayed
    expect(within(sodiumCard).getByText("Target: 0mg-1500mg")).toBeInTheDocument();
  });

  it("does not display sodium in meal view", () => {
    render(<NutritionSummary {...defaultProps} />);

    // Check that sodium is not displayed in meal view
    expect(screen.queryByTestId("nutrient-sodium")).not.toBeInTheDocument();
  });

  it("displays sugar in daily view", () => {

    render(<NutritionSummary {...defaultProps} />);

    // Switch to daily view
    fireEvent.click(screen.getByTestId("nutrition-summary"));

    // Check that sugar is displayed with correct value
    const sugarCard = screen.getByTestId("nutrient-sugar");
    expect(within(sugarCard).getByText("20.0g")).toBeInTheDocument();

    // Check that sugar target is displayed
    expect(within(sugarCard).getByText("Target: 0g-25g")).toBeInTheDocument();
  });

  it("does not display sugar in meal view", () => {
    render(<NutritionSummary {...defaultProps} />);

    // Check that sugar is not displayed in meal view
    expect(screen.queryByTestId("nutrient-sugar")).not.toBeInTheDocument();
  });

  it("displays saturated fat in daily view", () => {

    render(<NutritionSummary {...defaultProps} />);

    // Switch to daily view
    fireEvent.click(screen.getByTestId("nutrition-summary"));

    // Check that saturated fat is displayed with correct value
    const saturatedFatCard = screen.getByTestId("nutrient-saturated fat");
    expect(within(saturatedFatCard).getByText("12.0g")).toBeInTheDocument();

    // Check that saturated fat target is displayed
    expect(within(saturatedFatCard).getByText("Target: 0g-20g")).toBeInTheDocument();
  });

  it("does not display saturated fat in meal view", () => {
    render(<NutritionSummary {...defaultProps} />);

    // Check that saturated fat is not displayed in meal view
    expect(screen.queryByTestId("nutrient-saturated fat")).not.toBeInTheDocument();
  });

  it("applies correct color to sodium based on value - green when below 80% of max", () => {
    // Mock with sodium value below 80% of max (750 < 80% of 1500)
    jest.mocked(useDailyNutrition).mockReturnValue({ calories: 600, protein: 75, carbs: 0, fat: 36, sodium: 750, sugar: 20, saturatedFat: 12 });

    render(<NutritionSummary {...defaultProps} />);
    fireEvent.click(screen.getByTestId("nutrition-summary"));

    const sodiumCard = screen.getByTestId("nutrient-sodium");
    expect(within(sodiumCard).getByText("750.0mg").closest('div')).toHaveClass("text-green-600");
  });

  it("applies correct color to sodium based on value - yellow when between 80% and 100% of max", () => {
    // Mock with sodium value between 80% and 100% of max (1350 is 90% of 1500)
    jest.mocked(useDailyNutrition).mockReturnValue({ calories: 600, protein: 75, carbs: 0, fat: 36, sodium: 1350, sugar: 20, saturatedFat: 12 });

    render(<NutritionSummary {...defaultProps} />);
    fireEvent.click(screen.getByTestId("nutrition-summary"));

    const sodiumCard = screen.getByTestId("nutrient-sodium");
    expect(within(sodiumCard).getByText("1350.0mg").closest('div')).toHaveClass("text-yellow-600");
  });

  it("applies correct color to sodium based on value - red when above max", () => {
    // Mock with sodium value above max (1600 > 1500)
    jest.mocked(useDailyNutrition).mockReturnValue({ calories: 600, protein: 75, carbs: 0, fat: 36, sodium: 1600, sugar: 20, saturatedFat: 12 });

    render(<NutritionSummary {...defaultProps} />);
    fireEvent.click(screen.getByTestId("nutrition-summary"));

    const sodiumCard = screen.getByTestId("nutrient-sodium");
    expect(within(sodiumCard).getByText("1600.0mg").closest('div')).toHaveClass("text-red-600");
  });

  it("applies correct color to sugar based on value - green when below 80% of max", () => {
    // Mock with sugar value below 80% of max (15 < 80% of 25)
    jest.mocked(useDailyNutrition).mockReturnValue({ calories: 600, protein: 75, carbs: 0, fat: 36, sodium: 1200, sugar: 15, saturatedFat: 12 });

    render(<NutritionSummary {...defaultProps} />);
    fireEvent.click(screen.getByTestId("nutrition-summary"));

    const sugarCard = screen.getByTestId("nutrient-sugar");
    expect(within(sugarCard).getByText("15.0g").closest('div')).toHaveClass("text-green-600");
  });

  it("applies correct color to sugar based on value - yellow when between 80% and 100% of max", () => {
    // Mock with sugar value between 80% and 100% of max (22 is 88% of 25)
    jest.mocked(useDailyNutrition).mockReturnValue({ calories: 600, protein: 75, carbs: 0, fat: 36, sodium: 1200, sugar: 22, saturatedFat: 12 });

    render(<NutritionSummary {...defaultProps} />);
    fireEvent.click(screen.getByTestId("nutrition-summary"));

    const sugarCard = screen.getByTestId("nutrient-sugar");
    expect(within(sugarCard).getByText("22.0g").closest('div')).toHaveClass("text-yellow-600");
  });

  it("applies correct color to sugar based on value - red when above max", () => {
    // Mock with sugar value above max (30 > 25)
    jest.mocked(useDailyNutrition).mockReturnValue({ calories: 600, protein: 75, carbs: 0, fat: 36, sodium: 1200, sugar: 30, saturatedFat: 12 });

    render(<NutritionSummary {...defaultProps} />);
    fireEvent.click(screen.getByTestId("nutrition-summary"));

    const sugarCard = screen.getByTestId("nutrient-sugar");
    expect(within(sugarCard).getByText("30.0g").closest('div')).toHaveClass("text-red-600");
  });

  it("applies correct color to saturated fat based on value - green when below 80% of max", () => {
    // Mock with saturated fat value below 80% of max (10 < 80% of 20)
    jest.mocked(useDailyNutrition).mockReturnValue({ calories: 600, protein: 75, carbs: 0, fat: 36, sodium: 1200, sugar: 20, saturatedFat: 10 });

    render(<NutritionSummary {...defaultProps} />);
    fireEvent.click(screen.getByTestId("nutrition-summary"));

    const satFatCard = screen.getByTestId("nutrient-saturated fat");
    expect(within(satFatCard).getByText("10.0g").closest('div')).toHaveClass("text-green-600");
  });

  it("applies correct color to saturated fat based on value - yellow when between 80% and 100% of max", () => {
    // Mock with saturated fat value between 80% and 100% of max (18 is 90% of 20)
    jest.mocked(useDailyNutrition).mockReturnValue({ calories: 600, protein: 75, carbs: 0, fat: 36, sodium: 1200, sugar: 20, saturatedFat: 18 });

    render(<NutritionSummary {...defaultProps} />);
    fireEvent.click(screen.getByTestId("nutrition-summary"));

    const satFatCard = screen.getByTestId("nutrient-saturated fat");
    expect(within(satFatCard).getByText("18.0g").closest('div')).toHaveClass("text-yellow-600");
  });

  it("applies correct color to saturated fat based on value - red when above max", () => {
    // Mock with saturated fat value above max (25 > 20)
    jest.mocked(useDailyNutrition).mockReturnValue({ calories: 600, protein: 75, carbs: 0, fat: 36, sodium: 1200, sugar: 20, saturatedFat: 25 });

    render(<NutritionSummary {...defaultProps} />);
    fireEvent.click(screen.getByTestId("nutrition-summary"));

    const satFatCard = screen.getByTestId("nutrient-saturated fat");
    expect(within(satFatCard).getByText("25.0g").closest('div')).toHaveClass("text-red-600");
  });

  it("only displays sodium, sugar, and saturated fat in daily view, not in meal view", () => {

    render(<NutritionSummary {...defaultProps} />);

    // In meal view, these should not be present
    expect(screen.queryByTestId("nutrient-sodium")).not.toBeInTheDocument();
    expect(screen.queryByTestId("nutrient-sugar")).not.toBeInTheDocument();
    expect(screen.queryByTestId("nutrient-saturated fat")).not.toBeInTheDocument();

    // Switch to daily view
    fireEvent.click(screen.getByTestId("nutrition-summary"));

    // In daily view, these should be present
    expect(screen.getByTestId("nutrient-sodium")).toBeInTheDocument();
    expect(screen.getByTestId("nutrient-sugar")).toBeInTheDocument();
    expect(screen.getByTestId("nutrient-saturated fat")).toBeInTheDocument();
  });
});
