// src/components/features/meals/shared/MealHistory/MealHistory.tsx
import { format, isToday, isYesterday, startOfDay, parseISO } from "date-fns";
import { MealHistoryRecord } from "@/types/meals";
import { MealHistoryEntry } from "./MealHistoryEntry";
import { useMemo } from "react";

interface MealHistoryProps {
  historyEntries: MealHistoryRecord[];
}

// Helper function to safely parse and normalize a date
function normalizeDate(date: Date | string): Date {
  try {
    const parsedDate = typeof date === "string" ? parseISO(date) : date;
    return startOfDay(parsedDate);
  } catch {
    return new Date(0); // Return epoch if date is invalid
  }
}

export function MealHistory({ historyEntries = [] }: MealHistoryProps) {
  const sortedEntries = useMemo(() => {
    // Early return for null/undefined/non-array values
    if (!Array.isArray(historyEntries)) {
      return {};
    }

    const grouped = historyEntries.reduce((acc, entry) => {
      if (!entry?.date) return acc;

      try {
        const normalizedDate = normalizeDate(entry.date);
        if (isNaN(normalizedDate.getTime())) return acc;

        const dateKey = format(normalizedDate, "yyyy-MM-dd");
        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }
        acc[dateKey].push(entry);
        return acc;
      } catch {
        return acc;
      }
    }, {} as Record<string, MealHistoryRecord[]>);

    // Sort entries within each day
    Object.keys(grouped).forEach((date) => {
      grouped[date].sort((a, b) => {
        const dateA = normalizeDate(a.date).getTime();
        const dateB = normalizeDate(b.date).getTime();
        return dateB - dateA;
      });
    });

    return grouped;
  }, [historyEntries]);

  if (Object.keys(sortedEntries).length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No meal history available
      </div>
    );
  }

  // Sort dates in descending order
  const sortedDates = Object.entries(sortedEntries).sort(([dateA], [dateB]) => {
    const dateAObj = normalizeDate(dateA);
    const dateBObj = normalizeDate(dateB);
    return dateBObj.getTime() - dateAObj.getTime();
  });

  return (
    <div className="space-y-8">
      {sortedDates.map(([date, entries]) => {
        const normalizedDate = normalizeDate(date);
        const dateLabel = getDateLabel(normalizedDate);

        return (
          <div key={date} className="space-y-4">
            <h3
              className="text-lg font-semibold"
              data-testid={`date-header-${dateLabel.toLowerCase()}`}
            >
              {dateLabel}
            </h3>
            <MealHistoryEntry entries={entries} />
          </div>
        );
      })}
    </div>
  );
}

// Helper function to get a human-readable date label
function getDateLabel(date: Date): string {
  const normalizedDate = normalizeDate(date);
  if (isToday(normalizedDate)) return "Today";
  if (isYesterday(normalizedDate)) return "Yesterday";
  return format(normalizedDate, "MMMM d, yyyy");
}
