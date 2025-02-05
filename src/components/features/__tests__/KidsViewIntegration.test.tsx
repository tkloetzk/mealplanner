// src/components/__tests__/KidsViewIntegration.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import { MOCK_FOODS } from "@/__mocks__/testConstants";
import { MealPlanner } from "../meals/MealPlanner";
import userEvent from "@testing-library/user-event";
import { useMealStore } from "@/store/useMealStore";
import { MealType } from "@/types/meals";

describe("Kids View Integration Tests", () => {
  // Add user setup
  const user = userEvent.setup();

  // Reset store state before each test
  beforeEach(() => {
    const { initializeKids } = useMealStore.getState();
    useMealStore.setState({
      selections: {
        "1": {
          monday: {
            breakfast: {
              proteins: null,
              fruits: null,
              vegetables: null,
              grains: null,
              milk: null,
              condiments: [],
              other: null,
            },
            lunch: {
              proteins: null,
              fruits: null,
              vegetables: null,
              grains: null,
              milk: null,
              condiments: [],
              other: null,
            },
            dinner: {
              proteins: null,
              fruits: null,
              vegetables: null,
              grains: null,
              milk: null,
              condiments: [],
              other: null,
            },
          },
        },
      },
      selectedKid: "1",
      selectedDay: "monday",
      selectedMeal: "breakfast",
      mealHistory: {},
    });
    initializeKids([
      { id: "1", name: "Presley" },
      { id: "2", name: "Evy" },
    ]);

    // Mock fetch calls
    global.fetch = jest.fn().mockImplementation((url) => {
      if (url === "/api/foods") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(MOCK_FOODS),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
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

  const selectFood = async (
    category: string,
    index: number,
    meal: MealType
  ) => {
    const testId = `${category}-${meal}-${index}`;
    console.log("Looking for test ID:", testId);

    // Log all available test IDs
    const allTestIds = document.querySelectorAll("[data-testid]");
    console.log(
      "Available test IDs:",
      Array.from(allTestIds).map((el) => el.getAttribute("data-testid"))
    );

    const foodElement = screen.getByTestId(testId);
    await user.click(foodElement);

    await waitFor(() => {
      expect(foodElement).toHaveClass("ring-2");
      expect(foodElement).toHaveClass("ring-green-500");
    });

    return foodElement;
  };

  const toggleView = async () => {
    const viewToggle = screen.getByRole("switch", {
      name: /Kid's View|Parent's View/i,
    });
    await user.click(viewToggle);
  };

  it("displays appropriate food categories in kid's view", async () => {
    await renderMealPlanner();
    await toggleView();

    // Verify category headers and emojis are present
    await waitFor(() => {
      expect(screen.getByText(/Choose your proteins/i)).toBeInTheDocument();
      expect(screen.getByText(/Choose your fruits/i)).toBeInTheDocument();
      expect(screen.getByText(/Choose your vegetables/i)).toBeInTheDocument();
    });

    // Verify emojis within their specific category contexts
    const proteinCategory = screen
      .getByText(/Choose your proteins/i)
      .closest("div");
    const fruitCategory = screen
      .getByText(/Choose your fruits/i)
      .closest("div");
    const vegetableCategory = screen
      .getByText(/Choose your vegetables/i)
      .closest("div");

    expect(proteinCategory).toHaveTextContent("🥚");
    expect(fruitCategory).toHaveTextContent("🍎");
    expect(vegetableCategory).toHaveTextContent("🥕");
  });

  it("handles food selection with visual feedback in kid's view", async () => {
    await renderMealPlanner();
    await toggleView();

    // Wait for child view to be fully rendered
    await waitFor(() => {
      expect(screen.getByTestId("child-view")).toBeInTheDocument();
    });

    // Wait for food data to be loaded and rendered
    await waitFor(() => {
      // Check for specific food items from mock data
      expect(screen.getByText(MOCK_FOODS.proteins[0].name)).toBeInTheDocument();
      expect(screen.getByTestId("proteins-breakfast-0")).toBeInTheDocument();
    });

    // Select a food item
    const foodElement = await selectFood("proteins", 0, "breakfast");

    // Verify selection state
    expect(foodElement).toHaveClass("ring-2");
    expect(foodElement).toHaveClass("ring-green-500");
    expect(screen.getByTestId("check-icon")).toBeInTheDocument();
  });

  it("maintains selections when toggling between parent and kid views", async () => {
    await renderMealPlanner();
    await toggleView();

    // Make food selections in kid's view
    await selectFood("proteins", 0, "breakfast");
    await selectFood("fruits", 0, "breakfast");

    // Toggle back to parent view
    await toggleView();

    // Verify selections are maintained
    expect(screen.getByText(MOCK_FOODS.proteins[0].name)).toBeInTheDocument();
    expect(screen.getByText(MOCK_FOODS.fruits[0].name)).toBeInTheDocument();

    // Verify nutrition information is updated
    const expectedCalories =
      MOCK_FOODS.proteins[0].calories + MOCK_FOODS.fruits[0].calories;
    expect(
      screen.getByText(new RegExp(`${expectedCalories}.*cal`))
    ).toBeInTheDocument();
  });

  it("filters out hidden foods in kid's view", async () => {
    await renderMealPlanner();
    await toggleView();

    // Check that hidden foods are not visible
    const hiddenFood = MOCK_FOODS.other.find((f) => f.hiddenFromChild);
    if (hiddenFood) {
      expect(screen.queryByText(hiddenFood.name)).not.toBeInTheDocument();
    }

    // Check that visible foods are shown
    const visibleFood = MOCK_FOODS.other.find((f) => !f.hiddenFromChild);
    if (visibleFood) {
      expect(screen.getByText(visibleFood.name)).toBeInTheDocument();
    }
  });

  it.only("shows condiments only when relevant foods are selected", async () => {
    await renderMealPlanner();
    await toggleView();

    // Initially, no condiments should be visible
    expect(screen.queryByText(/Add Toppings/i)).not.toBeInTheDocument();

    // Select a food that can have condiments
    await selectFood("proteins", 0, "breakfast");

    // Now condiments section should be visible
    await waitFor(() => {
      expect(screen.getByText(/Add Toppings/i)).toBeInTheDocument();
    });

    // Verify condiment selection works
    const condimentElement = screen.getByTestId("condiments-breakfast-0");
    await user.click(condimentElement);
    expect(condimentElement).toHaveClass("ring-2");
    expect(condimentElement).toHaveClass("ring-green-500");
  });
});
