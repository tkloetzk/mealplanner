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
import userEvent from "@testing-library/user-event";

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
  await userEvent.click(mealButton);
  expect(mealButton).toHaveClass("bg-blue-500 text-white");
  return mealButton;
};
const selectFood = async (
  category: CategoryType,
  index: number,
  meal = MEAL_TYPES[0]
) => {
  const foodElement = screen.getByTestId(`${category}-${meal}-${index}`);

  await userEvent.click(foodElement);
  expect(foodElement).toHaveClass("ring-2 ring-blue-500 bg-blue-100");

  // Verify that the "Edit Food" icon is now visible
  expect(screen.getByTestId("edit-food-icon")).toBeInTheDocument();

  // Verify that the "Adjust Servings" control is visible.
  // Depending on your implementation, you could use test id or accessible title.
  expect(screen.getByTitle("Adjust Servings")).toBeInTheDocument();

  return foodElement;
};
const deselectFood = async (
  category: CategoryType,
  index: number,
  meal = MEAL_TYPES[0]
) => {
  const foodElement = screen.getByTestId(`${category}-${meal}-${index}`);
  await userEvent.click(foodElement);
  expect(foodElement).not.toHaveClass("ring-2 ring-blue-500 bg-blue-100");
  expect(screen.queryByTestId("edit-food-icon")).not.toBeInTheDocument();
  expect(screen.queryByTestId("adjust-servings-icon")).not.toBeInTheDocument();
  return foodElement;
};
describe("MealPlanner Integration Tests", () => {
  // Reusable render function with common setup

  // Helper functions to make tests more readable and maintainable

  const toggleSwitch = async (name: RegExp) => {
    const switchElement = screen.getByRole("switch", { name });
    await userEvent.click(switchElement);
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

    await selectMeal(MEAL_TYPES[0]);
    const proteinFood = MOCK_FOODS.proteins[0];
    // Ensure the food is selected and rendered correctly
    const foodElement = screen.getByTestId(
      `${proteinFood.category}-${MEAL_TYPES[0]}-0`
    );
    // Ensure this matches the test ID format

    // Verify initial unselected state
    expect(screen.queryByTitle("Edit Food")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Adjust Servings")).not.toBeInTheDocument();
    expect(foodElement).not.toHaveClass("ring-2");

    // // Select food and verify selection state
    const selectedFoodCard = await selectFood(
      proteinFood.category,
      0,
      MEAL_TYPES[0]
    );
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
    await deselectFood(proteinFood.category, 0);
    expect(screen.queryByTitle("Edit Food")).not.toBeInTheDocument();
    expect(selectedFoodCard).not.toHaveClass("ring-2");
  });

  it("handles serving size adjustments correctly", async () => {
    await renderMealPlanner();

    await selectMeal(MEAL_TYPES[0]);
    // Select a protein food
    const proteinFood = MOCK_FOODS.proteins[0];

    await selectFood(proteinFood.category, 0);
    // Open serving selector
    const servingsButton = screen.getByTitle("Adjust Servings");
    await userEvent.click(servingsButton);

    // Find serving input
    const servingInput = screen.getByTestId("custom-serving-input");
    const initialServingSize = parseFloat(proteinFood.servingSize);

    // Verify initial serving size
    expect(servingInput).toHaveValue(initialServingSize);

    // Increment serving
    const incrementButton = screen.getByTestId("increment-serving");
    await userEvent.click(incrementButton);

    // Verify incremented serving size
    expect(servingInput).toHaveValue(initialServingSize + 0.25);

    // Confirm serving change
    const confirmButton = screen.getByRole("button", { name: /confirm/i });
    await userEvent.click(confirmButton);

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
    // Use userEvent instead of fireEvent to simulate more realistic interaction
    await act(async () => {
      await userEvent.click(historyTab);
    });

    // Wait for the tab to become active
    await waitFor(() => {
      expect(historyTab).toHaveAttribute("data-state", "active");
    });

    // Verify the meal history entry appears
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

    await selectMeal(MEAL_TYPES[1]);
    await selectFood(MOCK_FOODS.condiments[0].category, 0, MEAL_TYPES[1]);
    await waitFor(() => {
      expect(
        screen.getByText(
          `1 serving(s) • ${MOCK_FOODS.condiments[0].calories} cal total`
        )
      ).toBeInTheDocument();
    });

    const servingButton = screen.getByTitle("Adjust Servings");
    await userEvent.click(servingButton);
    await userEvent.click(screen.getByTestId("increment-serving"));
    await userEvent.click(screen.getByTestId("increment-serving"));

    const confirmButton = screen.getByRole("button", { name: /confirm/i });
    await userEvent.click(confirmButton);

    await waitFor(() => {
      expect(
        screen.getByText(
          `1.5 serving(s) • ${(MOCK_FOODS.condiments[0].calories * 1.5).toFixed(
            0
          )} cal total`
        )
      ).toBeInTheDocument();
    });
  });
});

describe("Meal History Management", () => {
  it("saves meal history correctly when meals are selected", async () => {
    // Mock fetch to track API calls and return history data
    const mockFetch = jest.fn().mockImplementation((url) => {
      if (url.includes("/api/meal-history")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              {
                _id: "test-id",
                kidId: "1",
                date: new Date().toISOString(),
                meal: "lunch",
                selections: {
                  proteins: {
                    ...MOCK_FOODS.proteins[0],
                    servings: 1,
                    adjustedCalories: MOCK_FOODS.proteins[0].calories,
                    adjustedProtein: MOCK_FOODS.proteins[0].protein,
                    adjustedCarbs: MOCK_FOODS.proteins[0].carbs,
                    adjustedFat: MOCK_FOODS.proteins[0].fat,
                  },
                  fruits: null,
                  vegetables: null,
                  grains: null,
                  milk: null,
                  ranch: null,
                  condiments: [],
                },
              },
            ]),
        });
      }
      // Return mock food data for other requests
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(MOCK_FOODS),
      });
    });

    global.fetch = mockFetch;

    await renderMealPlanner();

    // Select lunch and add food
    await selectMeal(MEAL_TYPES[1]); // Lunch
    const proteinFood = MOCK_FOODS.proteins[0];
    await selectFood(proteinFood.category, 0, MEAL_TYPES[1]);

    // Allow time for debounce
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 600));
    });

    // Find all POST requests to meal-history
    const mealHistoryPosts = mockFetch.mock.calls.filter(
      ([url, options]) =>
        url.includes("/api/meal-history") && options?.method === "POST"
    );

    // Should have one POST call for the lunch selection
    expect(mealHistoryPosts).toHaveLength(1);

    // Verify the meal history data
    const savedMealData = JSON.parse(mealHistoryPosts[0][1].body);
    expect(savedMealData.kidId).toBe("1");
    expect(savedMealData.mealData.meal).toBe("lunch");
    expect(savedMealData.mealData.selections.proteins.name).toBe(
      proteinFood.name
    );

    // Switch to history tab and verify UI
    const historyTab = screen.getByRole("tab", { name: /history/i });
    await userEvent.click(historyTab);

    // Wait for history data to load and render
    await waitFor(() => {
      expect(screen.getByText(proteinFood.name)).toBeInTheDocument();
    });
  });

  it("does not trigger history updates when all foods are deselected", async () => {
    const mockFetch = jest.fn().mockImplementation((url) => {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve(url.includes("/api/meal-history") ? [] : MOCK_FOODS),
      });
    });
    global.fetch = mockFetch;

    await renderMealPlanner();

    // Select kid
    await act(async () => {
      fireEvent.click(screen.getByText("Presley"));
    });

    // Select lunch and add food
    await selectMeal(MEAL_TYPES[1]); // Lunch
    const proteinFood = MOCK_FOODS.proteins[0];
    await selectFood(proteinFood.category, 0, MEAL_TYPES[1]);

    // Wait for initial selection API call
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 600));
    });

    // Clear mock to focus on deselection calls
    mockFetch.mockClear();

    // Deselect the only food
    await deselectFood(proteinFood.category, 0, MEAL_TYPES[1]);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 600));
    });

    // Verify no history updates were made
    const historyPosts = mockFetch.mock.calls.filter(
      ([url, options]) =>
        url.includes("/api/meal-history") && options?.method === "POST"
    );

    expect(historyPosts.length).toBe(0);

    // Double check that the food is actually deselected in the UI
    const deselectedElement = screen.getByTestId(`proteins-${MEAL_TYPES[1]}-0`);
    expect(deselectedElement).not.toHaveClass("ring-2 ring-blue-500");
  });

  it("displays meal history correctly after selections", async () => {
    await renderMealPlanner();

    // Select kid
    const kidSelector = screen.getByText("Presley");
    await act(async () => {
      fireEvent.click(kidSelector);
    });

    // Select lunch and add food
    await selectMeal(MEAL_TYPES[1]); // Lunch
    const proteinFood = MOCK_FOODS.proteins[0];
    await selectFood(proteinFood.category, 0, MEAL_TYPES[1]);

    // Verify the meal history entry
    const historyTab = screen.getByRole("tab", { name: /history/i });
    userEvent.click(historyTab);

    await waitFor(() => {
      expect(screen.getByText(proteinFood.name)).toBeInTheDocument();
    });
  });
});
describe("Meal Selection Isolation", () => {
  it("maintains unique food selection states between meals", async () => {
    await renderMealPlanner();

    // Select protein in lunch
    await selectMeal(MEAL_TYPES[1]);
    await selectFood("proteins", 0, MEAL_TYPES[1]);

    // Verify protein is selected in lunch
    const selectedProtein = screen.getByTestId("proteins-lunch-0");
    expect(selectedProtein).toHaveClass("ring-2 ring-blue-500");
    expect(selectedProtein.closest("div")).toHaveClass("bg-blue-100");

    // Switch to dinner and verify protein is NOT selected there
    await userEvent.click(screen.getByTestId("dinner-meal-button"));

    // The same protein should not be selected in dinner
    const dinnerProtein = screen.getByTestId("proteins-dinner-0");
    expect(dinnerProtein).not.toHaveClass("ring-2 ring-blue-500");
    expect(dinnerProtein.closest("div")).not.toHaveClass("bg-blue-100");

    // Switch back to lunch and verify protein is still selected
    await userEvent.click(screen.getByTestId("lunch-meal-button"));

    const lunchProtein = screen.getByTestId("proteins-lunch-0");
    expect(lunchProtein).toHaveClass("ring-2 ring-blue-500");
    expect(lunchProtein.closest("div")).toHaveClass("bg-blue-100");
  });

  it("handles deselection independently between meals", async () => {
    await renderMealPlanner();

    // 1. Select foods in both lunch and dinner
    // Select in lunch first
    await selectMeal(MEAL_TYPES[1]);
    await selectFood(MOCK_FOODS.proteins[0].category, 0, MEAL_TYPES[1]);

    // Select in dinner
    await selectMeal(MEAL_TYPES[2]);
    await selectFood(MOCK_FOODS.vegetables[0].category, 0, MEAL_TYPES[2]);

    // 2. Deselect protein in lunch
    await selectMeal(MEAL_TYPES[1]);
    await deselectFood(MOCK_FOODS.proteins[0].category, 0, MEAL_TYPES[1]);

    expect(screen.getByTestId(`proteins-lunch-0`)).not.toHaveClass(
      "ring-2 ring-blue-500"
    );

    // 3. Verify dinner selection remains unchanged
    await selectMeal(MEAL_TYPES[2]);
    expect(screen.getByTestId(`vegetables-dinner-0`)).toHaveClass(
      "ring-2 ring-blue-500"
    );

    // 4. Verify lunch protein was deselected
    await selectMeal(MEAL_TYPES[1]);
    expect(screen.getByTestId(`proteins-lunch-0`)).not.toHaveClass(
      "ring-2 ring-blue-500"
    );
  });

  it("maintains meal-specific serving adjustments", async () => {
    await renderMealPlanner();

    // 1. Select same protein in both lunch and dinner with different servings
    // Lunch: 1 serving
    await selectMeal(MEAL_TYPES[1]);
    await selectFood("proteins", 0, MEAL_TYPES[1]);

    // Dinner: 2 servings
    await selectMeal(MEAL_TYPES[2]);
    await selectFood("proteins", 0, MEAL_TYPES[2]);

    // Adjust dinner serving to 2
    const servingButton = screen.getByTitle("Adjust Servings");
    await userEvent.click(servingButton);
    await userEvent.click(screen.getByTestId("increment-serving"));

    const confirmButton = screen.getByRole("button", { name: /confirm/i });
    await userEvent.click(confirmButton);

    // Verify lunch still has 1 serving
    await selectMeal(MEAL_TYPES[1]);
    await waitFor(() => {
      expect(
        screen.getByText(
          `1 serving(s) • ${MOCK_FOODS.proteins[0].calories} cal total`
        )
      ).toBeInTheDocument();
    });
    // Verify dinner has 1.25 servings
    await selectMeal(MEAL_TYPES[2]);

    expect(
      screen.getByText(
        `1.25 serving(s) • ${(MOCK_FOODS.proteins[0].calories * 1.25).toFixed(
          0
        )} cal total`
      )
    ).toBeInTheDocument();

    // Verify nutrition calculations reflect different servings
    const proteinFood = MOCK_FOODS.proteins[0];

    // Check lunch calories (1 serving)
    await selectMeal(MEAL_TYPES[1]);
    expect(
      screen.getByText(`1 serving(s) • ${proteinFood.calories} cal total`)
    ).toBeInTheDocument();

    // Check dinner calories (2 servings)
    await selectMeal(MEAL_TYPES[2]);
    expect(
      screen.getByText(
        `1.25 serving(s) • ${(MOCK_FOODS.proteins[0].calories * 1.25).toFixed(
          0
        )} cal total`
      )
    ).toBeInTheDocument();
  });
});
