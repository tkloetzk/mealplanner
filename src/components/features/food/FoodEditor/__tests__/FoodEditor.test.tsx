import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FoodEditor } from "../FoodEditor";
describe("FoodEditor - Other Category", () => {
  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows selecting "Other" category', () => {
    render(<FoodEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

    // Open category dropdown
    const categoryTrigger = screen.getByRole("combobox", { name: /category/i });
    fireEvent.click(categoryTrigger);

    // Select "Other" category
    const otherOption = screen.getByRole("option", { name: /other/i });
    fireEvent.click(otherOption);

    // Verify "Other" is selected
    expect(categoryTrigger).toHaveTextContent(/other/i);
  });

  it("allows toggling child visibility", async () => {
    render(<FoodEditor onSave={mockOnSave} onCancel={mockOnCancel} />);

    // Fill out required fields
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: "Test Other Food" },
    });
    fireEvent.change(screen.getByLabelText(/calories/i), {
      target: { value: "200" },
    });

    // Open category dropdown and select "Other"
    const categoryTrigger = screen.getByRole("combobox", { name: /category/i });
    fireEvent.click(categoryTrigger);
    const otherOption = screen.getByRole("option", { name: /other/i });
    fireEvent.click(otherOption);

    // Find and click the "Show to children" checkbox
    const childVisibilityCheckbox = screen.getByRole("checkbox", {
      name: /show to children/i,
    });
    fireEvent.click(childVisibilityCheckbox);

    // Submit the form
    const saveButton = screen.getByRole("button", { name: /save food/i });
    fireEvent.click(saveButton);

    // Verify save was called with correct hiddenFromChild value
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          category: "other",
          hiddenFromChild: false,
        })
      );
    });
  });
});
