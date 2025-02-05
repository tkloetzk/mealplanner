import { render, screen, fireEvent } from "@testing-library/react";
import { NutritionSummary } from "../NutritionSummary";
import { useMealStore } from "@/store/useMealStore";
import { MealType, DayType } from "@/types/meals";
import { ServingSizeUnit } from "@/types/food";

describe("NutritionSummary Integration", () => {
  const defaultProps = {
    selectedMeal: "breakfast" as MealType,
  };

  beforeEach(() => {
    // Initialize the store with some test data
    const store = useMealStore.getState();
    store.initializeKids([{ id: "1", name: "Test Kid" }]);
    store.setSelectedKid("1");
    store.setSelectedDay("monday");
    store.setSelectedMeal("breakfast");
  });

  afterEach(() => {
    // Reset the store state
    const store = useMealStore.getState();
    store.selections = {};
    store.selectedKid = "";
    store.selectedDay = "monday" as DayType;
    store.selectedMeal = "breakfast" as MealType;
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

  it("integrates with real store and displays nutrition information", () => {
    // Set up some meal selections in the store
    const store = useMealStore.getState();
    store.handleFoodSelect("proteins", testFood);

    render(<NutritionSummary {...defaultProps} />);

    // Verify the actual nutrition values from the store are displayed
    expect(screen.getByText(/200/)).toBeInTheDocument(); // Calories
    expect(screen.getByText(/25\.0g/)).toBeInTheDocument(); // Protein
    expect(screen.getByText(/0\.0g/)).toBeInTheDocument(); // Carbs
    expect(screen.getByText(/12\.0g/)).toBeInTheDocument(); // Fat
  });

  it("updates display when food selections change", () => {
    const store = useMealStore.getState();

    // Render with initial state
    const { rerender } = render(<NutritionSummary {...defaultProps} />);

    // Initial state should show zeros
    expect(screen.getByTestId("calories-value")).toHaveTextContent(
      "0 / 400 cal"
    );

    // Add a food item
    store.handleFoodSelect("proteins", testFood);

    // Force a re-render since we're testing a store update
    rerender(<NutritionSummary {...defaultProps} />);

    // Verify the display updates with new values using test ids
    expect(screen.getByTestId("calories-value")).toHaveTextContent(
      /200 \/ \d+ cal/
    );
    expect(screen.getByTestId("nutrient-protein")).toHaveTextContent(/25\.0g/);
  });

  it("calculates and displays daily totals correctly", () => {
    const store = useMealStore.getState();

    // Add food to breakfast
    store.handleFoodSelect("proteins", testFood);

    // Add food to lunch
    store.setSelectedMeal("lunch");
    store.handleFoodSelect("proteins", testFish);

    render(<NutritionSummary selectedMeal="breakfast" />);

    // Switch to daily view
    fireEvent.click(screen.getByTestId("nutrition-summary"));

    // Verify daily totals (breakfast + lunch)
    expect(screen.getByText(/350/)).toBeInTheDocument(); // Total calories
    expect(screen.getByText(/45\.0g/)).toBeInTheDocument(); // Total protein
  });

  it("handles null selected meal gracefully", () => {
    render(<NutritionSummary selectedMeal={null} />);

    // Check calories with test id
    expect(screen.getByTestId("calories-value")).toHaveTextContent("0 / 0 cal");

    // Check macronutrients with specific test ids
    expect(screen.getByTestId("nutrient-protein")).toHaveTextContent("0.0g");
    expect(screen.getByTestId("nutrient-carbs")).toHaveTextContent("0.0g");
    expect(screen.getByTestId("nutrient-fat")).toHaveTextContent("0.0g");
  });

  it("displays correct progress bar colors based on nutrition values", () => {
    const store = useMealStore.getState();

    // Add excessive calories
    const highCalorieFood = {
      ...testFood,
      calories: 1000,
      adjustedCalories: 1000,
    };

    store.handleFoodSelect("proteins", highCalorieFood);

    render(<NutritionSummary {...defaultProps} />);

    const progressBar = screen.getByTestId("calories-progress");
    expect(progressBar).toHaveClass("bg-red-500");
  });

  it("updates nutrition display when servings are adjusted", () => {
    const store = useMealStore.getState();
    store.handleFoodSelect("proteins", testFood);

    const { rerender } = render(<NutritionSummary {...defaultProps} />);

    // Initial values
    expect(screen.getByTestId("calories-value")).toHaveTextContent(
      "200 / 400 cal"
    );
    expect(screen.getByTestId("nutrient-protein")).toHaveTextContent("25.0g");

    // Adjust servings
    store.handleServingAdjustment("proteins", "1", 2);

    // Force a re-render since we're testing a store update
    rerender(<NutritionSummary {...defaultProps} />);

    // Verify updated values
    expect(screen.getByTestId("calories-value")).toHaveTextContent(
      "400 / 400 cal"
    );
    expect(screen.getByTestId("nutrient-protein")).toHaveTextContent("50.0g");
  });

  it("maintains state when switching between meal and daily views", () => {
    const store = useMealStore.getState();
    store.handleFoodSelect("proteins", testFood);

    render(<NutritionSummary {...defaultProps} />);

    // Initial meal view
    expect(screen.getByText(/200/)).toBeInTheDocument();

    // Switch to daily view
    fireEvent.click(screen.getByTestId("nutrition-summary"));
    expect(screen.getByText(/200/)).toBeInTheDocument();

    // Switch back to meal view
    fireEvent.click(screen.getByTestId("nutrition-summary"));
    expect(screen.getByText(/200/)).toBeInTheDocument();
  });

  it("displays warning colors for nutrients below minimum", () => {
    const store = useMealStore.getState();
    const lowProteinFood = {
      ...testFood,
      protein: 5,
      adjustedProtein: 5,
    };

    store.handleFoodSelect("proteins", lowProteinFood);

    render(<NutritionSummary {...defaultProps} />);

    // Find the protein value within the nutrient card
    const proteinCard = screen.getByTestId("nutrient-protein");
    const proteinValue = proteinCard.querySelector(".text-lg.font-bold");
    expect(proteinValue).toHaveClass("text-yellow-600");
  });
});
