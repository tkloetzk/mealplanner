// src/components/__tests__/KidsViewIntegration.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FRUITS, MOCK_FOODS, PROTEINS } from "@/__mocks__/testConstants";
import { CategoryType } from "@/types/food";
import { act } from "react";
import { BREAKFAST, MEAL_TYPES } from "@/constants";
import { MealPlanner } from "../meals/MealPlanner";
import userEvent from "@testing-library/user-event";

describe("Kids View Integration Tests", () => {
  // Mock data setup for consistent testing
  const mockFoodData = {
    proteins: MOCK_FOODS.proteins,
    fruits: MOCK_FOODS.fruits,
    vegetables: MOCK_FOODS.vegetables,
    grains: [],
    milk: [],
  };

  // Helper function to render and setup initial state
  const setupKidsView = async () => {
    const result = render(<MealPlanner />);

    // Wait for initial component load
    await waitFor(() => {
      expect(screen.getByText("Meal Planner")).toBeInTheDocument();
    });

    // Toggle to kid's view
    const viewToggle = screen.getByRole("switch", { name: /Parent's View/i });
    await userEvent.click(viewToggle);

    return result;
  };

  // Helper function to select a kid
  const selectKid = async (kidName: string) => {
    const kidButton = screen.getByText(kidName);
    await act(async () => {
      fireEvent.click(kidButton);
    });
    return kidButton;
  };

  // Helper function to select a meal
  const selectMeal = async (meal: string) => {
    const mealButton = screen.getByText(meal);
    await act(async () => {
      fireEvent.click(mealButton);
    });
    return mealButton;
  };

  // Helper function to select a food item
  const selectFood = async (
    category: CategoryType,
    index: number,
    meal = MEAL_TYPES[0]
  ) => {
    const foodElement = screen.getByTestId(`${category}-${meal}-${index}`);

    await userEvent.click(foodElement);

    // Verify that the food element has the expected class for selection
    expect(foodElement).toHaveClass("ring-2 ring-green-500");
    // Verify that the food name is displayed correctly
    const foodName = foodElement.querySelector("h3");
    expect(foodName).toBeInTheDocument();
    expect(foodName).toHaveTextContent(MOCK_FOODS[category][index].name);

    return foodElement;
  };

  it("displays appropriate food categories after meal selection", async () => {
    await setupKidsView();
    await selectKid("Presley");
    //  await selectMeal(BREAKFAST);

    // Instead of checking for emojis directly, look for the category headers
    // that contain both the emoji and category name
    expect(screen.getByText(/Choose your fruits/i)).toBeInTheDocument();
    expect(screen.getByText(/Choose your proteins/i)).toBeInTheDocument();
    // expect(screen.getByText(/Choose your vegetables/i)).toBeInTheDocument();

    // If we specifically need to test the emoji presence, we can use a more precise selector
    // by finding them within their category headers
    const fruitCategory = screen
      .getByText(/Choose your fruits/i)
      .closest("div");
    const proteinCategory = screen
      .getByText(/Choose your proteins/i)
      .closest("div");
    // const vegetableCategory = screen
    //   .getByText(/Choose your vegetables/i)
    //   .closest("div");

    // Now we can check for emojis within their specific category contexts
    expect(fruitCategory).toHaveTextContent("🍎");
    expect(proteinCategory).toHaveTextContent("🥚");
    // expect(vegetableCategory).toHaveTextContent("🥕");
  });

  it("handles food selection and visual feedback", async () => {
    await setupKidsView();
    await selectKid("Presley");
    // await selectMeal(BREAKFAST);

    // Select a food item
    //const proteinFood = MOCK_FOODS.proteins[0];
    await selectFood(PROTEINS, 0, MEAL_TYPES[0]);

    // Verify checkmark appears
    // expect(selectedFoodCard.closest("svg")).toHaveClass("lucide-check");
  });

  it("maintains selections when toggling between parent and kid views", async () => {
    await setupKidsView();
    await selectKid("Presley");
    // await selectMeal(BREAKFAST);

    // Make food selections
    const proteinFood = MOCK_FOODS.proteins[0];
    const fruitFood = MOCK_FOODS.fruits[0];
    await selectFood(PROTEINS, 0, MEAL_TYPES[0]);
    await selectFood(FRUITS, 0, MEAL_TYPES[0]);

    // Toggle back to parent view
    const viewToggle = screen.getByRole("switch", { name: /Kid's View/i });
    await userEvent.click(viewToggle);

    // Verify selections are maintained
    expect(screen.getByText(proteinFood.name)).toBeInTheDocument();
    expect(screen.getByText(fruitFood.name)).toBeInTheDocument();

    // Verify nutrition information is correct
    const expectedCalories = proteinFood.calories + fruitFood.calories;
    expect(
      screen.getByText(`${expectedCalories} / 400 cal`)
    ).toBeInTheDocument();
  });

  it("properly filters foods based on meal compatibility", async () => {
    await setupKidsView();
    await selectKid("Presley");

    // Check breakfast-compatible foods
    await selectMeal(BREAKFAST);
    const breakfastFoods = mockFoodData.proteins.filter((food) =>
      food.meal.includes(BREAKFAST)
    );

    breakfastFoods.forEach((food) => {
      expect(screen.getByText(food.name)).toBeInTheDocument();
    });
  });
});
