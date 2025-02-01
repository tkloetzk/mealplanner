// src/components/__tests__/MealPlannerIntegration.test.tsx
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import { MOCK_FOODS, PROTEINS } from "@/__mocks__/testConstants";
import { DAILY_GOALS, MILK_OPTION, RANCH_OPTION } from "@/constants/meal-goals";
import { MealPlanner } from "../meals/MealPlanner";
import { act } from "react";
import { CategoryType } from "@/types/food";

describe("MealPlanner Integration Tests", () => {
  // Reusable render function with common setup
  const renderMealPlanner = async () => {
    const result = render(<MealPlanner />);
    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText("Meal Planner")).toBeInTheDocument();
    });
    return result;
  };

  // Helper functions to make tests more readable and maintainable
  const selectFood = async (category: CategoryType, index: number) => {
    const foodElement = screen.getByTestId(`${category}-${index}`);

    await act(async () => {
      fireEvent.click(foodElement);
    });
    return foodElement;
  };

  const toggleSwitch = async (name: RegExp) => {
    const switchElement = screen.getByRole("switch", { name });
    await act(async () => {
      fireEvent.click(switchElement);
    });
    return switchElement;
  };

  it("handles view toggling and meal selection persistence", async () => {
    await renderMealPlanner();

    // Check initial load
    expect(screen.getByText("Meal Planner")).toBeInTheDocument();

    // Toggle to child view
    const viewToggle = screen.getByRole("switch", { name: /Parent's View/i });
    fireEvent.click(viewToggle);

    // Verify child view elements
    expect(screen.getByText(/Choose your proteins/i)).toBeInTheDocument();
    expect(screen.getByText(/Choose your fruits/i)).toBeInTheDocument();

    // Toggle back to parent view and verify
    fireEvent.click(viewToggle);
    expect(screen.getByText("Meal Planner")).toBeInTheDocument();

    // Test meal selection persistence across views
    fireEvent.click(screen.getByText(/Lunch/i));
    fireEvent.click(viewToggle);
    expect(screen.getByText(/Lunch/i)).toBeInTheDocument();
  });

  it("handles food selection with visual feedback and nutrition updates", async () => {
    await renderMealPlanner();

    // Select kid
    const kidSelector = screen.getByText("Presley");
    await act(async () => {
      fireEvent.click(kidSelector);
    });

    const proteinFood = MOCK_FOODS.proteins[0];
    const selectedFoodCard = screen
      .getByText(proteinFood.name)
      .closest(".rounded-lg");

    // Verify initial unselected state
    expect(screen.queryByTitle("Edit Food")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Adjust Servings")).not.toBeInTheDocument();
    expect(selectedFoodCard).not.toHaveClass("ring-2");

    // Select food and verify selection state
    await selectFood(MOCK_FOODS.proteins[0].category, 0);
    expect(selectedFoodCard).toHaveClass("ring-2 ring-blue-500");
    expect(screen.getByTitle("Edit Food")).toBeInTheDocument();
    expect(screen.getByTitle("Adjust Servings")).toBeInTheDocument();

    // Verify nutrition updates
    const nutritionBar = document.querySelector(
      ".h-full.bg-green-500.transition-all.duration-300"
    );
    await waitFor(() => {
      const expectedWidth = `${
        (MOCK_FOODS.proteins[0].calories / DAILY_GOALS.mealCalories.breakfast) *
        100
      }%`;
      expect(nutritionBar).toHaveStyle({ width: expectedWidth });
    });

    // Verify deselection
    await selectFood(MOCK_FOODS.proteins[0].category, 0);
    expect(screen.queryByTitle("Edit Food")).not.toBeInTheDocument();
    expect(selectedFoodCard).not.toHaveClass("ring-2");
  });

  it("handles serving size adjustments correctly", async () => {
    await renderMealPlanner();

    // Select kid (first step in most interactions)
    const kidSelector = screen.getByText("Presley");
    await act(async () => {
      fireEvent.click(kidSelector);
    });

    // Select a protein food
    const proteinFood = MOCK_FOODS.proteins[0];
    const foodElement = screen.getByTestId(`${PROTEINS}-0`);

    await act(async () => {
      fireEvent.click(foodElement);
    });

    // Open serving selector
    const servingsButton = screen.getByTitle("Adjust Servings");
    await act(async () => {
      fireEvent.click(servingsButton);
    });

    // Find serving input
    const servingInput = screen.getByTestId("custom-serving-input");
    const initialServingSize = parseFloat(proteinFood.servingSize);

    // Verify initial serving size
    expect(servingInput).toHaveValue(initialServingSize);

    // Increment serving
    const incrementButton = screen.getByTestId("increment-serving");
    await act(async () => {
      fireEvent.click(incrementButton);
    });

    // Verify incremented serving size
    expect(servingInput).toHaveValue(initialServingSize + 0.25);

    // Confirm serving change
    const confirmButton = screen.getByRole("button", { name: /confirm/i });
    await act(async () => {
      fireEvent.click(confirmButton);
    });

    await waitFor(() => {
      expect(
        screen.getByText(
          new RegExp(`${initialServingSize + 0.25} serving\\(s\\)`)
        )
      ).toBeInTheDocument();
    });
  });

  it("handles milk toggle with nutrition updates", async () => {
    await renderMealPlanner();

    // Toggle milk and verify nutrition
    await toggleSwitch(/Include Milk/i);
    expect(
      screen.getByText(`${MILK_OPTION.calories} / 400 cal`)
    ).toBeInTheDocument();
  });

  it.skip("completes meal selection workflow with history tracking", async () => {
    await renderMealPlanner();

    // Select kid
    const kidSelector = screen.getByText("Presley");
    fireEvent.click(kidSelector);

    // Add protein and verify it's saved to history
    await selectFood(MOCK_FOODS.proteins[0].category, 0);

    // Verify the API call to save history was made
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/meal-history",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: expect.stringContaining(MOCK_FOODS.proteins[0].name),
        })
      );
    });

    // Switch to history tab
    const historyTab = screen.getByRole("tab", { name: /history/i });
    await act(async () => {
      fireEvent.click(historyTab);
    });
    // Verify the history entry is displayed
    await waitFor(() => {
      // First verify the food name appears
      expect(screen.getByText(MOCK_FOODS.proteins[0].name)).toBeInTheDocument();

      // Then look for the serving information in a more flexible way
      const historyEntries = screen.getAllByText((content) => {
        return content.includes("1") && content.includes("serving");
      });
      expect(
        historyEntries.some((entry) =>
          entry.textContent.includes("serving(s) •")
        )
      ).toBe(true);
    });
  });

  it.skip("updates existing history entry when modifying meal", async () => {
    await renderMealPlanner();
    const kidSelector = screen.getByText("Presley");
    await act(async () => {
      fireEvent.click(kidSelector);
    });

    // Add first food
    await selectFood(MOCK_FOODS.proteins[0].category, 0);

    // Add second food and verify history update
    await selectFood(MOCK_FOODS.fruits[0].category, 0);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/meal-history?kidId=1",
        "/api/foods",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: expect.stringContaining(MOCK_FOODS.fruits[0].name),
          // "body": "{\"kidId\":\"1\",\"mealData\":{\"meal\":\"breakfast\",\"date\":\"2025-01-31T03:03:19.058Z\",\"selections\":{\"grains\":null,\"fruits\":null,\"proteins\":null,\"vegetables\":null,\"milk\":null,\"condiments\":[],\"ranch\":null}}}"
        })
      );
    });

    // Verify both foods appear in history
    const historyTab = screen.getByRole("tab", { name: /history/i });
    await act(async () => {
      fireEvent.click(historyTab);
    });

    await waitFor(() => {
      expect(screen.getByText(MOCK_FOODS.proteins[0].name)).toBeInTheDocument();
      expect(screen.getByText(MOCK_FOODS.fruits[0].name)).toBeInTheDocument();
    });
  });
  it('filters out hidden "Other" category foods in child view', async () => {
    await renderMealPlanner();

    // Switch to child view
    const viewToggle = screen.getByRole("switch", { name: /Parent's View/i });
    fireEvent.click(viewToggle);

    // Check that foods are filtered
    const hiddenFood = MOCK_FOODS.other.find((f) => f.hiddenFromChild);
    const visibleFood = MOCK_FOODS.other.find((f) => !f.hiddenFromChild);

    if (hiddenFood) {
      expect(screen.queryByText(hiddenFood.name)).not.toBeInTheDocument();
    }

    if (visibleFood) {
      expect(screen.getByText(visibleFood.name)).toBeInTheDocument();
    }
  });

  it("handles condiment selection, adjustments, and removal", async () => {
    await renderMealPlanner();

    // Select kid and protein
    await act(async () => {
      fireEvent.click(screen.getByText("Presley"));
      const proteinFood = screen.getByTestId("proteins-0");
      fireEvent.click(proteinFood);
    });

    // Select ranch and verify initial selection
    await act(() => {
      const ranch = screen.getByText(RANCH_OPTION.name);
      fireEvent.click(ranch);
    });

    // Verify selection and initial nutrition
    const ranchContainer = screen.getByTestId("condiments-0");
    const servingInfo = within(ranchContainer!).getByText(/serving\(s\)/);
    expect(servingInfo.textContent).toMatch("1 serving(s)");

    // Test serving adjustment
    await act(async () => {
      fireEvent.click(within(ranchContainer!).getByTitle("Adjust Servings"));
    });
    await act(async () => {
      fireEvent.change(screen.getByTestId("custom-serving-input"), {
        target: { value: "2" },
      });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /confirm/i }));
    });
    // Verify updated servings and nutrition
    expect(servingInfo.textContent).toMatch("2 serving(s)");
    const expectedCalories =
      MOCK_FOODS.proteins[0].calories + RANCH_OPTION.calories * 2;
    expect(
      screen.getByText(`${expectedCalories} / 400 cal`)
    ).toBeInTheDocument();

    // Test condiment removal
    await act(async () => {
      const proteinFood = screen.getByTestId("proteins-0");
      fireEvent.click(proteinFood);
    });

    // Select ranch and verify initial selection
    await act(() => {
      const ranch = screen.getByText(RANCH_OPTION.name);
      fireEvent.click(ranch);
    });

    expect(screen.queryByTitle("Edit Food")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Adjust Servings")).not.toBeInTheDocument();
  });
});
