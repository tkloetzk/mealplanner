import type { Food } from '@/types/food';
import type { MealHistoryRecord, MealSelection } from '@/types/meals';
import type { CategoryType, MealType, DayType } from '@/types/shared';

// Mock data for tests - no MSW dependencies
export const mockFoods: Record<CategoryType, Food[]> = {
  proteins: [
    {
      id: 'protein-1',
      name: 'Chicken Breast',
      calories: 165,
      protein: 31,
      carbs: 0,
      fat: 3.6,
      meal: ['breakfast', 'lunch', 'dinner'],
      category: 'proteins',
      servingSize: '1',
      servingSizeUnit: 'piece'
    },
    {
      id: 'protein-2', 
      name: 'Eggs',
      calories: 155,
      protein: 13,
      carbs: 1,
      fat: 11,
      meal: ['breakfast', 'lunch', 'dinner'],
      category: 'proteins',
      servingSize: '2',
      servingSizeUnit: 'piece'
    }
  ],
  grains: [
    {
      id: 'grain-1',
      name: 'Brown Rice',
      calories: 216,
      protein: 5,
      carbs: 45,
      fat: 1.8,
      meal: ['lunch', 'dinner'],
      category: 'grains',
      servingSize: '1',
      servingSizeUnit: 'cup'
    }
  ],
  fruits: [
    {
      id: 'fruit-1',
      name: 'Apple',
      calories: 95,
      protein: 0.5,
      carbs: 25,
      fat: 0.3,
      meal: ['breakfast', 'snack'],
      category: 'fruits',
      servingSize: '1',
      servingSizeUnit: 'piece'
    }
  ],
  vegetables: [
    {
      id: 'veg-1',
      name: 'Broccoli',
      calories: 34,
      protein: 2.8,
      carbs: 7,
      fat: 0.4,
      meal: ['lunch', 'dinner'],
      category: 'vegetables',
      servingSize: '1',
      servingSizeUnit: 'cup'
    }
  ],
  condiments: [
    {
      id: 'condiment-1',
      name: 'Ketchup',
      calories: 17,
      protein: 0.2,
      carbs: 4.7,
      fat: 0.1,
      meal: ['lunch', 'dinner'],
      category: 'condiments',
      servingSize: '1',
      servingSizeUnit: 'tbsp'
    }
  ],
  other: [
    {
      id: 'other-1',
      name: 'Crackers',
      calories: 142,
      protein: 2.4,
      carbs: 22,
      fat: 5.4,
      meal: ['snack'],
      category: 'other',
      servingSize: '10',
      servingSizeUnit: 'piece'
    }
  ]
};

export const mockMealHistory: MealHistoryRecord[] = [];

// Helper functions for tests
export const clearMockMealHistory = () => {
  mockMealHistory.length = 0;
};