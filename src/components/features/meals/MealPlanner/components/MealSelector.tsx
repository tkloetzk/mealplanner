import React from 'react';
import { MEAL_TYPES } from '@/constants';
import type { MealType } from '@/types/shared';

interface MealSelectorProps {
  selectedMeal: MealType;
  onMealSelect: (meal: MealType) => void;
}

export const MealSelector = React.memo(({ selectedMeal, onMealSelect }: MealSelectorProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {(MEAL_TYPES as readonly MealType[]).map((meal) => (
        <button
          key={meal}
          onClick={() => onMealSelect(meal)}
          data-testid={`${meal}-meal-button`}
          className={`p-4 rounded-lg text-lg capitalize ${
            selectedMeal === meal
              ? "bg-blue-500 text-white"
              : "bg-gray-100 hover:bg-gray-200"
          }`}
        >
          {meal}
        </button>
      ))}
    </div>
  );
});

MealSelector.displayName = 'MealSelector';