import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MealPlanner } from "../MealPlanner";
import { useMealStore } from "@/store/useMealStore";
import { MOCK_FOODS } from "@/__mocks__/testConstants";

// Mock nutrition components to simplify tests
jest.mock("@/components/features/nutrition/NutritionSummary", () => ({
  NutritionSummary: ({ mealSelections, dailySelections, selectedMeal }) => (
    <div data-testid="nutrition-summary">
      <div data-testid="meal-calories">
        {mealSelections?.proteins?.adjustedCalories || 0}
      </div>
      <div data-testid="meal-protein">
        {mealSelections?.proteins?.adjustedProtein || 0}
      </div>
    </div>
  ),
  CompactNutritionProgress: () => null,
}));

describe("MealPlanner", () => {
  beforeEach(() => {
    // Reset all mocks
    jest.resetAllMocks();

    // Setup fetch mock
    global.fetch = jest.fn().mockImplementation((url) => {
      if (url === "/api/foods") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(MOCK_FOODS),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    // Clear the store state before each test
    const store = useMealStore.getState();
    store.setSelectedKid("");
    store.setSelectedDay("monday");
    store.setSelectedMeal("breakfast");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.only("allows selecting different meals", async () => {
    const user = userEvent.setup();

    // Render and wait for initial data fetch
    render(<MealPlanner />);

    // Wait for initial fetch to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/foods");
    });

    // Select a kid first
    const store = useMealStore.getState();
    store.setSelectedKid("1");

    // Click lunch button
    const lunchButton = screen.getByTestId("lunch-meal-button");
    await user.click(lunchButton);

    await waitFor(() => {
      expect(store.selectedMeal).toBe("lunch");
    });

    // Click dinner button
    const dinnerButton = screen.getByTestId("dinner-meal-button");
    await user.click(dinnerButton);

    await waitFor(() => {
      expect(store.selectedMeal).toBe("dinner");
    });

    // Click snack button
    const snackButton = screen.getByTestId("snack-meal-button");
    await user.click(snackButton);

    await waitFor(() => {
      expect(store.selectedMeal).toBe("snack");
    });

    // Click breakfast button
    const breakfastButton = screen.getByTestId("breakfast-meal-button");
    await user.click(breakfastButton);

    await waitFor(() => {
      expect(store.selectedMeal).toBe("breakfast");
    });
  });

  it("allows selecting foods for a meal", async () => {
    const user = userEvent.setup();
    render(<MealPlanner />);

    // Wait for initial fetch to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/foods");
    });

    // Setup initial state
    const store = useMealStore.getState();
    store.setSelectedKid("1");
    store.setSelectedMeal("breakfast");

    // Wait for food items to be rendered
    const foodItem = await screen.findByTestId("proteins-breakfast-0");
    await user.click(foodItem);

    await waitFor(() => {
      expect(foodItem).toHaveClass("bg-blue-100");
    });
  });

  it("displays empty state when no foods are available", async () => {
    // Override fetch mock for this test
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            proteins: [],
            grains: [],
            fruits: [],
            vegetables: [],
            dairy: [],
            other: [],
          }),
      })
    );

    render(<MealPlanner />);

    await waitFor(() => {
      expect(screen.getByText("No food options available")).toBeInTheDocument();
      expect(
        screen.getByText("Please add some foods to get started")
      ).toBeInTheDocument();
    });
  });

  it("updates nutrition when food is selected", async () => {
    const user = userEvent.setup();
    render(<MealPlanner />);

    // Wait for initial fetch to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/foods");
    });

    // Setup initial state
    const store = useMealStore.getState();
    store.setSelectedKid("1");
    store.setSelectedMeal("breakfast");

    // Get initial nutrition values
    const initialCalories = screen.getByTestId("meal-calories").textContent;
    const initialProtein = screen.getByTestId("meal-protein").textContent;

    // Select a food item
    const foodItem = await screen.findByTestId("proteins-breakfast-0");
    await user.click(foodItem);

    // Verify nutrition values have updated
    await waitFor(() => {
      const updatedCalories = screen.getByTestId("meal-calories").textContent;
      const updatedProtein = screen.getByTestId("meal-protein").textContent;

      expect(Number(updatedCalories)).toBeGreaterThan(Number(initialCalories));
      expect(Number(updatedProtein)).toBeGreaterThan(Number(initialProtein));
    });
  });
});
