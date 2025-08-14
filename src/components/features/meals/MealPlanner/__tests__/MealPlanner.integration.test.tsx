import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MealPlanner } from '../MealPlanner';
import { MOCK_FOODS } from '@/__mocks__/testConstants';
import type { Food } from '@/types/food';

// Mock the meal service
jest.mock('@/services/meal/mealService', () => ({
  mealService: {
    getMealHistory: jest.fn().mockResolvedValue({
      success: true,
      data: [],
    }),
  },
}));

// Mock the food management hook
jest.mock('../hooks/useFoodManagement', () => ({
  useFoodManagement: () => ({
    foodOptions: MOCK_FOODS,
    selectedFoodContext: null,
    setSelectedFoodContext: jest.fn(),
    fetchFoodOptions: jest.fn(),
    handleToggleVisibility: jest.fn(),
    handleToggleAllOtherFoodVisibility: jest.fn(),
    handleSaveFood: jest.fn(),
    handleDeleteFood: jest.fn(),
  }),
}));

// Mock the lazy components to avoid Suspense issues in tests
jest.mock('../components/LazyComponents', () => ({
  LazyFoodImageAnalysis: ({ onAnalysisComplete }: any) => (
    <div data-testid="mock-food-image-analysis">
      <button 
        onClick={() => onAnalysisComplete('mock analysis')}
        data-testid="mock-analyze-button"
      >
        Mock Analyze
      </button>
    </div>
  ),
  LazyMealAnalysis: ({ isOpen, onClose }: any) => 
    isOpen ? (
      <div data-testid="mock-meal-analysis">
        <button onClick={onClose} data-testid="mock-close-analysis">
          Close Analysis
        </button>
      </div>
    ) : null,
  LazyFoodEditor: ({ onSave, onCancel, initialFood }: any) => (
    <div data-testid="mock-food-editor">
      <input 
        data-testid="food-name-input" 
        defaultValue={initialFood?.name || ''}
      />
      <button onClick={() => onSave({ ...initialFood, name: 'Updated Food' })}>
        Save Food
      </button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
  LazyMealEditor: ({ isOpen, onClose, onSave }: any) => 
    isOpen ? (
      <div data-testid="mock-meal-editor">
        <button onClick={() => onSave('Test Meal', {})}>
          Save Meal
        </button>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
  LazyChildView: ({ selectedMeal, onMealSelect }: any) => (
    <div data-testid="mock-child-view">
      <p>Child View - {selectedMeal}</p>
      <button onClick={() => onMealSelect('lunch')}>
        Select Lunch
      </button>
    </div>
  ),
  ComponentLoader: () => <div data-testid="component-loader">Loading...</div>
}));

jest.mock('../hooks/useMealHistory', () => ({
  useMealHistory: () => ({
    isLoading: false,
    fetchMealHistory: jest.fn(),
    handleSaveMeal: jest.fn()
  })
}));

describe('MealPlanner Integration Tests', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    // Reset any mock implementations
    jest.clearAllMocks();
    
    // Mock fetch calls
    global.fetch = jest.fn().mockImplementation((url) => {
      if (url === '/api/foods') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(MOCK_FOODS),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });
  });

  it('renders initial state correctly', () => {
    render(<MealPlanner />);
    
    expect(screen.getByTestId('meal-planner')).toBeInTheDocument();
    expect(screen.getByText('Presley')).toBeInTheDocument();
    expect(screen.getByText('Evy')).toBeInTheDocument();
  });

  it('shows kids are available for selection', () => {
    render(<MealPlanner />);
    
    // Kids should be visible and selectable, with first kid (Presley) selected by default
    expect(screen.getByText('Presley')).toBeInTheDocument();
    expect(screen.getByText('Evy')).toBeInTheDocument();
    
    // Presley should be selected by default (has blue background)
    const presleyButton = screen.getByText('Presley');
    expect(presleyButton).toHaveClass('bg-blue-500', 'text-white');
  });

  it('allows kid selection and shows meal planner', async () => {
    render(<MealPlanner />);
    
    const presleyButton = screen.getByText('Presley');
    await user.click(presleyButton);
    
    await waitFor(() => {
      expect(screen.getByText('Daily Planner')).toBeInTheDocument();
      expect(screen.getByText('Weekly View')).toBeInTheDocument();
      expect(screen.getByText('History')).toBeInTheDocument();
    });
  });

  it('switches between tabs correctly', async () => {
    render(<MealPlanner />);
    
    // Select a kid first
    const presleyButton = screen.getByText('Presley');
    await user.click(presleyButton);
    
    await waitFor(() => {
      expect(screen.getByText('Daily Planner')).toBeInTheDocument();
    });

    // Switch to Weekly View
    const weeklyTab = screen.getByText('Weekly View');
    await user.click(weeklyTab);
    
    await waitFor(() => {
      expect(screen.getByText('monday')).toBeInTheDocument();
    });

    // Switch to History
    const historyTab = screen.getByText('History');
    await user.click(historyTab);
    
    await waitFor(() => {
      // History tab shows loading initially, then may show no data or actual history
      expect(screen.getByText('Loading meal history...')).toBeInTheDocument();
    });
  });

  it('allows day and meal selection', async () => {
    render(<MealPlanner />);
    
    // Select kid
    const presleyButton = screen.getByText('Presley');
    await user.click(presleyButton);
    
    await waitFor(() => {
      expect(screen.getByText('tuesday')).toBeInTheDocument();
    });

    // Select Tuesday
    const tuesdayButton = screen.getByText('tuesday');
    await user.click(tuesdayButton);
    
    expect(tuesdayButton).toHaveClass('bg-blue-500', 'text-white');

    // Select lunch meal
    await waitFor(() => {
      expect(screen.getByTestId('lunch-meal-button')).toBeInTheDocument();
    });
    
    const lunchButton = screen.getByTestId('lunch-meal-button');
    await user.click(lunchButton);
    
    expect(lunchButton).toHaveClass('bg-blue-500', 'text-white');
  });

  it('displays food categories and options', async () => {
    render(<MealPlanner />);
    
    // Select kid
    const presleyButton = screen.getByText('Presley');
    await user.click(presleyButton);
    
    await waitFor(() => {
      // Check for food categories
      expect(screen.getByText('proteins')).toBeInTheDocument();
      expect(screen.getByText('fruits')).toBeInTheDocument();
      expect(screen.getByText('vegetables')).toBeInTheDocument();
    });

    // Check for specific foods
    await waitFor(() => {
      expect(screen.getByText('Chicken Breast')).toBeInTheDocument();
      expect(screen.getByText('Apple')).toBeInTheDocument();
      expect(screen.getByText('Broccoli')).toBeInTheDocument();
    });
  });

  it('shows milk toggle for non-snack meals', async () => {
    render(<MealPlanner />);
    
    // Select kid
    const presleyButton = screen.getByText('Presley');
    await user.click(presleyButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('breakfast-meal-button')).toBeInTheDocument();
    });

    // Select breakfast (should show milk toggle)
    const breakfastButton = screen.getByTestId('breakfast-meal-button');
    await user.click(breakfastButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('milk-toggle')).toBeInTheDocument();
    });

    // Select snack (should not show milk toggle)
    const snackButton = screen.getByTestId('snack-meal-button');
    await user.click(snackButton);
    
    await waitFor(() => {
      expect(screen.queryByTestId('milk-toggle')).not.toBeInTheDocument();
    });
  });

  it('maintains responsive design classes', () => {
    render(<MealPlanner />);
    
    const container = screen.getByTestId('meal-planner');
    expect(container).toHaveClass('container', 'mx-auto', 'p-4');
  });
});