import React from 'react';
import { getOrderedDays } from '@/utils/dateUtils';
import type { DayType } from '@/types/shared';

interface DaySelectorProps {
  selectedDay: DayType;
  onDaySelect: (day: DayType) => void;
}

export const DaySelector = React.memo(({ selectedDay, onDaySelect }: DaySelectorProps) => {
  return (
    <div className="flex space-x-2 overflow-x-auto pb-2 mb-4">
      {getOrderedDays().map((day, i) => (
        <button
          key={i}
          onClick={() => onDaySelect(day as DayType)}
          className={`px-4 py-2 rounded-lg capitalize ${
            selectedDay === day
              ? "bg-blue-500 text-white"
              : "bg-gray-100"
          }`}
        >
          {day as string}
        </button>
      ))}
    </div>
  );
});

DaySelector.displayName = 'DaySelector';