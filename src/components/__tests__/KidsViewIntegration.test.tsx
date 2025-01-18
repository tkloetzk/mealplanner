// src/components/__tests__/KidsViewIntegration.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MealPlanner } from "../MealPlanner";
import {
  BREAKFAST,
  FRUITS,
  MOCK_FOODS,
  PROTEINS,
} from "@/constants/tests/testConstants";
import { DAILY_GOALS } from "@/constants/meal-goals";
import { CategoryType, Food } from "@/types/food";

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
    fireEvent.click(viewToggle);

    return result;
  };

  // Helper function to select a kid
  const selectKid = async (kidName: string) => {
    const kidButton = screen.getByText(kidName);
    fireEvent.click(kidButton);
    return kidButton;
  };

  // Helper function to select a meal
  const selectMeal = async (mealName: string) => {
    const mealButton = screen.getByText(new RegExp(`^${mealName}$`, "i"));
    fireEvent.click(mealButton);
    return mealButton;
  };

  // Helper function to select a food item
  const selectFood = async (category: CategoryType, food: Food) => {
    const foodCard = screen.getByText(food.name);
    fireEvent.click(foodCard);
    return foodCard;
  };

  beforeEach(() => {
    // Reset DOM and mocks before each test
    document.body.innerHTML = "";
    localStorage.clear();

    // Setup fetch mock
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockFoodData),
      })
    ) as jest.Mock;
  });

  afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it.skip("shows initial meal selection interface in kid's view", async () => {
    await setupKidsView();
    await selectKid("Presley");

    // Verify kid-friendly meal selection interface is shown
    // expect(screen.getByText("What are you eating?")).toBeInTheDocument();

    // Verify all meal options are present
    [BREAKFAST, "Lunch", "Dinner", "Snack"].forEach((meal) => {
      expect(
        screen.getByText(new RegExp(`^${meal}$`, "i"))
      ).toBeInTheDocument();
    });
  });

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
    const proteinFood = MOCK_FOODS.proteins[0];
    await selectFood(PROTEINS, proteinFood);

    // Verify selection is visually indicated
    const selectedFoodCard = screen
      .getByText(proteinFood.name)
      .closest(".bg-card ");
    expect(selectedFoodCard).toHaveClass("ring-2");
    expect(selectedFoodCard).toHaveClass("ring-green-500");

    // Verify checkmark appears
    expect(screen.getByTestId("checkmark-icon")).toBeInTheDocument();
  });

  it("maintains selections when toggling between parent and kid views", async () => {
    await setupKidsView();
    await selectKid("Presley");
    // await selectMeal(BREAKFAST);

    // Make food selections
    const proteinFood = MOCK_FOODS.proteins[0];
    const fruitFood = MOCK_FOODS.fruits[0];

    await selectFood(PROTEINS, proteinFood);
    await selectFood(FRUITS, fruitFood);

    // Toggle back to parent view
    const viewToggle = screen.getByRole("switch", { name: /Kid's View/i });
    fireEvent.click(viewToggle);

    // Verify selections are maintained
    expect(screen.getByText(proteinFood.name)).toBeInTheDocument();
    expect(screen.getByText(fruitFood.name)).toBeInTheDocument();

    // Verify nutrition information is correct
    const expectedCalories = proteinFood.calories + fruitFood.calories;
    expect(
      screen.getByText(`${expectedCalories} / 400 cal`)
    ).toBeInTheDocument();
  });

  it.skip("handles multiple meal type changes correctly", async () => {
    await setupKidsView();
    await selectKid("Presley");

    // Test breakfast selections
    await selectMeal(BREAKFAST);
    await selectFood(PROTEINS, MOCK_FOODS.proteins[0]);

    // Switch to lunch and make selections
    await selectMeal("Lunch");
    await selectFood(FRUITS, MOCK_FOODS.fruits[0]);

    // Verify each meal maintains its selections independently
    await selectMeal(BREAKFAST);
    expect(screen.getByText(MOCK_FOODS.proteins[0].name)).toBeInTheDocument();

    await selectMeal("Lunch");
    expect(screen.getByText(MOCK_FOODS.fruits[0].name)).toBeInTheDocument();
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

    // // Check snack-compatible foods
    // await selectMeal("Snack");
    // const snackFoods = mockFoodData.proteins.filter((food) =>
    //   food.meal.includes("snack")
    // );

    // snackFoods.forEach((food) => {
    //   expect(screen.getByText(food.name)).toBeInTheDocument();
    // });
  });
});
