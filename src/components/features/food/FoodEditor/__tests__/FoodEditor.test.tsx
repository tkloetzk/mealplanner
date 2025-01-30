// src/components/features/food/FoodEditor/__tests__/FoodEditor.test.tsx
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { FoodEditor } from "../FoodEditor";
import { FoodItem } from "@/components/features/meals/shared/FoodItem";
import { MOCK_FOODS, PROTEINS } from "@/__mocks__/testConstants";
import { MealPlanner } from "@/components/features/meals/MealPlanner";

const mockOnSelect = jest.fn();
const mockOnServingClick = jest.fn();
const mockOnSave = jest.fn();
const mockOnCancel = jest.fn();

describe("FoodEditor Component", () => {
  describe("Opening modes", () => {
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
    test("clicking edit icon opens food editor with prefilled data", async () => {
      // First render FoodItem
      const foodItemProps = {
        id: "1",
        food: MOCK_FOODS.proteins[0],
        category: PROTEINS,
        isSelected: true,
        index: 0,
        selectedFoodInCategory: {
          ...MOCK_FOODS.proteins[0],
          servings: 1,
          adjustedCalories: MOCK_FOODS.proteins[0].calories,
          adjustedProtein: MOCK_FOODS.proteins[0].protein,
          adjustedCarbs: MOCK_FOODS.proteins[0].carbs,
          adjustedFat: MOCK_FOODS.proteins[0].fat,
        },
        onSelect: mockOnSelect,
        onServingClick: mockOnServingClick,
        onEditFood: () => {
          // When edit is clicked, render the FoodEditor
          render(
            <FoodEditor
              onSave={mockOnSave}
              onCancel={mockOnCancel}
              initialFood={MOCK_FOODS.proteins[0]}
            />
          );
        },
        isHidden: false,
        onToggleVisibility: jest.fn(),
      };

      render(<FoodItem {...foodItemProps} />);

      // Find and click the edit icon
      const editIcon = screen.getByTestId("edit-food-icon");
      expect(editIcon).toBeInTheDocument();
      await userEvent.click(editIcon);

      // Now verify FoodEditor content
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
  describe("FoodEditor Validation", () => {
    it("validates serving size must be greater than 0", async () => {
      render(<FoodEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      // Fill out required fields to enable save button
      await userEvent.type(screen.getByLabelText(/name/i), "Test Food");
      await userEvent.type(screen.getByLabelText(/calories/i), "100");

      // Select at least one meal type
      const breakfastCheckbox = screen.getByRole("checkbox", {
        name: /breakfast/i,
      });
      await userEvent.click(breakfastCheckbox);

      // Set invalid serving size
      const servingSizeInput = screen.getByLabelText(/serving size/i);
      await userEvent.clear(servingSizeInput);
      await userEvent.type(servingSizeInput, "0");

      const saveButton = screen.getByRole("button", { name: /save food/i });
      await userEvent.click(saveButton);

      // Check for exact error message from validateNutrition function
      expect(
        screen.getByText("Serving size must be greater than 0")
      ).toBeInTheDocument();
    });

    it.skip("requires at least one meal type to be selected", async () => {
      render(<FoodEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      // Fill out required fields except meal type
      await userEvent.type(screen.getByLabelText(/name/i), "Test Food");
      await userEvent.type(screen.getByLabelText(/calories/i), "100");

      const saveButton = screen.getByRole("button", { name: /save food/i });
      await userEvent.click(saveButton);

      expect(
        screen.getByText("Select at least one compatible meal type")
      ).toBeInTheDocument();
    });

    it("validates that calories are within acceptable range", async () => {
      render(<FoodEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      // Fill out required fields with invalid calories
      await userEvent.type(screen.getByLabelText(/name/i), "Test Food");
      await userEvent.type(screen.getByLabelText(/calories/i), "2000"); // Over the MAX_CALORIES_PER_SERVING

      const breakfastCheckbox = screen.getByRole("checkbox", {
        name: /breakfast/i,
      });
      await userEvent.click(breakfastCheckbox);

      const saveButton = screen.getByRole("button", { name: /save food/i });
      await userEvent.click(saveButton);

      expect(
        screen.getByText(/Calories should be between/i)
      ).toBeInTheDocument();
    });

    it.skip("validates that macronutrients cannot be negative", async () => {
      const mockOnSave = jest.fn();
      const mockOnCancel = jest.fn();

      render(<FoodEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      // Fill out fields with valid calorie/macro ratio first
      // For 100 calories:
      // - Protein: 4 cal/g * 5g = 20 calories
      // - Carbs: 4 cal/g * 15g = 60 calories
      // - Fat: 9 cal/g * 2.22g = 20 calories
      // Total = 100 calories
      await userEvent.type(screen.getByLabelText(/name/i), "Test Food");
      await userEvent.type(screen.getByLabelText(/calories/i), "100");
      await userEvent.type(screen.getByLabelText(/carbs \(g\)/i), "15");
      await userEvent.type(screen.getByLabelText(/fat \(g\)/i), "2.22");

      // Clear protein field and enter negative value last
      const proteinInput = screen.getByLabelText(/protein \(g\)/i);
      await userEvent.clear(proteinInput);
      await userEvent.type(proteinInput, "-5");

      // Select at least one meal type
      const breakfastCheckbox = screen.getByRole("checkbox", {
        name: /breakfast/i,
      });
      await userEvent.click(breakfastCheckbox);

      // Try to save
      const saveButton = screen.getByRole("button", { name: /save food/i });
      await userEvent.click(saveButton);

      // Look for the error within the alert
      const alert = screen.getByRole("alert");
      expect(alert).toHaveTextContent(/protein cannot be negative/i);

      // Verify save was not called
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    // Also add a test for calorie/macro ratio validation
    it("validates that calories match macronutrient totals", async () => {
      const mockOnSave = jest.fn();
      const mockOnCancel = jest.fn();

      render(<FoodEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      // Fill out fields with invalid calorie/macro ratio
      await userEvent.type(screen.getByLabelText(/name/i), "Test Food");
      await userEvent.type(screen.getByLabelText(/calories/i), "100");
      await userEvent.type(screen.getByLabelText(/protein \(g\)/i), "10"); // 40 calories
      await userEvent.type(screen.getByLabelText(/carbs \(g\)/i), "10"); // 40 calories
      await userEvent.type(screen.getByLabelText(/fat \(g\)/i), "10"); // 90 calories
      // Total calories from macros = 170, but entered 100

      const breakfastCheckbox = screen.getByRole("checkbox", {
        name: /breakfast/i,
      });
      await userEvent.click(breakfastCheckbox);

      const saveButton = screen.getByRole("button", { name: /save food/i });
      await userEvent.click(saveButton);

      const alert = screen.getByRole("alert");
      expect(alert).toHaveTextContent(
        /calories don't match the macronutrient totals/i
      );
      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });
  describe("FoodEditor Image Handling", () => {
    it.skip("uploads image successfully", async () => {
      const mockUploadResponse = { url: "https://example.com/image.jpg" };
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUploadResponse),
      });

      render(<FoodEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

      // Simulate image upload
      const imageUploader = screen.getByText(/Take Photo/i);
      await userEvent.click(imageUploader);

      // Verify upload request was made
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/upload-image",
        expect.any(Object)
      );
    });

    it("displays existing image for editing", () => {
      const foodWithImage = {
        ...MOCK_FOODS.proteins[0],
        cloudinaryUrl: "https://example.com/food.jpg",
      };

      render(
        <FoodEditor
          initialFood={foodWithImage}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const image = screen.getByRole("img");
      expect(image).toHaveAttribute("src", foodWithImage.cloudinaryUrl);
    });
  });
});
