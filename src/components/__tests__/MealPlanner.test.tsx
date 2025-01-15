import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useMealPlanState } from "@/hooks/useMealPlanState";
import { MealPlanner } from "../MealPlanner";

// Mock the custom hook to make it testable without fetching data
jest.mock("@/hooks/useMealPlanState", () => ({
  useMealPlanState: jest.fn(() => ({
    selectedKid: "1",
    selectedDay: "monday",
    selectedMeal: "breakfast",
    selections: {
      "1": {
        monday: {
          breakfast: {},
          lunch: {},
          dinner: {},
          snack: {},
        },
      },
    },
    mealHistory: {
      "1": [],
    },
    setSelectedKid: jest.fn(),
    setSelectedDay: jest.fn(),
    setSelectedMeal: jest.fn(),
    setSelections: jest.fn(),
    handleFoodSelect: jest.fn(),
    calculateMealNutrition: jest.fn(() => ({
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    })),
    handleServingAdjustment: jest.fn(),
    calculateDailyTotals: jest.fn(() => ({ calories: 0, protein: 0, fat: 0 })),
    handleMilkToggle: jest.fn(),
    handleRanchToggle: jest.fn(),
    addToMealHistory: jest.fn(),
  })),
}));

// Mock the fetch function
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        grains: [
          {
            name: "Oatmeal",
            calories: 150,
            protein: 5,
            carbs: 25,
            fat: 2,
            category: "grains",
            servingSize: "1",
            servingSizeUnit: "cup",
            meal: ["breakfast", "snack"],
          },
        ],
        fruits: [
          {
            name: "Apple",
            calories: 80,
            protein: 1,
            carbs: 21,
            fat: 0,
            category: "fruits",
            servingSize: "1",
            servingSizeUnit: "medium",
            meal: ["breakfast", "snack"],
          },
        ],
        proteins: [
          {
            name: "Chicken",
            calories: 200,
            protein: 25,
            carbs: 0,
            fat: 10,
            category: "proteins",
            servingSize: "100",
            servingSizeUnit: "g",
            meal: ["lunch", "dinner"],
          },
        ],
        vegetables: [
          {
            name: "Broccoli",
            calories: 50,
            protein: 3,
            carbs: 10,
            fat: 0,
            category: "vegetables",
            servingSize: "1",
            servingSizeUnit: "cup",
            meal: ["lunch", "dinner"],
          },
        ],
        milk: [
          {
            name: "Milk",
            calories: 100,
            protein: 8,
            carbs: 12,
            fat: 2,
            category: "milk",
            servingSize: "1",
            servingSizeUnit: "cup",
            meal: ["breakfast", "lunch", "dinner", "snack"],
          },
        ],
      }),
  })
) as jest.Mock;

describe("MealPlanner Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.only("should render the component and its main elements", async () => {
    render(<MealPlanner />);

    // Wait for the loading state to finish
    await waitFor(() =>
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument()
    );

    // Check for main elements
    expect(
      screen.getByRole("heading", { name: /Meal Planner/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Daily Planner/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Weekly View/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /History/i })
    ).toBeInTheDocument();
    expect(screen.getByText("Presley")).toBeInTheDocument();
    expect(screen.getByText("Evy")).toBeInTheDocument();
  });

  it('should display the "Please select a kid to start planning meals" message when no kid is selected', () => {
    (useMealPlanState as jest.Mock).mockReturnValue({
      ...(useMealPlanState as jest.Mock)(),
      selectedKid: null,
    });

    render(<MealPlanner />);

    expect(
      screen.getByText("Please select a kid to start planning meals")
    ).toBeInTheDocument();
  });

  it("should display food items when a kid, day and meal is selected", async () => {
    render(<MealPlanner />);

    await waitFor(() =>
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument()
    );
    // Check if the correct elements are present before interacting with them
    expect(screen.getByText("Presley")).toBeInTheDocument();

    //Interact with elements
    fireEvent.click(screen.getByText("Presley"));
    expect(screen.getByText("monday")).toBeInTheDocument();
    fireEvent.click(screen.getByText("monday"));
    expect(screen.getByText("breakfast")).toBeInTheDocument();
    fireEvent.click(screen.getByText("breakfast"));

    // Assert content for food
    expect(screen.getByText("grains")).toBeInTheDocument();
    expect(screen.getByText("Oatmeal")).toBeInTheDocument();
    expect(screen.getByText("fruits")).toBeInTheDocument();
    expect(screen.getByText("Apple")).toBeInTheDocument();
    expect(screen.queryByText("proteins")).not.toBeInTheDocument();
    expect(screen.queryByText("vegetables")).not.toBeInTheDocument();
  });

  it("should show serving selector when serving is clicked", async () => {
    render(<MealPlanner />);

    await waitFor(() =>
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument()
    );

    fireEvent.click(screen.getByText("Presley"));
    fireEvent.click(screen.getByText("monday"));
    fireEvent.click(screen.getByText("breakfast"));

    // Interact with elements
    fireEvent.click(screen.getByRole("button", { name: /Oatmeal/i }));

    // Check for elements
    expect(screen.getByText("Adjust Servings")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Confirm/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Cancel/i })).toBeInTheDocument();
  });

  it("should call handleFoodSelect when a food item is selected", async () => {
    render(<MealPlanner />);
    await waitFor(() =>
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument()
    );

    fireEvent.click(screen.getByText("Presley"));
    fireEvent.click(screen.getByText("monday"));
    fireEvent.click(screen.getByText("breakfast"));

    // Interact with element
    fireEvent.click(screen.getByRole("button", { name: /Oatmeal/i }));
    //Check for calls
    expect(
      (useMealPlanState as jest.Mock).mock.results[0].value.handleFoodSelect
    ).toHaveBeenCalledWith("grains", {
      name: "Oatmeal",
      calories: 150,
      protein: 5,
      carbs: 25,
      fat: 2,
      category: "grains",
      servingSize: "1",
      servingSizeUnit: "cup",
      meal: ["breakfast", "snack"],
    });
  });

  it("should show the child view when the toggle is clicked", async () => {
    render(<MealPlanner />);
    await waitFor(() =>
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument()
    );

    // Interact with elements
    fireEvent.click(screen.getByText("View Toggle"));
    expect(screen.getByText("Breakfast")).toBeInTheDocument();
  });
});
