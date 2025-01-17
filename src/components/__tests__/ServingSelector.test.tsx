// src/components/__tests__/ServingSelector.test.tsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ServingSelector } from "../ServingSelector";
import { MOCK_FOODS } from "@/constants/tests/testConstants";

describe("ServingSelector Component", () => {
  const mockOnConfirm = jest.fn();
  const mockOnCancel = jest.fn();

  const defaultProps = {
    food: MOCK_FOODS.proteins[0],
    currentServings: 1,
    onConfirm: mockOnConfirm,
    onCancel: mockOnCancel,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders initial serving correctly", () => {
    render(<ServingSelector {...defaultProps} />);

    // Check initial serving input
    const servingInput = screen.getByDisplayValue("1");
    expect(servingInput).toBeInTheDocument();
  });

  it("calculates nutrition for different servings", () => {
    render(<ServingSelector {...defaultProps} />);

    const caloriesElement = screen.getByTestId("calories-incremented");
    expect(caloriesElement).toBeInTheDocument();
    expect(caloriesElement).toHaveTextContent(
      MOCK_FOODS.proteins[0].calories.toString()
    );
    // Find increment button and click
    const incrementButton = screen.getByTestId("increment-serving");
    fireEvent.click(incrementButton);

    // Check updated nutrition values
    expect(caloriesElement).toHaveTextContent(
      (MOCK_FOODS.proteins[0].calories * 1.25).toFixed(0).toString()
    );
  });

  it("handles confirmation", () => {
    render(<ServingSelector {...defaultProps} />);

    const confirmButton = screen.getByRole("button", { name: /confirm/i });
    fireEvent.click(confirmButton);

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it("handles cancellation", () => {
    render(<ServingSelector {...defaultProps} />);

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it("matches snapshot", () => {
    const { asFragment } = render(<ServingSelector {...defaultProps} />);
    expect(asFragment()).toMatchSnapshot();
  });
});
