import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ConsumptionStatusSelector } from "../ConsumptionStatusSelector";
import { ConsumptionInfo } from "@/types/shared";

const mockOnSave = jest.fn();
const mockOnCancel = jest.fn();

const defaultProps = {
  initialStatus: undefined as ConsumptionInfo | undefined,
  onSave: mockOnSave,
  onCancel: mockOnCancel,
};

describe("ConsumptionStatusSelector", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders with default values", () => {
    render(<ConsumptionStatusSelector {...defaultProps} />);

    expect(screen.getByText("Mark Meal Status")).toBeInTheDocument();
    expect(screen.getByLabelText("General Notes")).toBeInTheDocument();
    expect(screen.getByText("Save Status")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });


  it("allows updating food consumption status", () => {
    // Providing meal selections so that food items are available for tracking
    const propsWithSelections = {
      ...defaultProps,
      mealSelections: {
        proteins: { id: 'protein-1', name: 'Chicken', category: 'proteins', meal: ['breakfast'], servings: 1, servingSize: '1', servingSizeUnit: 'piece', calories: 100, protein: 20, carbs: 0, fat: 5 },
        grains: { id: 'grain-1', name: 'Toast', category: 'grains', meal: ['breakfast'], servings: 1, servingSize: '1', servingSizeUnit: 'slice', calories: 80, protein: 2, carbs: 15, fat: 1 },
        fruits: null,
        vegetables: null,
        milk: null,
        ranch: null,
        condiments: [],
        other: null,
      }
    };

    render(<ConsumptionStatusSelector {...propsWithSelections} />);

    // Look for the food name and status buttons
    expect(screen.getAllByText("Chicken")[0]).toBeInTheDocument();  // The food name should be displayed (first occurrence)
    expect(screen.getAllByText("Not Eaten")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Partially Eaten")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Eaten")[0]).toBeInTheDocument();
  });

  it("shows slider when partially eaten is selected for a food", () => {
    // Providing meal selections so that food items are available for tracking
    const propsWithSelections = {
      ...defaultProps,
      mealSelections: {
        proteins: { id: 'protein-1', name: 'Chicken', category: 'proteins', meal: ['breakfast'], servings: 1, servingSize: '1', servingSizeUnit: 'piece', calories: 100, protein: 20, carbs: 0, fat: 5 },
        grains: null,
        fruits: null,
        vegetables: null,
        milk: null,
        ranch: null,
        condiments: [],
        other: null,
      }
    };

    render(<ConsumptionStatusSelector {...propsWithSelections} />);

    // Click the "Partially Eaten" food status button
    const foodPartialEatenButton = screen.getByRole("button", { name: "Partially Eaten" });
    fireEvent.click(foodPartialEatenButton);

    // Check that the slider is now visible
    expect(screen.getByText(/Percentage Eaten/)).toBeInTheDocument();
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

  it("updates notes when text is entered", () => {
    render(<ConsumptionStatusSelector {...defaultProps} />);

    const notesInput = screen.getByLabelText("General Notes");
    fireEvent.change(notesInput, { target: { value: "Test notes" } });

    expect(notesInput).toHaveValue("Test notes");
  });

  it("calls onSave with correct data", () => {
    // Providing meal selections so that food items are available for tracking
    const propsWithSelections = {
      ...defaultProps,
      mealSelections: {
        proteins: { id: 'protein-1', name: 'Chicken', category: 'proteins', meal: ['breakfast'], servings: 1, servingSize: '1', servingSizeUnit: 'piece', calories: 100, protein: 20, carbs: 0, fat: 5 },
        grains: null,
        fruits: null,
        vegetables: null,
        milk: null,
        ranch: null,
        condiments: [],
        other: null,
      }
    };

    render(<ConsumptionStatusSelector {...propsWithSelections} />);

    const eatenButton = screen.getByText("Eaten");
    fireEvent.click(eatenButton);

    const saveButton = screen.getByText("Save Status");
    fireEvent.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledWith({
      foods: [
        {
          foodId: 'protein-1',
          status: 'eaten',
          percentageEaten: 100,
          notes: undefined,
        }
      ],
      overallStatus: "eaten",
      notes: undefined,
    });
  });

  it("calls onSave with notes when provided", () => {
    // Providing meal selections so that food items are available for tracking
    const propsWithSelections = {
      ...defaultProps,
      mealSelections: {
        proteins: { id: 'protein-1', name: 'Chicken', category: 'proteins', meal: ['breakfast'], servings: 1, servingSize: '1', servingSizeUnit: 'piece', calories: 100, protein: 20, carbs: 0, fat: 5 },
        grains: null,
        fruits: null,
        vegetables: null,
        milk: null,
        ranch: null,
        condiments: [],
        other: null,
      }
    };

    render(<ConsumptionStatusSelector {...propsWithSelections} />);

    const notesInput = screen.getByLabelText("General Notes");
    fireEvent.change(notesInput, { target: { value: "Test notes" } });

    const eatenButton = screen.getByText("Eaten"); // Get the "Eaten" button for the food item
    fireEvent.click(eatenButton);

    const saveButton = screen.getByText("Save Status");
    fireEvent.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledWith({
      foods: [
        {
          foodId: 'protein-1',
          status: 'eaten',
          percentageEaten: 100,
          notes: undefined, // Food-specific status doesn't add note at food level, only at general level
        }
      ],
      overallStatus: "eaten",
      notes: "Test notes", // General notes are added at the meal level
    });
  });

  it("calls onCancel when cancel button is clicked", () => {
    render(<ConsumptionStatusSelector {...defaultProps} />);

    const cancelButton = screen.getByText("Cancel");
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it("uses initial status if provided", () => {
    const initialStatus: ConsumptionInfo = {
      foods: [
        {
          foodId: "test-food-1",
          status: "partially_eaten",
          percentageEaten: 50,
          notes: "Some food eaten",
        }
      ],
      overallStatus: "partially_eaten",
      notes: "Some food eaten",
    };

    render(
      <ConsumptionStatusSelector
        {...defaultProps}
        mealSelections={{
          proteins: { id: 'test-food-1', name: 'Test Food', category: 'proteins', meal: ['breakfast'], servings: 1, servingSize: '1', servingSizeUnit: 'piece', calories: 100, protein: 20, carbs: 0, fat: 5 },
          grains: null,
          fruits: null,
          vegetables: null,
          milk: null,
          ranch: null,
          condiments: [],
          other: null,
        }}
        initialStatus={initialStatus}
      />
    );

    // Check that the food status is reflected in the UI
    expect(screen.getAllByText("Test Food")[0]).toBeInTheDocument(); // Get first occurrence
    expect(screen.getAllByText(/partially eaten/i)[0]).toBeInTheDocument(); // Check for status text (first occurrence)
  });
});