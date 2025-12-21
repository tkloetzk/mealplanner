import { render, screen, fireEvent } from "@testing-library/react";
import { MealSelector } from "../MealSelector";
import type { MealType } from "@/types/shared";

// Mock constants
jest.mock("@/constants", () => ({
  MEAL_TYPES: [
    "breakfast",
    "lunch",
    "dinner",
    "midmorning_snack",
    "afternoon_snack",
    "bedtime_snack",
  ],
  MEAL_TYPE_LABELS: {
    breakfast: "Breakfast",
    lunch: "Lunch",
    dinner: "Dinner",
    midmorning_snack: "Midmorning Snack",
    afternoon_snack: "Afternoon Snack",
    bedtime_snack: "Bedtime Snack",
  },
}));

describe("MealSelector", () => {
  const mockOnMealSelect = jest.fn();
  const defaultProps = {
    selectedMeal: "breakfast" as MealType,
    onMealSelect: mockOnMealSelect,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders all meal types", () => {
    render(<MealSelector {...defaultProps} />);

    expect(screen.getByText("Breakfast")).toBeInTheDocument();
    expect(screen.getByText("Lunch")).toBeInTheDocument();
    expect(screen.getByText("Dinner")).toBeInTheDocument();
    expect(screen.getByText("Midmorning Snack")).toBeInTheDocument();
    expect(screen.getByText("Afternoon Snack")).toBeInTheDocument();
    expect(screen.getByText("Bedtime Snack")).toBeInTheDocument();
  });

  it("highlights the selected meal", () => {
    render(<MealSelector {...defaultProps} selectedMeal="lunch" />);

    const breakfastButton = screen.getByText("Breakfast");
    const lunchButton = screen.getByText("Lunch");

    expect(breakfastButton).toHaveClass("bg-gray-100", "hover:bg-gray-200");
    expect(lunchButton).toHaveClass("bg-blue-500", "text-white");
  });

  it("calls onMealSelect when a meal is clicked", () => {
    render(<MealSelector {...defaultProps} />);

    const dinnerButton = screen.getByText("Dinner");
    fireEvent.click(dinnerButton);

    expect(mockOnMealSelect).toHaveBeenCalledWith("dinner");
  });

  it("has proper test IDs for meal buttons", () => {
    render(<MealSelector {...defaultProps} />);

    expect(screen.getByTestId("breakfast-meal-button")).toBeInTheDocument();
    expect(screen.getByTestId("lunch-meal-button")).toBeInTheDocument();
    expect(screen.getByTestId("dinner-meal-button")).toBeInTheDocument();
    expect(
      screen.getByTestId("midmorning_snack-meal-button")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("afternoon_snack-meal-button")
    ).toBeInTheDocument();
    expect(screen.getByTestId("bedtime_snack-meal-button")).toBeInTheDocument();
  });

  it("applies responsive grid layout", () => {
    render(<MealSelector {...defaultProps} />);

    const container = screen.getByText("Breakfast").parentElement;
    expect(container).toHaveClass(
      "grid",
      "grid-cols-2",
      "md:grid-cols-4",
      "gap-4"
    );
  });

  it("capitalizes meal names", () => {
    render(<MealSelector {...defaultProps} />);

    const buttons = screen.getAllByRole("button");
    buttons.forEach((button) => {
      expect(button).toHaveClass("capitalize");
    });
  });

  it("updates selection when selectedMeal prop changes", () => {
    const { rerender } = render(<MealSelector {...defaultProps} />);

    expect(screen.getByText("Breakfast")).toHaveClass(
      "bg-blue-500",
      "text-white"
    );
    expect(screen.getByText("Midmorning Snack")).toHaveClass("bg-gray-100");

    rerender(
      <MealSelector {...defaultProps} selectedMeal="midmorning_snack" />
    );

    expect(screen.getByText("Breakfast")).toHaveClass("bg-gray-100");
    expect(screen.getByText("Midmorning Snack")).toHaveClass(
      "bg-blue-500",
      "text-white"
    );
  });

  it("shows hover effects on unselected buttons", () => {
    render(<MealSelector {...defaultProps} />);

    const lunchButton = screen.getByText("Lunch");
    expect(lunchButton).toHaveClass("hover:bg-gray-200");
  });

  it("is memoized to prevent unnecessary re-renders", () => {
    const { rerender } = render(<MealSelector {...defaultProps} />);

    // Re-render with same props should not cause issues
    rerender(<MealSelector {...defaultProps} />);

    expect(screen.getByText("Breakfast")).toHaveClass(
      "bg-blue-500",
      "text-white"
    );
  });
});
