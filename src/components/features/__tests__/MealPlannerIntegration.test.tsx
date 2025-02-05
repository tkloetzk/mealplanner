// src/components/__tests__/MealPlannerIntegration.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import { MOCK_FOODS } from "@/__mocks__/testConstants";
import { MILK_OPTION, DAILY_GOALS } from "@/constants/meal-goals";
import { MealPlanner } from "../meals/MealPlanner";
import { CategoryType } from "@/types/food";
import { MealType } from "@/types/meals";
import userEvent from "@testing-library/user-event";
import { MEAL_TYPES } from "@/constants";
import { useMealStore } from "@/store/useMealStore";

describe("MealPlanner Integration Tests", () => {
  // Add user setup
  const user = userEvent.setup();

  // Reset store state before each test
  beforeEach(() => {
    const { initializeKids } = useMealStore.getState();
    useMealStore.setState({
      selections: {},
      selectedKid: "1",
      selectedDay: "monday",
      selectedMeal: "breakfast",
      mealHistory: {},
    });
    initializeKids([
      { id: "1", name: "Presley" },
      { id: "2", name: "Evy" },
    ]);
  });

  // Test helper functions
  const renderMealPlanner = async () => {
    const result = render(<MealPlanner />);
    await waitFor(() => {
      const element = screen.getByTestId("meal-planner");
      expect(element).toBeInTheDocument();
    });
    return result;
  };

  const selectMeal = async (meal: MealType = "breakfast") => {
    const mealButton = screen.getByTestId(`${meal}-meal-button`);
    await user.click(mealButton);

    expect(mealButton.className).toContain("bg-blue-500");
    expect(mealButton.className).toContain("text-white");

    return mealButton;
  };

  const selectFood = async (
    category: CategoryType,
    index: number,
    meal: MealType
  ) => {
    // Wait for the meal type to be selected and visible
    await waitFor(() => {
      expect(screen.getByTestId(`${meal}-meal-button`)).toHaveClass(
        "bg-blue-500"
      );
    });

    const testId = `${category}-${meal}-${index}`;
    const foodElement = screen.getByTestId(testId);
    await user.click(foodElement);

    await waitFor(() => {
      expect(foodElement).toHaveClass("ring-2");
      expect(foodElement).toHaveClass("ring-blue-500");
      expect(foodElement).toHaveClass("bg-blue-100");
      expect(screen.getByTestId("edit-food-icon")).toBeInTheDocument();
      expect(screen.getByTitle("Adjust Servings")).toBeInTheDocument();
    });

    return foodElement;
  };

  const deselectFood = async (
    category: CategoryType,
    index: number,
    meal: MealType
  ) => {
    const foodElement = screen.getByTestId(`${category}-${meal}-${index}`);
    await user.click(foodElement);

    await waitFor(() => {
      expect(foodElement).not.toHaveClass("ring-2");
      expect(foodElement).not.toHaveClass("ring-blue-500");
      expect(foodElement).not.toHaveClass("bg-blue-100");
      expect(screen.queryByTestId("edit-food-icon")).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("adjust-servings-icon")
      ).not.toBeInTheDocument();
    });

    return foodElement;
  };

  const toggleSwitch = async (name: RegExp) => {
    const switchElement = screen.getByRole("switch", { name });
    await user.click(switchElement);
    return switchElement;
  };

  // Basic functionality tests
  it("handles view toggling and meal selection persistence", async () => {
    await renderMealPlanner();
    console.log("MealPlanner rendered");

    // Check initial load
    expect(screen.getByTestId("meal-planner")).toBeInTheDocument();

    // Toggle to child view
    const viewToggle = screen.getByRole("switch", { name: /Parent's View/i });
    await user.click(viewToggle);
    console.log("Clicked view toggle to child view");

    // Verify child view elements
    await waitFor(() => {
      expect(screen.getByText(/Choose your proteins/i)).toBeInTheDocument();
      expect(screen.getByText(/Choose your fruits/i)).toBeInTheDocument();
    });

    // Toggle back to parent view and verify
    await user.click(viewToggle);
    await waitFor(() => {
      expect(screen.getByTestId("meal-planner")).toBeInTheDocument();
    });

    // Test meal selection persistence across views
    console.log("Testing meal selection with:", MEAL_TYPES[1]);
    await selectMeal(MEAL_TYPES[1]);
    await user.click(viewToggle);
    await waitFor(() => {
      expect(screen.getByText(/Lunch/i)).toBeInTheDocument();
    });
  });

  it("handles food selection with visual feedback and nutrition updates", async () => {
    await renderMealPlanner();

    await selectMeal("breakfast" as MealType);
    const proteinFood = MOCK_FOODS.proteins[0];

    // Ensure the food is selected and rendered correctly
    const foodElement = screen.getByTestId(
      `${proteinFood.category}-breakfast-0`
    );

    // Verify initial unselected state
    expect(screen.queryByTitle("Edit Food")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Adjust Servings")).not.toBeInTheDocument();
    expect(foodElement).not.toHaveClass("ring-2");

    // Select food and verify selection state
    const selectedFoodCard = await selectFood(
      proteinFood.category,
      0,
      "breakfast" as MealType
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
    await deselectFood(proteinFood.category, 0, "breakfast" as MealType);
    expect(screen.queryByTitle("Edit Food")).not.toBeInTheDocument();
    expect(selectedFoodCard).not.toHaveClass("ring-2");
  });

  it("handles serving size adjustments correctly", async () => {
    await renderMealPlanner();

    await selectMeal("breakfast" as MealType);
    const proteinFood = MOCK_FOODS.proteins[0];

    await selectFood(proteinFood.category, 0, "breakfast" as MealType);

    // Open serving selector
    const servingsButton = screen.getByTitle("Adjust Servings");
    await user.click(servingsButton);

    // Find serving input
    const servingInput = screen.getByTestId("custom-serving-input");
    const initialServingSize = parseFloat(proteinFood.servingSize);

    // Verify initial serving size
    expect(servingInput).toHaveValue(initialServingSize);

    // Increment serving
    const incrementButton = screen.getByTestId("increment-serving");
    await user.click(incrementButton);

    // Verify incremented serving size
    expect(servingInput).toHaveValue(initialServingSize + 0.25);

    // Confirm serving change
    const confirmButton = screen.getByRole("button", { name: /confirm/i });
    await user.click(confirmButton);

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

    // Select breakfast meal to ensure we're on a clean slate
    await selectMeal("breakfast" as MealType);

    // Clear any existing selections by clicking them again if they're selected
    const currentSelections = screen.queryAllByTestId(
      /^(proteins|fruits|vegetables|grains)-breakfast-\d+$/
    );
    for (const selection of currentSelections) {
      if (selection.className.includes("ring-2")) {
        await user.click(selection);
      }
    }

    // Toggle milk and verify nutrition
    await toggleSwitch(/Include Milk/i);
    expect(
      screen.getByText(`${MILK_OPTION.calories} / 400 cal`)
    ).toBeInTheDocument();
  });

  it('filters out hidden "Other" category foods in child view', async () => {
    await renderMealPlanner();

    // Switch to child view
    const viewToggle = screen.getByRole("switch", { name: /Parent's View/i });
    await user.click(viewToggle);

    // Wait for the child view to update
    await waitFor(() => {
      expect(screen.getByTestId("child-view")).toBeInTheDocument();
    });

    // Check that foods are filtered
    const hiddenFood = MOCK_FOODS.other.find((f) => f.hiddenFromChild);
    const visibleFood = MOCK_FOODS.other.find((f) => !f.hiddenFromChild);

    if (hiddenFood) {
      expect(screen.queryByText(hiddenFood.name)).not.toBeInTheDocument();
    }

    if (visibleFood) {
      await waitFor(() => {
        expect(screen.getByText(visibleFood.name)).toBeInTheDocument();
      });
    }
  });

  // Meal Selection Isolation tests
  it("maintains unique food selection states between meals", async () => {
    await renderMealPlanner();

    // Select protein in lunch
    await selectMeal("lunch" as MealType);
    await selectFood(MOCK_FOODS.proteins[0].category, 0, "lunch" as MealType);

    // Verify protein is selected in lunch
    const selectedProtein = screen.getByTestId("proteins-lunch-0");
    expect(selectedProtein).toHaveClass("ring-2 ring-blue-500");
    expect(selectedProtein.closest("div")).toHaveClass("bg-blue-100");

    // Switch to dinner and verify protein is NOT selected there
    await user.click(screen.getByTestId("dinner-meal-button"));

    // The same protein should not be selected in dinner
    const dinnerProtein = screen.getByTestId("proteins-dinner-0");
    expect(dinnerProtein).not.toHaveClass("ring-2 ring-blue-500");
    expect(dinnerProtein.closest("div")).not.toHaveClass("bg-blue-100");

    // Switch back to lunch and verify protein is still selected
    await user.click(screen.getByTestId("lunch-meal-button"));

    const lunchProtein = screen.getByTestId("proteins-lunch-0");
    expect(lunchProtein).toHaveClass("ring-2 ring-blue-500");
    expect(lunchProtein.closest("div")).toHaveClass("bg-blue-100");
  });

  it("maintains meal-specific serving adjustments", async () => {
    await renderMealPlanner();

    // Select same protein in both lunch and dinner with different servings
    await selectMeal("lunch" as MealType);
    await selectFood(MOCK_FOODS.proteins[0].category, 0, "lunch" as MealType);

    // Verify initial lunch serving
    await waitFor(() => {
      expect(
        screen.getByText(
          `1 serving(s) • ${MOCK_FOODS.proteins[0].calories} cal total`
        )
      ).toBeInTheDocument();
    });

    // Select and adjust dinner serving
    await selectMeal("dinner" as MealType);
    await selectFood(MOCK_FOODS.proteins[0].category, 0, "dinner" as MealType);

    // Adjust dinner serving
    const servingButton = screen.getByTitle("Adjust Servings");
    await user.click(servingButton);
    await user.click(screen.getByTestId("increment-serving"));

    const confirmButton = screen.getByRole("button", { name: /confirm/i });
    await user.click(confirmButton);

    // Verify dinner has 1.25 servings
    await waitFor(() => {
      expect(
        screen.getByText(
          `1.25 serving(s) • ${(MOCK_FOODS.proteins[0].calories * 1.25).toFixed(
            0
          )} cal total`
        )
      ).toBeInTheDocument();
    });

    // Switch back to lunch and verify it still has 1 serving
    await selectMeal("lunch" as MealType);
    await waitFor(() => {
      expect(
        screen.getByText(
          `1 serving(s) • ${MOCK_FOODS.proteins[0].calories} cal total`
        )
      ).toBeInTheDocument();
    });

    // Switch back to dinner to verify it maintained 1.25 servings
    await selectMeal("dinner" as MealType);
    await waitFor(() => {
      expect(
        screen.getByText(
          `1.25 serving(s) • ${(MOCK_FOODS.proteins[0].calories * 1.25).toFixed(
            0
          )} cal total`
        )
      ).toBeInTheDocument();
    });
  });
});
