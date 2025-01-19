import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MealPlanner } from "../MealPlanner";
import { BREAKFAST, FRUITS, MOCK_FOODS } from "@/constants/tests/testConstants";
import { act } from "react";

// Mock entire modules that might cause issues
jest.mock("@/components/NutritionSummary", () => ({
  NutritionSummary: () => null,
}));

jest.mock("@/components/CompactNutritionProgress", () => ({
  CompactNutritionProgress: () => null,
}));

describe("MealPlanner Food Selection", () => {
  const mockHistoryData = {
    "1": [
      {
        _id: "123",
        kidId: "1",
        date: new Date().toISOString(),
        meal: BREAKFAST,
        selections: {
          proteins: MOCK_FOODS.proteins[0],
          fruits: null,
          vegetables: null,
          grains: null,
          milk: null,
          ranch: null,
        },
      },
    ],
  };

  beforeEach(() => {
    // Reset DOM and mocks before each test
    document.body.innerHTML = "";
    localStorage.clear();

    // Setup fetch mock
    global.fetch = jest.fn().mockImplementation((url) => {
      if (typeof url === "string") {
        if (url.includes("/api/meal-history")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockHistoryData["1"]),
          });
        }
      }

      // Default response for food data
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            fruits: [MOCK_FOODS.fruits[0]],
            proteins: [],
            grains: [],
            vegetables: [],
            milk: [],
          }),
      });
    }) as jest.Mock;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it.only("selects a food item and changes its appearance on first click", async () => {
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
