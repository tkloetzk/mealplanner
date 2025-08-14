import React from 'react';
import { Button } from '@/components/ui/button';
import { Camera, MessageSquare } from 'lucide-react';
import type { MealType } from '@/types/shared';
import type { MealSelection } from '@/types/meals';

interface AnalysisButtonsProps {
  selectedMeal: MealType | null;
  currentMealSelection: MealSelection | null;
  onImageAnalysis: () => void;
  onMealAnalysis: () => void;
}

export const AnalysisButtons = React.memo(({ 
  selectedMeal, 
  currentMealSelection, 
  onImageAnalysis, 
  onMealAnalysis 
}: AnalysisButtonsProps) => {
  const isMealAnalysisDisabled = 
    !selectedMeal ||
    !currentMealSelection ||
    Object.values(currentMealSelection).every(
      (food) => !food || (Array.isArray(food) && food.length === 0)
    );

  return (
    <div className="mb-4 flex gap-2 justify-end">
      <Button
        variant="outline"
        className="gap-2"
        onClick={onImageAnalysis}
      >
        <Camera className="w-4 h-4" />
        Analyze Plate Photo
      </Button>

      <Button
        variant="outline"
        className="gap-2"
        onClick={onMealAnalysis}
        disabled={isMealAnalysisDisabled}
      >
        <MessageSquare className="w-4 w-4" />
        Analyze Meal Plan
      </Button>
    </div>
  );
});

AnalysisButtons.displayName = 'AnalysisButtons';