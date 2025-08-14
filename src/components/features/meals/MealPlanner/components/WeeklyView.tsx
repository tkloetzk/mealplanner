import React from 'react';
import { Card } from '@/components/ui/card';
import { DAYS_OF_WEEK } from '@/constants/index';
import type { DayType, MealType } from '@/types/shared';
import type { MealSelections, NutritionSummary } from '@/types/meals';

interface WeeklyViewProps {
  selections: MealSelections;
  calculateMealNutrition: (meal: MealType) => NutritionSummary;
}

export const WeeklyView = React.memo(({ selections, calculateMealNutrition }: WeeklyViewProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
      {DAYS_OF_WEEK.map((day: DayType) => (
        <Card key={day} className="p-4">
          <h3 className="text-lg font-semibold capitalize mb-3">
            {day}
          </h3>
          {Object.entries(selections[day] ?? {}).map(([meal]) => {
            const nutrition = calculateMealNutrition(meal as MealType);
            if (nutrition.calories > 0) {
              return (
                <div key={meal} className="mb-4 p-2 bg-gray-50 rounded">
                  <div className="font-medium capitalize">{meal}</div>
                  <div className="text-sm text-gray-600">
                    {Math.round(nutrition.calories)} cal | P:{" "}
                    {Math.round(nutrition.protein)}g
                  </div>
                </div>
              );
            }
            return null;
          })}
        </Card>
      ))}
    </div>
  );
});

WeeklyView.displayName = 'WeeklyView';