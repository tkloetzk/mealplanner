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

  it("loads correctly and allows toggling between parent and child views", async () => {
    await renderMealPlanner();

    // Check if the Meal Planner title is present
    expect(screen.getByText("Meal Planner")).toBeInTheDocument();

    // Toggle to child view
    const viewToggle = screen.getByRole("switch", { name: /Parent's View/i });
    fireEvent.click(viewToggle);

    // Verify that the child view elements are displayed
    expect(screen.getByText(/Choose your proteins/i)).toBeInTheDocument();
    expect(screen.getByText(/Choose your fruits/i)).toBeInTheDocument();

    // Toggle back to parent view
    fireEvent.click(viewToggle);
    expect(screen.getByText("Meal Planner")).toBeInTheDocument();
  });

  it("provides visual feedback when a food item is selected and removes it on second click", async () => {
    await renderMealPlanner();

    // Select a kid
    const kidSelector = screen.getByText("Presley");
    await act(async () => {
      fireEvent.click(kidSelector);
    });

    const proteinFood = MOCK_FOODS.proteins[0];
    const selectedFoodCard = screen
      .getByText(proteinFood.name)
      .closest(".rounded-lg");

    // Verify there is no visually indicated selection
    expect(screen.queryByTitle("Edit Food")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Adjust Servings")).not.toBeInTheDocument();
    expect(selectedFoodCard).not.toHaveClass("ring-2");
    expect(selectedFoodCard).not.toHaveClass("ring-blue-500");

    // Select a food item
    await selectFood(MOCK_FOODS.proteins[0].category, 0);

    // Verify selection is visually indicated
    expect(selectedFoodCard).toHaveClass("ring-2");
    expect(selectedFoodCard).toHaveClass("ring-blue-500");

    // Verify sevings text is present
    expect(
      screen.getByText(`1 serving(s) • ${proteinFood.calories} cal total`)
    ).toBeInTheDocument();

    expect(screen.getByTitle("Edit Food")).toBeInTheDocument();
    expect(screen.getByTitle("Adjust Servings")).toBeInTheDocument();

    // Verify selection goes away on second click
    await selectFood(MOCK_FOODS.proteins[0].category, 0);
    expect(screen.queryByTitle("Edit Food")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Adjust Servings")).not.toBeInTheDocument();
    expect(selectedFoodCard).not.toHaveClass("ring-2");
    expect(selectedFoodCard).not.toHaveClass("ring-blue-500");
  });

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

  describe("Condiments Integration", () => {
    // beforeEach(() => {
    //   // Mock fetch to return mock foods including ranch
    //   const mockResponse = {
    //     proteins: MOCK_FOODS.proteins,
    //     fruits: MOCK_FOODS.fruits,
    //     vegetables: MOCK_FOODS.vegetables,
    //     condiments: [RANCH_OPTION],
    //     other: MOCK_FOODS.other,
    //   };

    //   global.fetch = jest.fn().mockImplementation((url) => {
    //     if (url.includes("/api/foods")) {
    //       return Promise.resolve({
    //         ok: true,
    //         json: () => Promise.resolve(mockResponse),
    //       });
    //     }
    //     return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    //   });
    // });

    it("handles condiment selection and serving adjustments", async () => {
      await renderMealPlanner();
      // Select kid
      const kidSelector = screen.getByText("Presley");
      await act(async () => {
        fireEvent.click(kidSelector);
      });

      // Select the protein
      await act(() => {
        const proteinFood = screen.getByTestId("proteins-0");
        fireEvent.click(proteinFood);
      });

      // After protein is selected, ranch should be available
      await act(() => {
        const ranch = screen.getByText(RANCH_OPTION.name);
        fireEvent.click(ranch);
      });

      // Verify ranch is selected and nutrition is updated
      const ranchContainer = screen.getByTestId("condiments-0");
      const servingInfo = within(ranchContainer!).getByText(/serving\(s\)/);
      expect(servingInfo).toBeInTheDocument();
      expect(servingInfo.textContent).toMatch("1 serving(s)");

      //    Check that nutrition values are updated with ranch calories
      const expectedCalories =
        MOCK_FOODS.proteins[0].calories + RANCH_OPTION.calories;
      expect(
        screen.getByText(`${expectedCalories} / 400 cal`)
      ).toBeInTheDocument();

      // Test serving adjustment for ranch
      const servingButton = within(ranchContainer!).getByTitle(
        "Adjust Servings"
      );
      await act(async () => {
        fireEvent.click(servingButton);
      });

      // Change to 2 servings
      const servingInput = screen.getByTestId("custom-serving-input");
      await act(async () => {
        fireEvent.change(servingInput, { target: { value: "2" } });
      });

      // Confirm serving change
      const confirmButton = screen.getByRole("button", { name: /confirm/i });
      await act(async () => {
        fireEvent.click(confirmButton);
      });

      // Verify updated nutrition with new serving size
      expect(servingInfo.textContent).toMatch("2 serving(s)");

      const expectedCaloriesWithTwoServings =
        MOCK_FOODS.proteins[0].calories + RANCH_OPTION.calories * 2;
      expect(
        screen.getByText(`${expectedCaloriesWithTwoServings} / 400 cal`)
      ).toBeInTheDocument();
    });

    it("allows removing condiments by clicking again", async () => {
      render(<MealPlanner />);

      // Select kid
      await act(async () => {
        fireEvent.click(screen.getByText("Presley"));
      });

      const condimentFood = MOCK_FOODS.condiments[0];
      const foodElement = screen.getByTestId(`condiments-0`);

      const selectedFoodCard = screen
        .getByText(condimentFood.name)
        .closest(".rounded-lg");

      // Verify there is no visually indicated selection
      expect(screen.queryByTitle("Edit Food")).not.toBeInTheDocument();
      expect(screen.queryByTitle("Adjust Servings")).not.toBeInTheDocument();
      expect(selectedFoodCard).not.toHaveClass("ring-2");
      expect(selectedFoodCard).not.toHaveClass("ring-blue-500");

      await act(async () => {
        fireEvent.click(foodElement);
      });
      //  await selectFood(MOCK_FOODS.proteins[0].category, 0);

      // Verify selection is visually indicated
      expect(selectedFoodCard).toHaveClass("ring-2");
      expect(selectedFoodCard).toHaveClass("ring-blue-500");

      // Verify sevings text is present
      expect(
        screen.getByText(`1 serving(s) • ${condimentFood.calories} cal total`)
      ).toBeInTheDocument();

      expect(screen.getByTitle("Edit Food")).toBeInTheDocument();
      expect(screen.getByTitle("Adjust Servings")).toBeInTheDocument();

      // Verify selection goes away on second click
      await selectFood(MOCK_FOODS.condiments[0].category, 0);
      expect(screen.queryByTitle("Edit Food")).not.toBeInTheDocument();
      expect(screen.queryByTitle("Adjust Servings")).not.toBeInTheDocument();
      expect(selectedFoodCard).not.toHaveClass("ring-2");
      expect(selectedFoodCard).not.toHaveClass("ring-blue-500");
    });
  });
});
