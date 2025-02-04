// src/components/__tests__/MealPlannerIntegration.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import { MOCK_FOODS } from "@/__mocks__/testConstants";
import {
  DAILY_GOALS,
  MILK_OPTION,
  DEFAULT_MEAL_PLAN,
} from "@/constants/meal-goals";
import { MealPlanner } from "../meals/MealPlanner";
import { CategoryType, Food } from "@/types/food";
import {
  MealType,
  DayType,
  MealPlan,
  MealSelection,
  MealHistoryRecord,
} from "@/types/meals";
import { Kid } from "@/types/user";
import userEvent from "@testing-library/user-event";
import { create } from "zustand";
import { useMealStore } from "@/store/useMealStore";
import type { StoreApi, UseBoundStore } from "zustand";

interface MealStore {
  selections: Record<string, MealPlan>;
  selectedKid: string;
  selectedDay: DayType;
  selectedMeal: MealType;
  mealHistory: Record<string, MealHistoryRecord[]>;
  initializeKids: (kids: Kid[]) => void;
  setSelectedKid: (kidId: string) => void;
  setSelectedDay: (day: DayType) => void;
  setSelectedMeal: (meal: MealType) => void;
  handleFoodSelect: (category: CategoryType, food: Food) => void;
  handleServingAdjustment: (
    category: CategoryType,
    id: string,
    servings: number
  ) => void;
  handleMilkToggle: (mealType: MealType, enabled: boolean) => void;
  calculateMealNutrition: (meal: MealType) => {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  getCurrentMealSelection: () => MealSelection | null;
  resetMeal: (kidId: string, day: DayType, meal: MealType) => void;
  calculateDailyTotals: () => {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

// Create a function to get a clean store state
const getInitialState = (): MealStore => ({
  selections: {},
  selectedKid: "1",
  selectedDay: "monday" as DayType,
  selectedMeal: "breakfast" as MealType,
  mealHistory: {},
  initializeKids: () => {},
  setSelectedKid: () => {},
  setSelectedDay: () => {},
  setSelectedMeal: () => {},
  handleFoodSelect: () => {},
  handleServingAdjustment: () => {},
  handleMilkToggle: () => {},
  calculateMealNutrition: () => ({ calories: 0, protein: 0, carbs: 0, fat: 0 }),
  getCurrentMealSelection: () => null,
  resetMeal: () => {},
  calculateDailyTotals: () => ({ calories: 0, protein: 0, carbs: 0, fat: 0 }),
});

// Mock the Zustand store
jest.mock("@/store/useMealStore", () => {
  const actualStore = jest.requireActual("@/store/useMealStore");

  // Create a test store with the same implementation but starting with initial test state
  const testStore = create<MealStore>(() => ({
    ...getInitialState(),
    // Add all the actions from the actual store
    initializeKids: (kids: Kid[]) => {
      testStore.setState((state: MealStore) => {
        const newState = { ...state };
        kids.forEach((kid: Kid) => {
          if (!newState.selections[kid.id]) {
            newState.selections[kid.id] = structuredClone(DEFAULT_MEAL_PLAN);
          }
        });
        if (!newState.selectedKid && kids.length > 0) {
          newState.selectedKid = kids[0].id;
        }
        return newState;
      });
    },
    setSelectedKid: (kidId: string) =>
      testStore.setState({ selectedKid: kidId }),
    setSelectedDay: (day: DayType) => testStore.setState({ selectedDay: day }),
    setSelectedMeal: (meal: MealType) =>
      testStore.setState({ selectedMeal: meal }),
    handleFoodSelect: actualStore.useMealStore.getState().handleFoodSelect,
    handleServingAdjustment:
      actualStore.useMealStore.getState().handleServingAdjustment,
    handleMilkToggle: actualStore.useMealStore.getState().handleMilkToggle,
    calculateMealNutrition:
      actualStore.useMealStore.getState().calculateMealNutrition,
    getCurrentMealSelection:
      actualStore.useMealStore.getState().getCurrentMealSelection,
    resetMeal: actualStore.useMealStore.getState().resetMeal,
    calculateDailyTotals:
      actualStore.useMealStore.getState().calculateDailyTotals,
  })) as unknown as UseBoundStore<StoreApi<MealStore>>;

  return {
    useMealStore: testStore,
    getInitialState,
  };
});

describe("MealPlanner Integration Tests", () => {
  beforeEach(() => {
    // Reset store before each test
    const store = useMealStore.getState();

    // Initialize with test data
    store.initializeKids([
      { id: "1", name: "Presley" },
      { id: "2", name: "Evy" },
    ]);
    store.setSelectedKid("1");
    store.setSelectedDay("monday");
    store.setSelectedMeal("breakfast" as MealType);
  });

  afterEach(() => {
    // Clean up store after each test
    const store = useMealStore.getState();
    store.selections = {};
    store.mealHistory = {};
    jest.clearAllMocks();
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

  const selectMeal = async (meal: MealType) => {
    const mealButton = screen.getByTestId(`${meal}-meal-button`);
    await userEvent.click(mealButton);
    await waitFor(() => {
      expect(mealButton).toHaveClass("bg-blue-500 text-white");
    });
    return mealButton;
  };

  const selectFood = async (
    category: CategoryType,
    index: number,
    meal: MealType
  ) => {
    const foodElement = screen.getByTestId(`${category}-${meal}-${index}`);
    await userEvent.click(foodElement);

    await waitFor(() => {
      expect(foodElement).toHaveClass("ring-2 ring-blue-500 bg-blue-100");
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
    await userEvent.click(foodElement);

    await waitFor(() => {
      expect(foodElement).not.toHaveClass("ring-2 ring-blue-500 bg-blue-100");
      expect(screen.queryByTestId("edit-food-icon")).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("adjust-servings-icon")
      ).not.toBeInTheDocument();
    });

    return foodElement;
  };

  const toggleSwitch = async (name: RegExp) => {
    const switchElement = screen.getByRole("switch", { name });
    await userEvent.click(switchElement);
    return switchElement;
  };

  // Basic functionality tests
  it("handles view toggling and meal selection persistence", async () => {
    await renderMealPlanner();

    // Check initial load
    expect(screen.getByTestId("meal-planner")).toBeInTheDocument();

    // Toggle to child view
    const viewToggle = screen.getByRole("switch", { name: /Parent's View/i });
    await userEvent.click(viewToggle);

    // Verify child view elements
    await waitFor(() => {
      expect(screen.getByText(/Choose your proteins/i)).toBeInTheDocument();
      expect(screen.getByText(/Choose your fruits/i)).toBeInTheDocument();
    });

    // Toggle back to parent view and verify
    await userEvent.click(viewToggle);
    await waitFor(() => {
      expect(screen.getByTestId("meal-planner")).toBeInTheDocument();
    });

    // Test meal selection persistence across views
    await selectMeal("lunch" as MealType);
    await userEvent.click(viewToggle);
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

  it('filters out hidden "Other" category foods in child view', async () => {
    await renderMealPlanner();

    // Switch to child view
    const viewToggle = screen.getByRole("switch", { name: /Parent's View/i });
    userEvent.click(viewToggle);

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

  it("maintains meal-specific serving adjustments", async () => {
    await renderMealPlanner();

    // Select same protein in both lunch and dinner with different servings
    // Lunch: 1 serving
    await selectMeal("lunch" as MealType);
    await selectFood(MOCK_FOODS.proteins[0].category, 0, "lunch" as MealType);

    // Dinner: 2 servings
    await selectMeal("dinner" as MealType);
    await selectFood(MOCK_FOODS.proteins[0].category, 0, "dinner" as MealType);

    // Adjust dinner serving
    const servingButton = screen.getByTitle("Adjust Servings");
    await userEvent.click(servingButton);
    await userEvent.click(screen.getByTestId("increment-serving"));

    const confirmButton = screen.getByRole("button", { name: /confirm/i });
    await userEvent.click(confirmButton);

    // Verify lunch still has 1 serving
    await selectMeal("lunch" as MealType);
    await waitFor(() => {
      expect(
        screen.getByText(
          `1 serving(s) • ${MOCK_FOODS.proteins[0].calories} cal total`
        )
      ).toBeInTheDocument();
    });

    // Verify dinner has 1.25 servings
    await selectMeal("dinner" as MealType);
    expect(
      screen.getByText(
        `1.25 serving(s) • ${(MOCK_FOODS.proteins[0].calories * 1.25).toFixed(
          0
        )} cal total`
      )
    ).toBeInTheDocument();
  });
});
