// components/MealHistory.tsx
import { format } from "date-fns";
import { MealHistoryRecord } from "@/types/food";
import { MealHistoryEntry } from "./MealHistoryEntry";

interface MealHistoryProps {
  historyEntries: MealHistoryRecord[];
}

export function MealHistory({ historyEntries }: MealHistoryProps) {
  // Group entries by date
  const entriesByDate = historyEntries.reduce((acc, entry) => {
    const dateKey = format(new Date(entry.date), "yyyy-MM-dd");
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(entry);
    return acc;
  }, {} as Record<string, MealHistoryRecord[]>);

  return (
    <div className="space-y-8">
      {Object.entries(entriesByDate).map(([date, entries]) => {
        const dateObj = new Date(date);

        return (
          <div key={date} className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center justify-between">
              <span>{getDateLabel(dateObj)}</span>
              <span className="text-sm text-gray-500">
                {format(dateObj, "PPp")}
              </span>
            </h3>

            {entries.map((entry, index) => (
              <MealHistoryEntry key={index} entry={entry} />
            ))}
          </div>
        );
      })}
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

  return format(date, "MMMM d, yyyy");
}
