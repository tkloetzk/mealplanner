// utils/dateUtils.ts
import { DayType } from "@/types/shared";

// Days of the week in order, starting with Sunday (matching JavaScript's Date.getDay())
const DAYS: readonly DayType[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

// Day name to number mapping for consistent date calculations  
const DAYS_MAP: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

export function getCurrentDay(date: Date = new Date()): DayType {
  return DAYS[date.getDay()];
}

export const getOrderedDays = (date: Date = new Date()): DayType[] => {
  const today = date.getDay();
  return [...DAYS.slice(today), ...DAYS.slice(0, today)];
};

/**
 * Calculate a target date based on a day name and current date
 * Used for meal planning to get the correct date for a selected day
 */
export function calculateTargetDate(selectedDay: DayType, baseDate: Date = new Date()): Date {
  const currentDay = baseDate.getDay();
  const targetDay = DAYS_MAP[selectedDay.toLowerCase()];
  
  if (targetDay === undefined) {
    throw new Error(`Invalid day selected: ${selectedDay}`);
  }

  let diff = targetDay - currentDay;
  // If the target day is earlier in the week than the current day,
  // we want next week's occurrence of that day for meal planning
  if (diff < 0) {
    diff += 7;
  }

  const targetDate = new Date(baseDate);
  targetDate.setDate(baseDate.getDate() + diff);
  return targetDate;
}
