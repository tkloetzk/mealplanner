// src/components/__tests__/ChildView.test.tsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  FRUITS,
  MOCK_FOODS,
  PROTEINS,
  SELECTED_DAY,
  VEGETABLES,
} from "@/__mocks__/testConstants";
import { DEFAULT_MEAL_PLAN } from "@/constants/meal-goals";
import { BREAKFAST, MEAL_TYPES } from "@/constants";
import { ChildView } from "./ChildView";

describe("ChildView Component", () => {
  const mockOnFoodSelect = jest.fn();
  const mockOnMealSelect = jest.fn();

  const defaultProps = {
    selectedMeal: null,
    foodOptions: MOCK_FOODS,
    selections: DEFAULT_MEAL_PLAN,
    selectedDay: SELECTED_DAY,
    onFoodSelect: mockOnFoodSelect,
    onMealSelect: mockOnMealSelect,
  };
  it("renders meal selection view when no meal is selected", () => {
    render(<ChildView {...defaultProps} />);

    // Check for meal selection prompt
    expect(screen.getByText(/What are you eating\?/i)).toBeInTheDocument();

    // Verify meal type buttons are present
    MEAL_TYPES.forEach((meal) => {
      expect(screen.getByText(new RegExp(meal, "i"))).toBeInTheDocument();
    });
  });

  it.skip("selects a meal and shows food categories", () => {
    render(<ChildView {...defaultProps} selectedMeal={BREAKFAST} />);

    // Check for breakfast header
    expect(screen.getByText(/breakfast/i)).toBeInTheDocument();

    // Verify food categories are displayed
    [PROTEINS, FRUITS, VEGETABLES].forEach((category) => {
      expect(
        screen.getByText(new RegExp(`Choose your ${category}`, "i"))
      ).toBeInTheDocument();
    });
  });

  it("allows food selection in a category", () => {
    render(<ChildView {...defaultProps} selectedMeal={BREAKFAST} />);

    // Find and click a food item
    const foodItem = screen.getByText(MOCK_FOODS.fruits[0].name);
    fireEvent.click(foodItem);

    expect(mockOnFoodSelect).toHaveBeenCalledWith(FRUITS, MOCK_FOODS.fruits[0]);
  });

  it("matches snapshot when no meal is selected", () => {
    const { asFragment } = render(<ChildView {...defaultProps} />);
    expect(asFragment()).toMatchSnapshot();
  });

  it("matches snapshot with meal selected", () => {
    const { asFragment } = render(
      <ChildView {...defaultProps} selectedMeal={BREAKFAST} />
    );
    expect(asFragment()).toMatchSnapshot();
  });
});
