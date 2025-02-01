// src/components/features/meals/shared/MealHistory/MealHistory.tsx
import { format } from "date-fns";
import { MealHistoryRecord } from "@/types/food";
import { MealHistoryEntry } from "./MealHistoryEntry";
import { useEffect, useState } from "react";

interface MealHistoryProps {
  historyEntries: MealHistoryRecord[];
}

export function MealHistory({ historyEntries }: MealHistoryProps) {
  const [sortedEntries, setSortedEntries] = useState<
    Record<string, MealHistoryRecord[]>
  >({});

  // Sort and group entries whenever historyEntries changes
  useEffect(() => {
    const grouped = historyEntries.reduce((acc, entry) => {
      // Ensure we have a valid date
      if (!entry.date) {
        console.error("Entry missing date:", entry);
        return acc;
      }

      try {
        const entryDate = new Date(entry.date);
        if (isNaN(entryDate.getTime())) {
          console.error("Invalid date:", entry.date);
          return acc;
        }

        const dateKey = format(entryDate, "yyyy-MM-dd");
        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }
        acc[dateKey].push({
          ...entry,
          date: entry.date, // Keep the ISO string
        });
        return acc;
      } catch (error) {
        console.error("Error processing date:", entry.date, error);
        return acc;
      }
    }, {} as Record<string, MealHistoryRecord[]>);

    // Sort entries within each day
    Object.keys(grouped).forEach((date) => {
      grouped[date].sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA;
      });
    });

    setSortedEntries(grouped);
  }, [historyEntries]);

  return (
    <div className="space-y-8">
      {Object.entries(sortedEntries)
        .sort(
          ([dateA], [dateB]) =>
            new Date(dateB).getTime() - new Date(dateA).getTime()
        )
        .map(([date, entries]) => {
          const dateObj = new Date(date);

          return (
            <div key={date} className="space-y-4">
              <h3 className="text-lg font-semibold">{getDateLabel(dateObj)}</h3>
              <MealHistoryEntry date={date} entries={entries} />
            </div>
          );
        })}

      {Object.keys(sortedEntries).length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No meal history available
        </div>
      )}
    </div>
  );
}

// Helper function to get a human-readable date label
function getDateLabel(date: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dateToCheck = new Date(date);
  dateToCheck.setHours(0, 0, 0, 0);

  if (dateToCheck.getTime() === today.getTime()) {
    return "Today";
  }

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (dateToCheck.getTime() === yesterday.getTime()) {
    return "Yesterday";
  }

  return format(date, "EEEE, MMMM d, yyyy");
}
