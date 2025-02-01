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
import { MEAL_TYPES } from "@/constants";
const renderMealPlanner = async () => {
  const result = render(<MealPlanner />);
  // Wait for initial load
  await waitFor(() => {
    expect(screen.getByText("Meal Planner")).toBeInTheDocument();
  });
  return result;
};
const selectMeal = async (meal: string) => {
  const mealButton = screen.getByTestId(`${meal}-meal-button`);
  await act(async () => {
    fireEvent.click(mealButton);
  });
  expect(mealButton).toHaveClass("bg-blue-500 text-white");
  return mealButton;
};
const selectFood = async (
  category: CategoryType,
  index: number,
  meal = MEAL_TYPES[0]
) => {
  const foodElement = screen.getByTestId(`${category}-${meal}-${index}`);

  await act(async () => {
    fireEvent.click(foodElement);
  });
  expect(foodElement).toHaveClass("ring-2 ring-blue-500");
  return foodElement;
};
describe("MealPlanner Integration Tests", () => {
  // Reusable render function with common setup

  // Helper functions to make tests more readable and maintainable

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

// Add this to src/components/features/meals/MealPlanner/__tests__/MealPlannerIntegration.test.tsx

describe("Meal History Management", () => {
  it("only saves meals with actual selections to history", async () => {
    // Mock fetch to track API calls
    const mockFetch = jest.fn().mockImplementation((url) => {
      if (url.includes("/api/meal-history")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }
      // Return mock food data for other requests
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(MOCK_FOODS),
      });
    });

    global.fetch = mockFetch;

    render(<MealPlanner />);

    // Select kid
    await act(async () => {
      fireEvent.click(screen.getByText("Presley"));
    });

    // 1. Select food in lunch
    await act(async () => {
      fireEvent.click(screen.getByText(/lunch/i));
      const proteinElement = screen.getByTestId(`proteins-0`);
      fireEvent.click(proteinElement);
    });

    // Wait for debounced save
    await new Promise((resolve) => setTimeout(resolve, 600));

    // 2. Switch to dinner without making selections
    await act(async () => {
      fireEvent.click(screen.getByText(/dinner/i));
    });

    // Wait again to ensure no save happens
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Analyze fetch calls
    const mealHistoryPosts = mockFetch.mock.calls.filter(
      ([url, options]) =>
        url.includes("/api/meal-history") && options?.method === "POST"
    );

    // Should only have one POST call for lunch
    expect(mealHistoryPosts).toHaveLength(1);

    // Verify the saved meal data
    const savedMealData = JSON.parse(mealHistoryPosts[0][1].body);
    expect(savedMealData.mealData.meal).toBe("lunch");
    expect(savedMealData.mealData.selections.proteins).toBeDefined();

    // 3. Make a selection in dinner
    await act(async () => {
      const vegetableElement = screen.getByTestId(`vegetables-0`);
      fireEvent.click(vegetableElement);
    });

    // Wait for dinner save
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Should now have two POST calls (lunch and dinner)
    const updatedMealHistoryPosts = mockFetch.mock.calls.filter(
      ([url, options]) =>
        url.includes("/api/meal-history") && options?.method === "POST"
    );

    expect(updatedMealHistoryPosts).toHaveLength(2);

    // Verify the second saved meal data
    const savedDinnerData = JSON.parse(updatedMealHistoryPosts[1][1].body);
    expect(savedDinnerData.mealData.meal).toBe("dinner");
    expect(savedDinnerData.mealData.selections.vegetables).toBeDefined();
  });

  it("handles meal selection changes correctly in history", async () => {
    const mockFetch = jest.fn().mockImplementation((url) => {
      if (url.includes("/api/meal-history")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(MOCK_FOODS),
      });
    });

    global.fetch = mockFetch;

    render(<MealPlanner />);

    // Select kid
    await act(async () => {
      fireEvent.click(screen.getByText("Presley"));
    });

    // Select a protein in lunch
    await act(async () => {
      fireEvent.click(screen.getByText(/lunch/i));
      const proteinElement = screen.getByTestId(`proteins-0`);
      fireEvent.click(proteinElement);
    });

    // Wait for save
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Deselect the protein
    await act(async () => {
      const proteinElement = screen.getByTestId(`proteins-0`);
      fireEvent.click(proteinElement);
    });

    // Wait for update
    await new Promise((resolve) => setTimeout(resolve, 600));

    // After deselection, there should be no new save since meal has no selections
    const finalMealHistoryPosts = mockFetch.mock.calls.filter(
      ([url, options]) =>
        url.includes("/api/meal-history") && options?.method === "POST"
    );

    // Should still have only one POST call from the initial selection
    expect(finalMealHistoryPosts).toHaveLength(1);
  });
});
describe("Meal Selection Isolation", () => {
  // Add this to MealPlannerIntegration.test.tsx

  it("maintains unique food selection states between meals", async () => {
    await renderMealPlanner();
    // Select kid
    await act(async () => {
      fireEvent.click(screen.getByText("Presley"));
    });

    // Select protein in lunch
    await selectMeal(MEAL_TYPES[1]);
    await selectFood("proteins", 0, MEAL_TYPES[1]);

    // Verify protein is selected in lunch
    const selectedProtein = screen.getByTestId("proteins-lunch-0");
    expect(selectedProtein).toHaveClass("ring-2 ring-blue-500");
    expect(selectedProtein.closest("div")).toHaveClass("bg-blue-100");

    // Switch to dinner and verify protein is NOT selected there
    await act(async () => {
      fireEvent.click(screen.getByTestId("dinner-meal-button"));
    });

    // The same protein should not be selected in dinner
    const dinnerProtein = screen.getByTestId("proteins-dinner-0");
    expect(dinnerProtein).not.toHaveClass("ring-2 ring-blue-500");
    expect(dinnerProtein.closest("div")).not.toHaveClass("bg-blue-100");

    // Switch back to lunch and verify protein is still selected
    await act(async () => {
      fireEvent.click(screen.getByTestId("lunch-meal-button"));
    });

    const lunchProtein = screen.getByTestId("proteins-lunch-0");
    expect(lunchProtein).toHaveClass("ring-2 ring-blue-500");
    expect(lunchProtein.closest("div")).toHaveClass("bg-blue-100");
  });

  it("handles deselection independently between meals", async () => {
    await renderMealPlanner();

    // 1. Select foods in both lunch and dinner
    // Select in lunch first
    await selectMeal(MEAL_TYPES[1]);
    await selectFood(MOCK_FOODS.proteins[0].category, 0);

    // Select in dinner
    await selectMeal(MEAL_TYPES[2]);
    await selectFood(MOCK_FOODS.vegetables[0].category, 0);

    // 2. Deselect protein in lunch
    await selectMeal(MEAL_TYPES[1]);
    await act(async () => {
      const proteinElement = screen.getByTestId(`proteins-0`);
      fireEvent.click(proteinElement); // Click again to deselect
    });
    expect(screen.getByTestId(`proteins-0`)).not.toHaveClass(
      "ring-2 ring-blue-500"
    );

    // 3. Verify dinner selection remains unchanged
    await selectMeal(MEAL_TYPES[2]);
    expect(screen.getByTestId(`vegetables-0`)).toHaveClass(
      "ring-2 ring-blue-500"
    );

    // 4. Verify lunch protein was deselected
    await selectMeal(MEAL_TYPES[1]);
    expect(screen.getByTestId(`proteins-0`)).not.toHaveClass(
      "ring-2 ring-blue-500"
    );
  });

  it("maintains meal-specific serving adjustments", async () => {
    await renderMealPlanner();
    // Select kid
    // await act(async () => {
    //   fireEvent.click(screen.getByText("Presley"));
    // });

    // 1. Select same protein in both lunch and dinner with different servings
    // Lunch: 1 serving
    await selectMeal(MEAL_TYPES[1]);
    await selectFood("proteins", 0);

    // Dinner: 2 servings
    await selectMeal(MEAL_TYPES[2]);
    await selectFood("proteins", 0);

    // Adjust dinner serving to 2
    await act(async () => {
      const servingButton = screen.getByTitle("Adjust Servings");
      fireEvent.click(servingButton);
    });
    await act(async () => {
      const servingInput = screen.getByTestId("custom-serving-input");
      fireEvent.change(servingInput, { target: { value: "2" } });

      const confirmButton = screen.getByRole("button", { name: /confirm/i });
      fireEvent.click(confirmButton);
    });

    // Verify lunch still has 1 serving
    await selectMeal(MEAL_TYPES[1]);
    expect(screen.getByText("1 serving(s)")).toBeInTheDocument();

    // Verify dinner has 2 servings
    await act(async () => {
      fireEvent.click(screen.getByText(/dinner/i));
    });
    expect(screen.getByText("2 serving(s)")).toBeInTheDocument();

    // Verify nutrition calculations reflect different servings
    const proteinFood = MOCK_FOODS.proteins[0];

    // Check lunch calories (1 serving)
    await act(async () => {
      fireEvent.click(screen.getByText(/lunch/i));
    });
    expect(
      screen.getByText(`${proteinFood.calories} / 400 cal`)
    ).toBeInTheDocument();

    // Check dinner calories (2 servings)
    await act(async () => {
      fireEvent.click(screen.getByText(/dinner/i));
    });
    expect(
      screen.getByText(`${proteinFood.calories * 2} / 400 cal`)
    ).toBeInTheDocument();
  });
});
