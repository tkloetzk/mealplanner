import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { MealPlanner } from "@/components/features/meals/MealPlanner";
import { MOCK_FOODS, PROTEINS } from "@/__mocks__/testConstants";
import { FoodItem } from "@/components/features/meals/shared/FoodItem";

// Mock functions

const mockOnSelect = jest.fn();
const mockOnServingClick = jest.fn();
const mockOnEditFood = jest.fn();
const defaultProps = {
  id: "1",
  food: MOCK_FOODS.proteins[0],
  category: PROTEINS,
  isSelected: false,
  index: 0,
  selectedFoodInCategory: null,
  onSelect: mockOnSelect,
  onServingClick: mockOnServingClick,
  onEditFood: mockOnEditFood,
  isHidden: false,
  onToggleVisibility: jest.fn(),
};

describe("FoodEditor Component", () => {
  describe("Opening modes", () => {
    // const selectFood = async (category: CategoryType, food: Food) => {
    //   console.log("selectFood", category, food);
    //   const foodCard = screen.getByText(food.name);
    //   await userEvent.click(foodCard);
    //   return foodCard;
    // };
    test("clicking FAB opens blank food editor", async () => {
      render(<MealPlanner />);

      // Find and click the FAB button
      const fabButton = screen.getByTestId("fab-btn");
      await userEvent.click(fabButton);

      // Verify the editor modal is open
      expect(screen.getByText(/Add New Food/i)).toBeInTheDocument();

      // Verify all fields are empty/default values
      const nameInput = screen.getByLabelText(/name/i);
      const caloriesInput = screen.getByLabelText(/calories/i);
      const proteinInput = screen.getByLabelText(/protein/i);
      const carbsInput = screen.getByLabelText(/carbs/i);
      const fatInput = screen.getByLabelText(/fat/i);
      // Find serving size input by finding the label text first, then the nearby input
      const servingSizeLabel = screen.getByText(/serving size/i);
      const servingSizeInput = servingSizeLabel
        .closest("div")
        ?.querySelector("input");

      expect(nameInput).toHaveValue("");
      expect(caloriesInput).toHaveValue(0);
      expect(proteinInput).toHaveValue(0);
      expect(carbsInput).toHaveValue(0);
      expect(fatInput).toHaveValue(0);
      expect(servingSizeInput).toHaveValue("1");

      // Verify default category selection is present

      const categorySelect = screen.getByTestId("category-select");
      expect(categorySelect).toHaveTextContent(/proteins/i);

      // Verify "Show to children" checkbox is checked by default
      const showToChildrenCheckbox = screen.getByRole("checkbox", {
        name: /show to children/i,
      });
      expect(showToChildrenCheckbox).toBeChecked();

      // Verify search functionality elements
      const searchInput = screen.getByPlaceholderText(
        /Enter UPC or search text/i
      );
      expect(searchInput).toBeEnabled();

      const searchButton = screen.getByRole("button", { name: /search/i });
      expect(searchButton).toBeDisabled();

      const barcodeScannerButton = screen.getByTestId("barcode-scanner");
      expect(barcodeScannerButton).toBeEnabled();

      // Verify compatible meals checkboxes are present
      const mealTypes = ["Breakfast", "Lunch", "Dinner", "Snack"];
      mealTypes.forEach((mealType) => {
        const checkbox = screen.getByRole("checkbox", {
          name: new RegExp(mealType, "i"),
        });
        expect(checkbox).toBeInTheDocument();
        expect(checkbox).not.toBeChecked(); // Should be unchecked by default
      });

      // Verify Save Food button state
      const saveButton = screen.getByRole("button", { name: /save food/i });
      expect(saveButton).toBeInTheDocument();
      expect(saveButton).toBeDisabled();

      // Verify Cancel button is present and enabled
      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      expect(cancelButton).toBeInTheDocument();
      expect(cancelButton).toBeEnabled();
    });

    test.only("clicking edit icon opens food editor with prefilled data", async () => {
      render(<FoodItem {...defaultProps} />);

      const foodItem = screen.getByTestId(
        `${MOCK_FOODS.proteins[0].category}-0`
      );
      expect(foodItem).toBeInTheDocument();
      await userEvent.click(foodItem);
      //  await selectFood(PROTEINS, MOCK_FOODS.proteins[0]);
      expect(screen.getByTestId("edit-food-icon")).toBeInTheDocument();

      // Verify all fields are filled with mock data
      const nameInput = screen.getByLabelText(/name/i);
      const caloriesInput = screen.getByLabelText(/calories/i);
      const proteinInput = screen.getByLabelText(/protein \(g\)/i);
      const carbsInput = screen.getByLabelText(/carbs \(g\)/i);
      const fatInput = screen.getByLabelText(/fat \(g\)/i);

      const servingSizeLabel = screen.getByText(/serving size/i);
      const servingSizeInput = servingSizeLabel
        .closest("div")
        ?.querySelector("input");

      expect(nameInput).toHaveValue(MOCK_FOODS.proteins[0].name);
      expect(caloriesInput).toHaveValue(MOCK_FOODS.proteins[0].calories);
      expect(proteinInput).toHaveValue(MOCK_FOODS.proteins[0].protein);
      expect(carbsInput).toHaveValue(MOCK_FOODS.proteins[0].carbs);
      expect(fatInput).toHaveValue(MOCK_FOODS.proteins[0].fat);
      expect(servingSizeInput).toHaveValue(MOCK_FOODS.proteins[0].servingSize);

      // Verify category selection matches mock data
      const categorySelect = screen.getByTestId("category-select");
      expect(categorySelect.textContent?.toLowerCase()).toBe(
        MOCK_FOODS.proteins[0].category.toLowerCase()
      );

      // Verify meal checkboxes match mock data
      MOCK_FOODS.proteins[0].meal.forEach((mealType) => {
        const checkbox = screen.getByRole("checkbox", {
          name: new RegExp(mealType, "i"),
        });
        expect(checkbox).toBeChecked();
      });

      // Verify show to children checkbox matches mock data
      const showToChildrenCheckbox = screen.getByRole("checkbox", {
        name: /show to children/i,
      });
      expect(showToChildrenCheckbox).toBeChecked();
      // Verify Save Food button state
      const saveButton = screen.getByRole("button", { name: /save food/i });
      expect(saveButton).toBeInTheDocument();
      expect(saveButton).not.toBeDisabled();
    });
  });
});
