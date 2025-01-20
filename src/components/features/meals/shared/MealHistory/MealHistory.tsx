// components/MealHistory.tsx
import { MealHistoryRecord } from "@/types/food";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistance, format, isToday, isYesterday } from "date-fns";

interface MealHistoryProps {
  historyEntries: MealHistoryRecord[];
}

// Helper function to get a human-readable date label
function getDateLabel(date: Date): string {
  if (isToday(date)) {
    return "Today";
  }
  if (isYesterday(date)) {
    return "Yesterday";
  }
  return format(date, "MMMM d, yyyy");
}

// Helper function to calculate total calories from selections
function calculateTotalCalories(
  selections: MealHistoryRecord["selections"]
): number {
  return Object.values(selections)
    .filter((food) => food !== null)
    .reduce((total, food) => {
      return total + (food?.adjustedCalories || 0);
    }, 0);
}

export function MealHistory({ historyEntries }: MealHistoryProps) {
  const entriesByDate = historyEntries.reduce((acc, entry) => {
    const dateKey = format(new Date(entry.date), "yyyy-MM-dd");
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(entry);
    return acc;
  }, {} as Record<string, MealHistoryRecord[]>);

  console.log(historyEntries);
  return (
    <div className="space-y-8">
      {Object.entries(entriesByDate).map(([date, entries]) => {
        const dateObj = new Date(date);

        return (
          <div key={date} className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center justify-between">
              <span>{getDateLabel(dateObj)}</span>
              <span className="text-sm text-gray-500">
                {formatDistance(dateObj, new Date(), { addSuffix: true })}
              </span>
            </h3>

            {entries.map((entry, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="capitalize">{entry.meal}</span>
                    <div className="text-sm text-gray-500">
                      {format(new Date(entry.date), "h:mm a")}
                    </div>
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(entry.selections)
                      .filter(([, food]) => food)
                      .map(([category, food]) => (
                        <div
                          key={category}
                          className="flex justify-between items-center"
                        >
                          <div>
                            <span className="font-medium">{food?.name}</span>
                            <div className="text-sm text-gray-600">
                              {food?.servings} serving(s) •{" "}
                              {food?.adjustedCalories} cal
                            </div>
                          </div>

                          {entry.consumptionData?.foods.find(
                            (f) => f.name === food?.name
                          ) && (
                            <div className="text-sm font-medium">
                              {
                                entry.consumptionData.foods.find(
                                  (f) => f.name === food?.name
                                )?.percentageEaten
                              }
                              % eaten
                            </div>
                          )}
                        </div>
                      ))}

                    <div className="mt-4 pt-4 border-t">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-gray-600">Total Calories</div>
                          <div className="font-medium">
                            {calculateTotalCalories(entry.selections)}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-600">Time Since Meal</div>
                          <div className="font-medium">
                            {formatDistance(new Date(entry.date), new Date(), {
                              addSuffix: true,
                            })}
                          </div>
                        </div>
                      </div>
                    </div>

                    {entry.consumptionData?.summary && (
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="font-medium mb-2">
                          Consumption Summary
                        </h4>
                        <p className="text-sm text-gray-600">
                          {entry.consumptionData.summary}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        );
      })}
    </div>
  );
}
