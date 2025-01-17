// src/components/__tests__/FoodItem.test.tsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import FoodItem from "../FoodItem";
import { MOCK_FOODS, PROTEINS } from "@/constants/tests/testConstants";

describe("FoodItem Component", () => {
  const mockOnSelect = jest.fn();
  const mockOnServingClick = jest.fn();
  const mockOnEditFood = jest.fn();

  const defaultProps = {
    id: "1",
    food: MOCK_FOODS.proteins[0],
    category: PROTEINS,
    isSelected: false,
    index: 0,
    selectedFoodInCategory: null,
    onSelect: mockOnSelect,
    onServingClick: mockOnServingClick,
    onEditFood: mockOnEditFood,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders food item correctly", () => {
    render(<FoodItem {...defaultProps} />);

    // Check core rendering elements
    expect(screen.getByText(MOCK_FOODS.proteins[0].name)).toBeInTheDocument();
    expect(
      screen.getByText(`${MOCK_FOODS.proteins[0].calories} cal`)
    ).toBeInTheDocument();
  });

  it("handles selection correctly", () => {
    render(<FoodItem {...defaultProps} isSelected={true} />);

    // Verify selected state styling or elements
    const foodItem = screen.getByTestId(`${defaultProps.category}-0`);

    expect(foodItem).toHaveClass("bg-blue-100");
  });

  it("triggers onSelect when clicked", () => {
    render(<FoodItem {...defaultProps} />);

    const foodItem = screen
      .getByText(MOCK_FOODS.proteins[0].name)
      .closest("div");
    fireEvent.click(foodItem!);

    expect(mockOnSelect).toHaveBeenCalledTimes(1);
  });

  it("shows serving details when selected", () => {
    const selectedFood = {
      ...MOCK_FOODS.proteins[0],
      servings: 2,
      adjustedCalories: MOCK_FOODS.proteins[0].calories * 2,
      adjustedProtein: MOCK_FOODS.proteins[0].protein * 2,
      adjustedCarbs: MOCK_FOODS.proteins[0].carbs * 2,
      adjustedFat: MOCK_FOODS.proteins[0].fat * 2,
    };

    render(
      <FoodItem
        {...defaultProps}
        isSelected={true}
        selectedFoodInCategory={selectedFood}
      />
    );

    expect(screen.getByText(/2 serving\(s\)/)).toBeInTheDocument();
  });

  it("matches snapshot of unselected food", () => {
    const { asFragment } = render(<FoodItem {...defaultProps} />);
    expect(asFragment()).toMatchSnapshot();
  });
  it("matches snapshot of selected food", () => {
    const { asFragment } = render(
      <FoodItem {...defaultProps} isSelected={true} />
    );
    expect(asFragment()).toMatchSnapshot();
  });
});
