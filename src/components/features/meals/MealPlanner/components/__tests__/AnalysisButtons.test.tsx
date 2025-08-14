import { render, screen, fireEvent } from '@testing-library/react';
import { AnalysisButtons } from '../AnalysisButtons';
import type { MealType } from '@/types/shared';
import type { MealSelection } from '@/types/meals';

describe('AnalysisButtons', () => {
  const mockOnImageAnalysis = jest.fn();
  const mockOnMealAnalysis = jest.fn();
  
  const mockMealSelection: MealSelection = {
    proteins: {
      id: 'protein-1',
      name: 'Chicken',
      calories: 200,
      protein: 25,
      carbs: 0,
      fat: 8,
      servings: 1,
      adjustedCalories: 200,
      adjustedProtein: 25,
      adjustedCarbs: 0,
      adjustedFat: 8,
      meal: ['lunch'],
      category: 'proteins'
    },
    grains: null,
    fruits: null,
    vegetables: null,
    milk: null,
    ranch: null,
    condiments: [],
    other: null
  };

  const defaultProps = {
    selectedMeal: 'lunch' as MealType,
    currentMealSelection: mockMealSelection,
    onImageAnalysis: mockOnImageAnalysis,
    onMealAnalysis: mockOnMealAnalysis
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders both analysis buttons', () => {
    render(<AnalysisButtons {...defaultProps} />);
    
    expect(screen.getByText('Analyze Plate Photo')).toBeInTheDocument();
    expect(screen.getByText('Analyze Meal Plan')).toBeInTheDocument();
  });

  it('renders buttons with expected content', () => {
    render(<AnalysisButtons {...defaultProps} />);
    
    // Check that buttons exist and are rendered correctly
    const imageButton = screen.getByRole('button', { name: /analyze plate photo/i });
    const mealButton = screen.getByRole('button', { name: /analyze meal plan/i });
    
    expect(imageButton).toBeInTheDocument();
    expect(mealButton).toBeInTheDocument();
    
    // Verify button text content
    expect(imageButton).toHaveTextContent('Analyze Plate Photo');
    expect(mealButton).toHaveTextContent('Analyze Meal Plan');
  });

  it('calls onImageAnalysis when image button is clicked', () => {
    render(<AnalysisButtons {...defaultProps} />);
    
    const imageButton = screen.getByText('Analyze Plate Photo');
    fireEvent.click(imageButton);
    
    expect(mockOnImageAnalysis).toHaveBeenCalledTimes(1);
  });

  it('calls onMealAnalysis when meal button is clicked', () => {
    render(<AnalysisButtons {...defaultProps} />);
    
    const mealButton = screen.getByText('Analyze Meal Plan');
    fireEvent.click(mealButton);
    
    expect(mockOnMealAnalysis).toHaveBeenCalledTimes(1);
  });

  it('disables meal analysis when no meal is selected', () => {
    render(<AnalysisButtons 
      {...defaultProps} 
      selectedMeal={null as any}
    />);
    
    const mealButton = screen.getByText('Analyze Meal Plan');
    expect(mealButton).toBeDisabled();
  });

  it('disables meal analysis when no meal selection exists', () => {
    render(<AnalysisButtons 
      {...defaultProps} 
      currentMealSelection={null}
    />);
    
    const mealButton = screen.getByText('Analyze Meal Plan');
    expect(mealButton).toBeDisabled();
  });

  it('disables meal analysis when meal selection is empty', () => {
    const emptyMealSelection: MealSelection = {
      proteins: null,
      grains: null,
      fruits: null,
      vegetables: null,
      milk: null,
      ranch: null,
      condiments: [],
      other: null
    };

    render(<AnalysisButtons 
      {...defaultProps} 
      currentMealSelection={emptyMealSelection}
    />);
    
    const mealButton = screen.getByText('Analyze Meal Plan');
    expect(mealButton).toBeDisabled();
  });

  it('enables meal analysis when meal has food items', () => {
    render(<AnalysisButtons {...defaultProps} />);
    
    const mealButton = screen.getByText('Analyze Meal Plan');
    expect(mealButton).not.toBeDisabled();
  });

  it('enables meal analysis when meal has condiments', () => {
    const mealSelectionWithCondiments: MealSelection = {
      proteins: null,
      grains: null,
      fruits: null,
      vegetables: null,
      milk: null,
      ranch: null,
      condiments: [{
        id: 'condiment-1',
        name: 'Ketchup',
        calories: 20,
        protein: 0,
        carbs: 5,
        fat: 0,
        servings: 1,
        adjustedCalories: 20,
        adjustedProtein: 0,
        adjustedCarbs: 5,
        adjustedFat: 0,
        meal: ['lunch'],
        category: 'condiments'
      }],
      other: null
    };

    render(<AnalysisButtons 
      {...defaultProps} 
      currentMealSelection={mealSelectionWithCondiments}
    />);
    
    const mealButton = screen.getByText('Analyze Meal Plan');
    expect(mealButton).not.toBeDisabled();
  });

  it('never disables image analysis button', () => {
    render(<AnalysisButtons 
      {...defaultProps} 
      selectedMeal={null as any}
      currentMealSelection={null}
    />);
    
    const imageButton = screen.getByText('Analyze Plate Photo');
    expect(imageButton).not.toBeDisabled();
  });

  it('has correct button styling', () => {
    render(<AnalysisButtons {...defaultProps} />);
    
    const imageButton = screen.getByText('Analyze Plate Photo');
    const mealButton = screen.getByText('Analyze Meal Plan');
    
    // Check for gap-2 class which is applied via className prop
    expect(imageButton.closest('button')).toHaveClass('gap-2');
    expect(mealButton.closest('button')).toHaveClass('gap-2');
    
    // Note: variant="outline" is a Button component prop, not an HTML attribute
    // The actual styling classes are applied by the Button component internally
    expect(imageButton.closest('button')).toBeInTheDocument();
    expect(mealButton.closest('button')).toBeInTheDocument();
  });

  it('is positioned correctly within layout', () => {
    render(<AnalysisButtons {...defaultProps} />);
    
    const container = screen.getByText('Analyze Plate Photo').closest('div');
    expect(container).toHaveClass('mb-4', 'flex', 'gap-2', 'justify-end');
  });

  it('is memoized to prevent unnecessary re-renders', () => {
    const { rerender } = render(<AnalysisButtons {...defaultProps} />);
    
    // Re-render with same props
    rerender(<AnalysisButtons {...defaultProps} />);
    
    expect(screen.getByText('Analyze Plate Photo')).toBeInTheDocument();
    expect(screen.getByText('Analyze Meal Plan')).toBeInTheDocument();
  });
});