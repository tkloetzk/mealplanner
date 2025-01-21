// src/components/__tests__/MealPlannerIntegration.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MOCK_FOODS } from "@/__mocks__/testConstants";
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

  // Improved test cases with better structure and assertions
  it("completes meal selection workflow with nutrition updates", async () => {
    await renderMealPlanner();

    // Select kid
    const kidSelector = screen.getByText("Presley");
    await act(async () => {
      fireEvent.click(kidSelector);
    });
    // Add protein
    await selectFood(MOCK_FOODS.proteins[0].category, 0);

    // Verify nutrition bar updates
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

    // Add fruit and verify combined nutrition
    await selectFood(MOCK_FOODS.fruits[0].category, 0);

    await waitFor(() => {
      const expectedWidth = `${
        ((MOCK_FOODS.proteins[0].calories + MOCK_FOODS.fruits[0].calories) /
          DAILY_GOALS.mealCalories.breakfast) *
        100
      }%`;
      expect(nutritionBar).toHaveStyle({ width: expectedWidth });
    });

    // Verify nutrition summary displays correctly
    const expectedNutrition = {
      protein: MOCK_FOODS.proteins[0].protein + MOCK_FOODS.fruits[0].protein,
      fat: MOCK_FOODS.proteins[0].fat + MOCK_FOODS.fruits[0].fat,
      carbs: MOCK_FOODS.proteins[0].carbs + MOCK_FOODS.fruits[0].carbs,
      calories: MOCK_FOODS.proteins[0].calories + MOCK_FOODS.fruits[0].calories,
    };

    await waitFor(() => {
      expect(
        screen.getByText(`${expectedNutrition.protein}g`)
      ).toBeInTheDocument();
      expect(screen.getByText(`${expectedNutrition.fat}g`)).toBeInTheDocument();
      expect(
        screen.getByText(`${expectedNutrition.carbs}g`)
      ).toBeInTheDocument();
      expect(
        screen.getByText(`${expectedNutrition.calories} / 400 cal`)
      ).toBeInTheDocument();
    });
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
    const foodElement = screen.getByTestId(`proteins-0`);

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

  it("handles milk and ranch toggles with nutrition updates", async () => {
    await renderMealPlanner();

    // Toggle milk and verify nutrition
    await toggleSwitch(/Include Milk/i);
    expect(
      screen.getByText(`${MILK_OPTION.calories} / 400 cal`)
    ).toBeInTheDocument();

    // Toggle ranch and verify combined nutrition
    await toggleSwitch(/Ranch Dressing/i);
    expect(
      screen.getByText(
        `${MILK_OPTION.calories + RANCH_OPTION.calories} / 400 cal`
      )
    ).toBeInTheDocument();

    // Test ranch serving increment
    fireEvent.click(screen.getByTestId("add-ranch-serving"));
    expect(
      screen.getByText(
        `${MILK_OPTION.calories + RANCH_OPTION.calories * 2} / 400 cal`
      )
    ).toBeInTheDocument();
  });

  it("handles view toggling and meal selection correctly", async () => {
    await renderMealPlanner();

    const viewToggle = screen.getByRole("switch", { name: /Parent's View/i });

    // Toggle to child view and verify
    fireEvent.click(viewToggle);
    expect(screen.getByText(/Choose your proteins/i)).toBeInTheDocument();
    expect(screen.getByText(/Choose your fruits/i)).toBeInTheDocument();

    fireEvent.click(viewToggle);

    // Test meal selection persistence across views
    fireEvent.click(screen.getByText(/Lunch/i));
    fireEvent.click(viewToggle);
    expect(screen.getByText(/Lunch/i)).toBeInTheDocument();
  });

  it("completes meal selection workflow with history tracking", async () => {
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
      expect(
        screen.getByText((content) => {
          return content.includes("1") && content.includes("serving");
        })
      ).toBeInTheDocument();
    });
  });

  it("updates existing history entry when modifying meal", async () => {
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
        "/api/meal-history",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining(MOCK_FOODS.fruits[0].name),
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
});
