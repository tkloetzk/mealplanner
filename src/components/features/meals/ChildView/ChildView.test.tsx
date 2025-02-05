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
import { MEAL_TYPES } from "@/constants";
import { ChildView } from "./ChildView";
import { MealType } from "@/types/meals";

describe("ChildView Component", () => {
  const mockOnFoodSelect = jest.fn();
  const mockOnMealSelect = jest.fn();

  const defaultProps = {
    selectedMeal: null as MealType | null,
    foodOptions: MOCK_FOODS,
    selections: DEFAULT_MEAL_PLAN,
    selectedDay: SELECTED_DAY,
    onFoodSelect: mockOnFoodSelect,
    onMealSelect: mockOnMealSelect,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders meal selection view when no meal is selected", () => {
    render(<ChildView {...defaultProps} />);

    // Check for meal selection prompt
    expect(screen.getByText(/What are you eating\?/i)).toBeInTheDocument();

    // Verify meal type buttons are present
    MEAL_TYPES.forEach((meal) => {
      expect(screen.getByText(new RegExp(meal, "i"))).toBeInTheDocument();
    });
  });

  it("selects a meal and shows food categories", () => {
    render(<ChildView {...defaultProps} selectedMeal="breakfast" />);

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
    render(<ChildView {...defaultProps} selectedMeal="breakfast" />);

    // Find and click a food item
    const foodItem = screen.getByText(MOCK_FOODS.fruits[0].name);
    fireEvent.click(foodItem);

    expect(mockOnFoodSelect).toHaveBeenCalledWith(
      "fruits",
      MOCK_FOODS.fruits[0]
    );
  });

  it("shows available condiments based on selected foods", () => {
    const selectionsWithFood = {
      ...DEFAULT_MEAL_PLAN,
      [SELECTED_DAY]: {
        ...DEFAULT_MEAL_PLAN[SELECTED_DAY],
        breakfast: {
          ...DEFAULT_MEAL_PLAN[SELECTED_DAY].breakfast,
          proteins: MOCK_FOODS.proteins[0],
        },
      },
    };

    render(
      <ChildView
        {...defaultProps}
        selectedMeal="breakfast"
        selections={selectionsWithFood}
      />
    );

    // Check if condiments section is displayed when a food is selected
    const condimentsSection = screen.getByText(/Add Toppings/i);
    expect(condimentsSection).toBeInTheDocument();
  });

  it("matches snapshot when no meal is selected", () => {
    const { asFragment } = render(<ChildView {...defaultProps} />);
    expect(asFragment()).toMatchSnapshot();
  });

  it("matches snapshot with meal selected", () => {
    const { asFragment } = render(
      <ChildView {...defaultProps} selectedMeal="breakfast" />
    );
    expect(asFragment()).toMatchSnapshot();
  });
});
