import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MealPlanner } from "../MealPlanner";
import { FRUITS, MOCK_FOODS } from "@/constants/tests/testConstants";
import { act } from "react";

// Mock entire modules that might cause issues
jest.mock("@/components/NutritionSummary", () => ({
  NutritionSummary: () => null,
}));

jest.mock("@/components/CompactNutritionProgress", () => ({
  CompactNutritionProgress: () => null,
}));

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  ArrowUpDown: () => null,
  MessageCircle: () => null,
  Plus: () => null,
  Camera: () => null,
  X: () => null,
  Check: () => null,
  Sliders: () => null,
  ChevronDown: () => null,
  ChevronUp: () => null,
}));

describe("MealPlanner Food Selection", () => {
  beforeEach(() => {
    // Mock fetch to return test food data
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            fruits: [MOCK_FOODS.fruits[0]],
            proteins: [],
            grains: [],
            vegetables: [],
            milk: [],
          }),
      })
    ) as jest.Mock;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

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
