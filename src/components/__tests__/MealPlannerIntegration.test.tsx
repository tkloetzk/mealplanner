// src/components/__tests__/MealPlannerIntegration.test.tsx
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MealPlanner } from "../MealPlanner";
import { MOCK_FOODS } from "@/constants/tests/testConstants";
import { DAILY_GOALS } from "@/constants/meal-goals";

// Mock fetch to provide test data
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        proteins: MOCK_FOODS.proteins,
        fruits: MOCK_FOODS.fruits,
        vegetables: MOCK_FOODS.vegetables,
        grains: [],
        milk: [],
      }),
  })
) as jest.Mock;

describe("MealPlanner Integration Tests", () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  it("completes full meal selection workflow", async () => {
    render(<MealPlanner />);

    // Select first kid
    await waitFor(() => {
      expect(screen.getByText("Presley")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Presley"));

    // Select breakfast
    // fireEvent.click(screen.getByText(/lunch/i));

    // Select protein
    await waitFor(() => {
      const proteinFood = screen.getByText(MOCK_FOODS.proteins[0].name);
      expect(proteinFood).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId(`${MOCK_FOODS.proteins[0].category}-0`));

    const element = document.querySelector(
      ".h-full.bg-green-500.transition-all.duration-300"
    );

    await waitFor(() => {
      expect(element.style.width).toBe(
        `${
          (MOCK_FOODS.proteins[0].calories /
            DAILY_GOALS.mealCalories.breakfast) *
          100
        }%`
      );
    });

    fireEvent.click(screen.getByTestId(`${MOCK_FOODS.fruits[0].category}-0`));

    await waitFor(() => {
      expect(element.style.width).toBe(
        `${
          ((MOCK_FOODS.proteins[0].calories + MOCK_FOODS.fruits[0].calories) /
            DAILY_GOALS.mealCalories.breakfast) *
          100
        }%`
      );
    });
    // Select fruit
    //  fireEvent.click(screen.getByText(MOCK_FOODS.fruits[0].name));

    // Check nutrition summary updates
    await waitFor(() => {
      const proteinText = screen.getByText(
        `${MOCK_FOODS.proteins[0].protein + MOCK_FOODS.fruits[0].protein}g`
      );

      expect(proteinText).toBeInTheDocument();
      const fatText = screen.getByText(
        `${MOCK_FOODS.proteins[0].fat + MOCK_FOODS.fruits[0].fat}g`
      );
      expect(fatText).toBeInTheDocument();
      const carbText = screen.getByText(
        `${MOCK_FOODS.proteins[0].carbs + MOCK_FOODS.fruits[0].carbs}g`
      );
      expect(carbText).toBeInTheDocument();
      const calorie = screen.getByText(
        `${
          MOCK_FOODS.proteins[0].calories + MOCK_FOODS.fruits[0].calories
        } / 400 cal`
      );
      expect(calorie).toBeInTheDocument();
    });

    // Verify meal history is updated
    const nutritionSummary = screen.getByText(/Nutrition Summary/i);
    expect(nutritionSummary).toBeInTheDocument();
  });

  it("tests serving size adjustment", async () => {
    render(<MealPlanner />);

    // Select a food item
    await waitFor(() => {
      const proteinFood = screen.getByText(MOCK_FOODS.proteins[0].name);
      fireEvent.click(proteinFood);
    });

    // Open serving selector
    const servingsButton = screen.getByTitle("Adjust Servings");
    fireEvent.click(servingsButton);

    // Adjust servings
    const servingSize = parseFloat(MOCK_FOODS.proteins[0].servingSize);
    expect(screen.getByTestId("custom-serving-input")).toHaveValue(servingSize);
    //userEvent.clear(servingsInput);
    //userEvent.type(servingsInput, "2");
    fireEvent.click(screen.getByTestId("increment-serving"));
    expect(screen.getByTestId("custom-serving-input")).toHaveValue(
      servingSize + 0.25
    );

    // Confirm servings
    const confirmButton = screen.getByRole("button", { name: /confirm/i });
    fireEvent.click(confirmButton);

    // Verify nutrition updates
    await waitFor(() => {
      const adjustedCalories = screen.getByText(
        new RegExp(String.raw`${servingSize + 0.25} serving\(s\)`, "g")
      );
      expect(adjustedCalories).toBeInTheDocument();
    });
  });

  it.skip("tests milk and ranch toggles", async () => {
    render(<MealPlanner />);

    // Select first kid and breakfast
    // await waitFor(() => {
    //   fireEvent.click(screen.getByText("Presley"));
    //   fireEvent.click(screen.getByText(/breakfast/i));
    // });

    // Toggle milk
    const milkSwitch = screen.getByTestId("milk-toggle");
    await waitFor(() => {
      expect(milkSwitch).toBeInTheDocument();
    });
    fireEvent.click(milkSwitch);

    // Toggle ranch
    const ranchSwitch = screen.getByRole("switch", { name: /ranch dressing/i });
    fireEvent.click(ranchSwitch);

    // Verify toggles update nutrition
    await waitFor(() => {
      expect(screen.getByText(/Milk/i)).toBeInTheDocument();
      expect(screen.getByText(/Ranch/i)).toBeInTheDocument();
    });
  });

  it.skip("tests child view interaction", async () => {
    render(<MealPlanner />);

    // Toggle to child view
    const childViewSwitch = screen.getByRole("switch", { name: /kid's view/i });
    fireEvent.click(childViewSwitch);

    // Verify child view renders
    await waitFor(() => {
      expect(screen.getByText(/What are you eating\?/i)).toBeInTheDocument();
    });

    // Select breakfast
    fireEvent.click(screen.getByText(/breakfast/i));

    // Verify food categories render
    await waitFor(() => {
      expect(screen.getByText(/Choose your proteins/i)).toBeInTheDocument();
    });
  });
});
