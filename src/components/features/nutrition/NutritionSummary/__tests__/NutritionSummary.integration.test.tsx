import { render, screen, fireEvent } from "@testing-library/react";
import { NutritionSummary } from "../NutritionSummary";
import { useMealStore } from "@/store/useMealStore";
import { MealType } from "@/types/meals";
import { ServingSizeUnit } from "@/types/food";

// Mock fetch globally since it's an external dependency
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([]),
  })
) as jest.Mock;

describe("NutritionSummary Integration", () => {
  const defaultProps = {
    selectedMeal: "breakfast" as MealType,
  };

  beforeEach(() => {
    // Clear fetch mock
    (global.fetch as jest.Mock).mockClear();

    // Reset store to initial state
    const store = useMealStore.getState();
    store.initializeKids([]);
  });

  afterEach(() => {
    // Reset store to initial state
    const store = useMealStore.getState();
    store.initializeKids([]);
    jest.clearAllMocks();
  });

  const testFood = {
    id: "1",
    name: "Chicken",
    calories: 200,
    protein: 25,
    carbs: 0,
    fat: 12,
    category: "proteins",
    servings: 1,
    meal: ["breakfast", "lunch", "dinner"] as MealType[],
    servingSize: "1",
    servingSizeUnit: "piece" as ServingSizeUnit,
    hiddenFromChild: false,
    adjustedCalories: 200,
    adjustedProtein: 25,
    adjustedCarbs: 0,
    adjustedFat: 12,
  };

  const testFish = {
    id: "2",
    name: "Fish",
    calories: 150,
    protein: 20,
    carbs: 0,
    fat: 8,
    category: "proteins",
    servings: 1,
    meal: ["breakfast", "lunch", "dinner"] as MealType[],
    servingSize: "1",
    servingSizeUnit: "piece" as ServingSizeUnit,
    hiddenFromChild: false,
    adjustedCalories: 150,
    adjustedProtein: 20,
    adjustedCarbs: 0,
    adjustedFat: 8,
  };

  it("handles complete daily meal planning", async () => {
    const store = useMealStore.getState();

    // Initialize store with a kid
    store.initializeKids([{ id: "1", name: "Test Kid" }]);
    store.setSelectedKid("1");
    store.setSelectedDay("monday");

    const { rerender } = render(<NutritionSummary {...defaultProps} />);

    // Plan breakfast
    store.setSelectedMeal("breakfast");
    await store.handleFoodSelect("proteins", testFood); // 200 calories
    await store.handleFoodSelect("grains", {
      ...testFood,
      id: "3",
      category: "grains",
      calories: 150,
      protein: 5,
      adjustedCalories: 150,
      adjustedProtein: 5,
    }); // 150 calories

    // Plan lunch
    store.setSelectedMeal("lunch");
    await store.handleFoodSelect("proteins", testFish); // 150 calories
    await store.handleFoodSelect("vegetables", {
      ...testFood,
      id: "4",
      category: "vegetables",
      calories: 50,
      protein: 2,
      adjustedCalories: 50,
      adjustedProtein: 2,
    }); // 50 calories

    // Plan dinner
    store.setSelectedMeal("dinner");
    await store.handleFoodSelect("proteins", testFood); // 200 calories

    rerender(<NutritionSummary {...defaultProps} />);

    // Check daily totals
    fireEvent.click(screen.getByTestId("nutrition-summary"));

    // Should show combined calories from all meals (350 + 200 + 200 = 750)
    expect(screen.getByTestId("calories-value")).toHaveTextContent(
      "750 / 1400 cal"
    );
  });

  it("updates nutrition display when servings are adjusted", async () => {
    const store = useMealStore.getState();

    // Initialize store with a kid
    store.initializeKids([{ id: "1", name: "Test Kid" }]);
    store.setSelectedKid("1");
    store.setSelectedDay("monday");
    store.setSelectedMeal("breakfast");

    const { rerender } = render(<NutritionSummary {...defaultProps} />);

    // Add food and verify initial values
    await store.handleFoodSelect("proteins", testFood);
    expect(screen.getByTestId("calories-value")).toHaveTextContent(
      "350 / 400 cal"
    );

    // Adjust servings
    await store.handleServingAdjustment("proteins", testFood.id, 2);
    rerender(<NutritionSummary {...defaultProps} />);

    // Verify updated values
    expect(screen.getByTestId("calories-value")).toHaveTextContent(
      "150 / 400 cal"
    );
  });

  it("handles null selected meal gracefully", () => {
    const store = useMealStore.getState();

    // Initialize store with a kid but don't select a meal
    store.initializeKids([{ id: "1", name: "Test Kid" }]);
    store.setSelectedKid("1");
    store.setSelectedDay("monday");

    render(<NutritionSummary selectedMeal={null} />);

    // Check calories with test id
    expect(screen.getByTestId("calories-value")).toHaveTextContent("0 / 0 cal");
  });

  // Add more integration tests as needed...
});
