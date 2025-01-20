import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MealPlanner } from "./MealPlanner";
import { FRUITS, MOCK_FOODS } from "@/__mocks__/testConstants";
import { act } from "react";

// Mock entire modules that might cause issues
jest.mock("@/components/features/nutrition/NutritionSummary", () => ({
  NutritionSummary: () => null,
  CompactNutritionProgress: () => null,
}));

describe("MealPlanner Food Selection", () => {
  it("selects a food item and changes its appearance on first click", async () => {
    // Render the component
    render(<MealPlanner />);

    // Wait for the food item to be present
    await waitFor(() => {
      const foodItem = screen.getByText(MOCK_FOODS.fruits[0].name);
      expect(foodItem).toBeInTheDocument();
    });

    // Find the food item button
    const foodItemButton = screen.getByTestId(`${FRUITS}-0`);

    if (!foodItemButton) {
      throw new Error("Food item button not found");
    }

    // Perform click
    await act(async () => {
      fireEvent.click(foodItemButton);
    });

    // Verify selection
    await waitFor(() => {
      expect(foodItemButton).toHaveClass("bg-blue-100");
    });
  });
});
