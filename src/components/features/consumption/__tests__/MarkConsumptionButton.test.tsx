import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MarkConsumptionButton } from "../MarkConsumptionButton";
import { ConsumptionInfo } from "@/types/shared";

const mockOnSave = jest.fn();

const defaultProps = {
  onSave: mockOnSave,
};

describe("MarkConsumptionButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the button with default text", () => {
    render(<MarkConsumptionButton {...defaultProps} />);

    expect(screen.getByRole("button", { name: /Mark Consumption/i })).toBeInTheDocument();
  });

  it("renders with custom children", () => {
    render(
      <MarkConsumptionButton {...defaultProps}>
        Custom Button
      </MarkConsumptionButton>
    );

    expect(screen.getByRole("button", { name: /Custom Button/i })).toBeInTheDocument();
  });

  it("opens dialog when clicked", async () => {
    render(<MarkConsumptionButton {...defaultProps} />);

    const button = screen.getByRole("button", { name: /Mark Consumption/i });
    fireEvent.click(button);

    // Wait for dialog to appear
    await waitFor(() => {
      expect(screen.getByText("Mark Consumption Status")).toBeInTheDocument();
    });
  });

  it("passes initial status to selector", async () => {
    const initialStatus: ConsumptionInfo = {
      foods: [
        {
          foodId: "test-food-1",
          status: "eaten",
          percentageEaten: 100,
          notes: "All consumed",
        }
      ],
      overallStatus: "eaten",
      notes: "All consumed",
    };

    render(
      <MarkConsumptionButton
        {...defaultProps}
        initialStatus={initialStatus}
        mealSelections={{
          proteins: [{
            id: 'test-food-1',
            name: 'Test Food',
            category: 'proteins',
            meal: ['breakfast'],
            servings: 1,
            servingSize: '1',
            servingSizeUnit: 'piece',
            calories: 100,
            protein: 20,
            carbs: 0,
            fat: 5
          }],
          grains: [],
          fruits: [],
          vegetables: [],
          milk: null,
          ranch: null,
          condiments: [],
          other: [],
        }}
      />
    );

    const button = screen.getByRole("button", { name: /Mark Consumption/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("Mark Consumption Status")).toBeInTheDocument();
    });

    // The initial status should be reflected in the selector
    expect(screen.getAllByText("Test Food")[0]).toBeInTheDocument(); // Get first occurrence
  });

  it("calls onSave when saving", async () => {
    render(
      <MarkConsumptionButton
        {...defaultProps}
        mealSelections={{
          proteins: [{
            id: 'protein-1',
            name: 'Chicken',
            category: 'proteins',
            meal: ['breakfast'],
            servings: 1,
            servingSize: '1',
            servingSizeUnit: 'piece',
            calories: 100,
            protein: 20,
            carbs: 0,
            fat: 5
          }],
          grains: [],
          fruits: [],
          vegetables: [],
          milk: null,
          ranch: null,
          condiments: [],
          other: [],
        }}
      />
    );

    const button = screen.getByRole("button", { name: /Mark Consumption/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("Mark Consumption Status")).toBeInTheDocument();
    });

    // Click on "Eaten" button for the specific food
    const eatenButton = screen.getByText("Eaten");
    fireEvent.click(eatenButton);

    // Click "Save Status"
    const saveButton = screen.getByText("Save Status");
    fireEvent.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
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
        mealTime: expect.any(String),
      })
    );
  });
});