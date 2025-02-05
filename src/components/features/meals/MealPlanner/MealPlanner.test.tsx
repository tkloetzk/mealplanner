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

describe.skip("MealPlanner Food Selection", () => {
  it("selects a food item and changes its appearance on first click", async () => {
    // Render the component
    render(<MealPlanner />);

    // Wait for the food item to be present
    await waitFor(() => {
      const foodItem = screen.getByText(MOCK_FOODS.fruits[0].name);
      expect(foodItem).toBeInTheDocument();
    });

    // Find the food item button
    const foodItemButton = screen.getByTestId(`${FRUITS}-breakfast-0`);

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

describe("MealPlanner Empty Food Options", () => {
  it("displays 'No food options available' message when foodOptions are empty", async () => {
    // Mock fetch to return empty food options
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          proteins: [],
          fruits: [],
          vegetables: [],
          grains: [],
          milk: [],
        }),
    });

    render(<MealPlanner />);

    // Wait for loading to complete and check for empty message
    await waitFor(() => {
      const emptyMessage = screen.getByText("No food options available");
      expect(emptyMessage).toBeInTheDocument();
    });
  });
});
