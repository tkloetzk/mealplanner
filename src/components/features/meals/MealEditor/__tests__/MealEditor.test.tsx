import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MealEditor } from '../MealEditor';
import { MealType, CategoryType } from '@/types/shared';
import { MealSelection } from '@/types/meals';
import { Food } from '@/types/food';

const mockFoods: Record<CategoryType, Food[]> = {
  proteins: [
    {
      id: '1',
      name: 'Chicken',
      calories: 165,
      protein: 31,
      carbs: 0,
      fat: 3.6,
      servings: 1,
      servingSize: '1',
      servingSizeUnit: 'piece',
      category: 'proteins',
      meal: ['breakfast', 'lunch', 'dinner'],
      hiddenFromChild: false
    }
  ],
  grains: [],
  fruits: [],
  vegetables: [],
  milk: [],
  ranch: [],
  condiments: [],
  other: []
};

describe('MealEditor', () => {
  const user = userEvent.setup();
  
  const mockOnSave = jest.fn();
  const mockOnClose = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockFoods)
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onSave: mockOnSave,
    mealType: 'breakfast' as MealType
  };

  it('renders correctly with default props', async () => {
    render(<MealEditor {...defaultProps} />);
    
    // Check basic elements
    expect(screen.getByText('Create New Meal')).toBeInTheDocument();
    expect(screen.getByLabelText('Meal Name')).toBeInTheDocument();
    expect(screen.getByText(/this meal will be saved as a breakfast option/i)).toBeInTheDocument();
    
    // Check tabs
    expect(screen.getByRole('tab', { name: /select/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /describe/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /recipe/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /scan/i })).toBeInTheDocument();

    // Verify foods are fetched
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/foods');
    });
  });

  it('renders edit mode correctly with initial selections', () => {
    const initialSelections: MealSelection = {
      proteins: mockFoods.proteins[0],
      grains: null,
      fruits: null,
      vegetables: null,
      milk: null,
      ranch: null,
      condiments: [],
      other: null
    };

    render(<MealEditor {...defaultProps} initialSelections={initialSelections} />);
    
    expect(screen.getByText('Edit Meal')).toBeInTheDocument();
  });

  it('handles food selection in select mode', async () => {
    render(<MealEditor {...defaultProps} />);

    // Wait for foods to load
    await waitFor(() => {
      expect(screen.getByText('Chicken')).toBeInTheDocument();
    });

    // Select a food
    const foodItem = screen.getByText('Chicken');
    await user.click(foodItem);

    // Try to save
    const nameInput = screen.getByLabelText('Meal Name');
    await user.type(nameInput, 'Test Meal');

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    expect(mockOnSave).toHaveBeenCalled();
  });

  it('validates meal name before saving', async () => {
    render(<MealEditor {...defaultProps} />);

    // Try to save without a name
    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    expect(screen.getByText('Please enter a meal name')).toBeInTheDocument();
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('validates food selection before saving in select mode', async () => {
    render(<MealEditor {...defaultProps} />);

    // Enter name but don't select any foods
    const nameInput = screen.getByLabelText('Meal Name');
    await user.type(nameInput, 'Test Meal');

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    expect(screen.getByText('Please select at least one food item')).toBeInTheDocument();
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('handles description mode input', async () => {
    render(<MealEditor {...defaultProps} />);

    // Switch to description tab
    const describeTab = screen.getByRole('tab', { name: /describe/i });
    await user.click(describeTab);

    // Enter meal name and description
    const nameInput = screen.getByLabelText('Meal Name');
    await user.type(nameInput, 'Test Meal');

    const descriptionTextarea = screen.getByRole('textbox', { name: /describe/i });
    await user.type(descriptionTextarea, 'A healthy breakfast bowl');

    // Try to save
    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    // Should show error about unimplemented mode
    expect(screen.getByText('Description mode not implemented yet')).toBeInTheDocument();
  });

  it('handles recipe mode input', async () => {
    render(<MealEditor {...defaultProps} />);

    // Switch to recipe tab
    const recipeTab = screen.getByRole('tab', { name: /recipe/i });
    await user.click(recipeTab);

    // Enter meal name and recipe
    const nameInput = screen.getByLabelText('Meal Name');
    await user.type(nameInput, 'Test Meal');

    const recipeTextarea = screen.getByRole('textbox', { name: /recipe/i });
    await user.type(recipeTextarea, 'Recipe instructions here');

    // Try to save
    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    // Should show error about unimplemented mode
    expect(screen.getByText('Recipe mode not implemented yet')).toBeInTheDocument();
  });

  it('closes when cancel is clicked', async () => {
    render(<MealEditor {...defaultProps} />);
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('resets state when closed and reopened', async () => {
    const { rerender } = render(<MealEditor {...defaultProps} />);

    // Enter some data
    const nameInput = screen.getByLabelText('Meal Name');
    await user.type(nameInput, 'Test Meal');

    // Close the editor
    rerender(<MealEditor {...defaultProps} isOpen={false} />);

    // Reopen the editor
    rerender(<MealEditor {...defaultProps} isOpen={true} />);

    // Verify the name input is reset
    expect(screen.getByLabelText('Meal Name')).toHaveValue('');
  });

  it('allows interaction after error is shown', async () => {
    render(<MealEditor {...defaultProps} />);

    // Try to save without a name first
    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    // Verify error is shown
    expect(screen.getByText('Please enter a meal name')).toBeInTheDocument();

    // Enter a valid name
    const nameInput = screen.getByLabelText('Meal Name');
    await user.type(nameInput, 'Test Meal');

    // Try to save again and verify the error message changes
    await user.click(saveButton);
    expect(mockOnSave).not.toHaveBeenCalled();
    expect(screen.getByText('Please select at least one food item')).toBeInTheDocument();

    // Switch to describe tab and verify we can still interact
    const describeTab = screen.getByRole('tab', { name: /describe/i });
    await user.click(describeTab);
    
    // Verify we can interact with the description textarea
    const descriptionTextarea = screen.getByRole('textbox', { name: /describe the meal/i });
    await user.type(descriptionTextarea, 'A test meal');
    expect(descriptionTextarea).toHaveValue('A test meal');

    // Try to save in describe mode
    await user.click(saveButton);
    expect(screen.getByText('Description mode not implemented yet')).toBeInTheDocument();

    // Finally verify cancel closes the dialog
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);
    expect(mockOnClose).toHaveBeenCalled();
  });
}); 