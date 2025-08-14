import React from 'react';
import { MealHistory } from '@/components/features/meals/shared/MealHistory/MealHistory';
import type { MealHistoryRecord } from '@/types/meals';

interface HistoryViewProps {
  selectedKid: string;
  isLoading: boolean;
  mealHistory: Record<string, MealHistoryRecord[]>;
}

export const HistoryView = React.memo(({ selectedKid, isLoading, mealHistory }: HistoryViewProps) => {
  if (!selectedKid) {
    return (
      <div className="text-center py-12 text-gray-500">
        Please select a kid to view their meal history
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!mealHistory[selectedKid]) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading meal history...</p>
      </div>
    );
  }

  if (mealHistory[selectedKid].length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No meal history available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <MealHistory historyEntries={mealHistory[selectedKid]} />
    </div>
  );
});

HistoryView.displayName = 'HistoryView';