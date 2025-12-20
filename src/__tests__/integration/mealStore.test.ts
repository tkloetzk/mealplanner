import { act, renderHook, waitFor } from "@testing-library/react";
import { useMealStore } from "@/store/useMealStore";
import {
  useCurrentMealSelection,
  useMealNutrition,
  useMilkInclusion,
} from "@/store/mealSelectors";
import type { Food } from "@/types/food";
import type { Kid } from "@/types/user";

// Mock fetch globally
global.fetch = jest.fn();

beforeEach(() => {
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: () => Promise.resolve([]),
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("MealStore Integration Tests", () => {
  const mockKids: Kid[] = [
    { id: "1", name: "Test Kid 1" },
    { id: "2", name: "Test Kid 2" },
  ];

  const testFood: Food = {
    id: "protein-1",
    name: "Chicken Breast",
    calories: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
    meal: ["breakfast", "lunch", "dinner"],
    category: "proteins",
    servings: 1,
    servingSize: "1",
    servingSizeUnit: "piece",
  };

  const condiment: Food = {
    id: "condiment-1",
    name: "Ketchup",
    calories: 17,
    protein: 0.2,
    carbs: 4.7,
    fat: 0.1,
    meal: ["lunch", "dinner"],
    category: "condiments",
    servings: 1,
    servingSize: "1",
    servingSizeUnit: "tbsp",
  };

  beforeEach(() => {
    // Reset store state completely
    act(() => {
      useMealStore.setState({
        selections: {},
        selectedKid: "",
        selectedDay: "monday",
        selectedMeal: "breakfast",
        mealHistory: {},
      });
    });
  });

  describe("Kid Selection and Initialization", () => {
    it("initializes kids and selects first kid by default", () => {
      const { result } = renderHook(() => useMealStore());

      act(() => {
        result.current.initializeKids(mockKids);
      });

      expect(result.current.selectedKid).toBe(mockKids[0].id);
      expect(result.current.selections[mockKids[0].id]).toBeDefined();
      expect(result.current.selections[mockKids[1].id]).toBeDefined();
    });

    it("does not update when same kid is selected", () => {
      const { result } = renderHook(() => useMealStore());

      act(() => {
        result.current.initializeKids(mockKids);
      });

      act(() => {
        result.current.setSelectedKid(mockKids[0].id);
      });

      expect(result.current.selectedKid).toBe(mockKids[0].id);
    });
  });

  describe("Food Selection", () => {
    it("handles food selection for different categories", async () => {
      const { result } = renderHook(() => useMealStore());

      act(() => {
        result.current.initializeKids(mockKids);
        result.current.setSelectedDay("monday");
        result.current.setSelectedMeal("breakfast");
      });

      await act(async () => {
        await result.current.handleFoodSelect("proteins", testFood);
      });

      const selections =
        result.current.selections[mockKids[0].id]["monday"]["breakfast"];
      expect(selections?.proteins?.id).toBe(testFood.id);
      expect(selections?.proteins?.servings).toBe(1);
    });

    it("toggles food selection when same food is selected again", async () => {
      const { result } = renderHook(() => useMealStore());

      act(() => {
        result.current.initializeKids(mockKids);
        result.current.setSelectedDay("monday");
        result.current.setSelectedMeal("breakfast");
      });

      // Select food
      await act(async () => {
        await result.current.handleFoodSelect("proteins", testFood);
      });

      let selections =
        result.current.selections[mockKids[0].id]["monday"]["breakfast"];
      expect(selections?.proteins?.id).toBe(testFood.id);

      // Select same food again (should deselect)
      await act(async () => {
        await result.current.handleFoodSelect("proteins", testFood);
      });

      selections =
        result.current.selections[mockKids[0].id]["monday"]["breakfast"];
      expect(selections?.proteins).toBeNull();
    });

    it("handles condiments as array", async () => {
      const { result } = renderHook(() => useMealStore());

      act(() => {
        result.current.initializeKids(mockKids);
        result.current.setSelectedDay("monday");
        result.current.setSelectedMeal("lunch");
      });

      await act(async () => {
        await result.current.handleFoodSelect("condiments", condiment);
      });

      const selections =
        result.current.selections[mockKids[0].id]["monday"]["lunch"];
      expect(selections?.condiments).toHaveLength(1);
      expect(selections?.condiments[0]?.id).toBe(condiment.id);

      // Add same condiment again (should remove)
      await act(async () => {
        await result.current.handleFoodSelect("condiments", condiment);
      });

      const updatedSelections =
        result.current.selections[mockKids[0].id]["monday"]["lunch"];
      expect(updatedSelections?.condiments).toHaveLength(0);
    });
  });

  describe("Serving Adjustments", () => {
    it("adjusts serving sizes for regular foods", async () => {
      const { result } = renderHook(() => useMealStore());

      act(() => {
        result.current.initializeKids(mockKids);
        result.current.setSelectedDay("monday");
        result.current.setSelectedMeal("breakfast");
      });

      // Select food first
      await act(async () => {
        await result.current.handleFoodSelect("proteins", testFood);
      });

      // Adjust servings
      await act(async () => {
        await result.current.handleServingAdjustment(
          "proteins",
          testFood.id,
          2
        );
      });

      const selections =
        result.current.selections[mockKids[0].id]["monday"]["breakfast"];
      const selectedFood = selections?.proteins;

      expect(selectedFood?.servings).toBe(2);
      expect(selectedFood?.adjustedCalories).toBe(testFood.calories * 2);
      expect(selectedFood?.adjustedProtein).toBe(testFood.protein * 2);
      expect(selectedFood?.adjustedCarbs).toBe(testFood.carbs * 2);
      expect(selectedFood?.adjustedFat).toBe(testFood.fat * 2);
    });

    it("adjusts serving sizes for condiments", async () => {
      const { result } = renderHook(() => useMealStore());

      act(() => {
        result.current.initializeKids(mockKids);
        result.current.setSelectedDay("monday");
        result.current.setSelectedMeal("lunch");
      });

      // Select condiment first
      await act(async () => {
        await result.current.handleFoodSelect("condiments", condiment);
      });

      // Adjust servings
      await act(async () => {
        await result.current.handleServingAdjustment(
          "condiments",
          condiment.id,
          3
        );
      });

      const selections =
        result.current.selections[mockKids[0].id]["monday"]["lunch"];
      const selectedCondiment = selections?.condiments[0];

      expect(selectedCondiment?.servings).toBe(3);
      expect(selectedCondiment?.adjustedCalories).toBe(condiment.calories * 3);
    });
  });

  describe("Milk Toggle", () => {
    it("adds milk when toggled on", async () => {
      const { result } = renderHook(() => useMealStore());

      act(() => {
        result.current.initializeKids(mockKids);
        result.current.setSelectedDay("monday");
      });

      await act(async () => {
        await result.current.handleMilkToggle("breakfast", true);
      });

      const selections =
        result.current.selections[mockKids[0].id]["monday"]["breakfast"];
      expect(selections?.milk).toBeDefined();
      expect(selections?.milk?.servings).toBe(1);
    });

    it("removes milk when toggled off", async () => {
      const { result } = renderHook(() => useMealStore());

      act(() => {
        result.current.initializeKids(mockKids);
        result.current.setSelectedDay("monday");
      });

      // Add milk first
      await act(async () => {
        await result.current.handleMilkToggle("breakfast", true);
      });

      // Remove milk
      await act(async () => {
        await result.current.handleMilkToggle("breakfast", false);
      });

      const selections =
        result.current.selections[mockKids[0].id]["monday"]["breakfast"];
      expect(selections?.milk).toBeNull();
    });
  });

  describe("Selectors", () => {
    it("useCurrentMealSelection returns current meal selections", () => {
      const { result: storeResult } = renderHook(() => useMealStore());
      const { result: selectorResult } = renderHook(() =>
        useCurrentMealSelection()
      );

      act(() => {
        storeResult.current.initializeKids(mockKids);
        storeResult.current.setSelectedDay("monday");
        storeResult.current.setSelectedMeal("breakfast");
      });

      expect(selectorResult.current).toBeDefined();
    });

    it("useMealNutrition calculates nutrition correctly", async () => {
      const { result: storeResult } = renderHook(() => useMealStore());
      const { result: nutritionResult } = renderHook(() =>
        useMealNutrition("breakfast")
      );

      act(() => {
        storeResult.current.initializeKids(mockKids);
        storeResult.current.setSelectedDay("monday");
        storeResult.current.setSelectedMeal("breakfast");
      });

      // Initially should be zero
      expect(nutritionResult.current.calories).toBe(0);

      // Add food and check nutrition
      await act(async () => {
        await storeResult.current.handleFoodSelect("proteins", testFood);
      });

      await waitFor(() => {
        expect(nutritionResult.current.calories).toBe(testFood.calories);
        expect(nutritionResult.current.protein).toBe(testFood.protein);
        expect(nutritionResult.current.carbs).toBe(testFood.carbs);
        expect(nutritionResult.current.fat).toBe(testFood.fat);
      });
    });

    it("useMilkInclusion tracks milk status correctly", async () => {
      const { result: storeResult } = renderHook(() => useMealStore());
      const { result: milkResult } = renderHook(() => useMilkInclusion());

      act(() => {
        storeResult.current.initializeKids(mockKids);
        storeResult.current.setSelectedDay("monday");
      });

      // Initially no milk
      expect(milkResult.current.breakfast).toBe(false);
      expect(milkResult.current.lunch).toBe(false);

      // Add milk to breakfast
      await act(async () => {
        await storeResult.current.handleMilkToggle("breakfast", true);
      });

      await waitFor(() => {
        expect(milkResult.current.breakfast).toBe(true);
        expect(milkResult.current.lunch).toBe(false);
      });
    });
  });

  describe("State Persistence", () => {
    it("prevents unnecessary updates for same values", () => {
      const { result } = renderHook(() => useMealStore());

      act(() => {
        result.current.initializeKids(mockKids);
      });

      // Set same day
      act(() => {
        result.current.setSelectedDay("monday");
        result.current.setSelectedDay("monday"); // Same value
      });

      // Set same meal
      act(() => {
        result.current.setSelectedMeal("breakfast");
        result.current.setSelectedMeal("breakfast"); // Same value
      });

      // State references should be stable for unchanged values
      expect(result.current.selectedDay).toBe("monday");
      expect(result.current.selectedMeal).toBe("breakfast");
    });
  });
});
