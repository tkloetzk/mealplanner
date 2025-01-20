// components/MealHistory.tsx
import {
  ConsumptionData,
  MealHistoryRecord,
  MealSelection,
} from "@/types/food";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistance, format, isToday, isYesterday } from "date-fns";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FoodImageConsumptionAnalysis } from "@/components/features/food/FoodAnalysis/components/FoodImageConsumptionAnalysis";

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
  const [selectedEntry, setSelectedEntry] = useState<MealHistoryRecord | null>(
    null
  );
  const [showPlateAnalysis, setShowPlateAnalysis] = useState(false);
  const entriesByDate = historyEntries.reduce((acc, entry) => {
    const dateKey = format(new Date(entry.date), "yyyy-MM-dd");
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(entry);
    return acc;
  }, {} as Record<string, MealHistoryRecord[]>);

  console.log(historyEntries);

  const formatMealSelections = (selections: MealSelection): string => {
    //return "1 serving of Kashi Oat Cereal, 1 cup of strawberries (red fruit with a little green on top), 1 cup of blueberries (small round blue fruit), and 1 scrambled egg";
    return Object.entries(selections)
      .filter(([_, food]) => food !== null)
      .map(([category, food]) => {
        // Include serving size information for more accurate analysis
        return `${food?.servingSize} ${food.servingSizeUnit} of ${food?.name}`;
      })
      .join(", ");
  };
  // When analysis is complete, we'll update the history entry
  // components/MealHistory.tsx
  const handleAnalysisComplete = async (
    entryId: string | undefined,
    analysisData: ConsumptionData
  ) => {
    // Add early return if we don't have a valid ID
    if (!entryId) {
      console.error("No entry ID provided for analysis update");
      return;
    }

    try {
      const response = await fetch(`/api/meal-history/${entryId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ consumptionData: analysisData }),
      });

      if (!response.ok) {
        throw new Error("Failed to update meal history");
      }

      setShowPlateAnalysis(false);
      setSelectedEntry(null);
    } catch (error) {
      console.error("Failed to update meal history:", error);
    }
  };
  return (
    <div className="space-y-8">
      {Object.entries(entriesByDate).map(([date, entries]) => {
        const dateObj = new Date(date);

        console.log(entries[0]?.consumptionData?.foods);
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
                    <span className="capitalize">
                      {typeof entry.meal === "string" ? entry.meal : ""}
                    </span>
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
                            <div
                              data-testid={`${food.name}-servings`}
                              className="text-sm text-gray-600"
                            >
                              {food?.servings} serving(s)
                            </div>
                          </div>

                          {entry.consumptionData?.foods?.find(
                            (f) => f.name === food?.name
                          ) && (
                            <div className="text-sm font-medium">
                              {
                                entry.consumptionData.foods?.find(
                                  (f) => f.name === food?.name
                                )?.percentageEaten
                              }
                              % eaten
                            </div>
                          )}
                        </div>
                      ))}

                    {!entry.consumptionData && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedEntry(entry);
                          setShowPlateAnalysis(true);
                        }}
                        className="mt-4"
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Add Plate Photo
                      </Button>
                    )}
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

                    {/* Display consumption data if it exists */}
                    {entry.consumptionData && (
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="font-medium mb-2">
                          Consumption Analysis
                        </h4>
                        {entry.consumptionData?.foods?.map((food, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between items-center mb-2"
                          >
                            <span>{food.name}</span>
                            <span className="text-sm text-gray-600">
                              {food.percentageEaten}% eaten
                            </span>
                          </div>
                        ))}
                        <p className="text-sm text-gray-600 mt-2">
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
      })}{" "}
      {/* Plate analysis dialog */}
      <Dialog open={showPlateAnalysis} onOpenChange={setShowPlateAnalysis}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Analyze Plate Photo</DialogTitle>
          </DialogHeader>

          {selectedEntry && (
            <FoodImageConsumptionAnalysis
              originalMeal={formatMealSelections(selectedEntry.selections)}
              onAnalysisComplete={(analysisData) => {
                // TypeScript knows selectedEntry is not null here
                // because of the conditional rendering
                handleAnalysisComplete(selectedEntry._id, analysisData);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
