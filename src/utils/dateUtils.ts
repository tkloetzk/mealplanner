// utils/dateUtils.ts
import { DayType } from "@/types/food";

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
export function getCurrentDay(date: Date = new Date()): DayType {
  return DAYS[date.getDay()];
}
