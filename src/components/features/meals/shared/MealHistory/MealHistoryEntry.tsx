// src/components/features/meals/shared/MealHistory/MealHistoryEntry.tsx

import { format } from "date-fns";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MealHistoryRecord } from "@/types/food";

interface MealHistoryEntryProps {
  entry: MealHistoryRecord;
}

export function MealHistoryEntry({ entry }: MealHistoryEntryProps) {
  // Group condiments, handling both array and object cases
  const groupedCondiments = (() => {
    const condiments = entry.selections.condiments;

    // If it's an array, use existing logic
    if (Array.isArray(condiments)) {
      return condiments.reduce((acc, condiment) => {
        const subcategory = condiment.subcategory || "Other";
        if (!acc[subcategory]) {
          acc[subcategory] = [];
        }
        acc[subcategory].push(condiment);
        return acc;
      }, {} as Record<string, any[]>);
    }

    // If it's an object, create a single "Other" group
    if (
      condiments &&
      typeof condiments === "object" &&
      !Array.isArray(condiments)
    ) {
      const groupedObj: Record<string, any[]> = {
        Other: [condiments],
      };
      return groupedObj;
    }

    // If no condiments, return empty object
    return {};
  })();

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <span className="font-medium capitalize">{entry.meal}</span>
          <span className="text-sm text-gray-500">
            {format(new Date(entry.date), "h:mm a")}
          </span>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Main Foods */}
          {Object.entries(entry.selections)
            .filter(
              ([category, food]) =>
                food !== null &&
                category !== "condiments" &&
                category !== "milk" &&
                category !== "ranch"
            )
            .map(([category, food]) => (
              <div key={category} className="flex justify-between items-center">
                <div>
                  <span className="font-medium">{food.name}</span>
                  <div className="text-sm text-gray-600">
                    {food.servings} serving(s)
                  </div>
                </div>

                {entry.consumptionData?.foods?.find(
                  (f) => f.name === food.name
                ) && (
                  <div className="text-sm font-medium">
                    {
                      entry.consumptionData.foods.find(
                        (f) => f.name === food.name
                      )?.percentageEaten
                    }
                    % eaten
                  </div>
                )}
              </div>
            ))}

          {/* Milk and Ranch */}
          {entry.selections.milk && (
            <div className="flex justify-between items-center">
              <div>
                <span className="font-medium">
                  {entry.selections.milk.name}
                </span>
                <div className="text-sm text-gray-600">
                  {entry.selections.milk.servings} serving(s)
                </div>
              </div>
            </div>
          )}

          {entry.selections.ranch && (
            <div className="flex justify-between items-center">
              <div>
                <span className="font-medium">
                  {entry.selections.ranch.name}
                </span>
                <div className="text-sm text-gray-600">
                  {entry.selections.ranch.servings} serving(s)
                </div>
              </div>
            </div>
          )}

          {/* Condiments Section */}
          {Object.keys(groupedCondiments).length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Added Toppings:
              </h4>
              {Object.entries(groupedCondiments).map(
                ([subcategory, condiments]) => (
                  <div key={subcategory} className="mb-2">
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                      {subcategory}
                    </div>
                    <div className="space-y-2">
                      {condiments.map((condiment, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center"
                        >
                          <div>
                            <span className="text-sm">{condiment.name}</span>
                            <div className="text-xs text-gray-600">
                              {condiment.servings || 1}{" "}
                              {condiment.servingSizeUnit}
                            </div>
                          </div>

                          {entry.consumptionData?.foods?.find(
                            (f) => f.name === condiment.name
                          ) && (
                            <div className="text-xs font-medium">
                              {
                                entry.consumptionData.foods.find(
                                  (f) => f.name === condiment.name
                                )?.percentageEaten
                              }
                              % used
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          {/* Nutrition Summary */}
          <div className="mt-4 pt-4 border-t border-gray-100">
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
                  {format(new Date(entry.date), "PPp")}
                </div>
              </div>
            </div>
          </div>

          {/* Consumption Summary */}
          {entry.consumptionData?.summary && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="text-sm text-gray-600">
                {entry.consumptionData.summary}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to calculate total calories
function calculateTotalCalories(selections: any) {
  try {
    // Calculate calories from main foods
    const mainCalories = Object.entries(selections)
      .filter(
        ([category, food]) =>
          food !== null &&
          category !== "condiments" &&
          category !== "milk" &&
          category !== "ranch"
      )
      .reduce((sum, [, food]) => {
        const calories =
          (food as any).adjustedCalories || (food as any).calories || 0;
        return sum + Number(calories);
      }, 0);

    // Add calories from milk
    const milkCalories = Number(
      selections.milk?.adjustedCalories || selections.milk?.calories || 0
    );

    // Add calories from ranch
    const ranchCalories = Number(
      selections.ranch?.adjustedCalories || selections.ranch?.calories || 0
    );

    // Add calories from condiments
    let condimentCalories = 0;
    const condiments = selections.condiments;

    // Handle both object and array cases
    if (condiments) {
      if (Array.isArray(condiments)) {
        condimentCalories = condiments.reduce(
          (sum: number, condiment: any) =>
            sum + Number(condiment.adjustedCalories || condiment.calories || 0),
          0
        );
      } else if (typeof condiments === "object") {
        condimentCalories = Number(condiments.calories || 0);
      }
    }

    const totalCalories =
      mainCalories + milkCalories + ranchCalories + condimentCalories;

    console.log("Calorie Breakdown:", {
      mainCalories,
      milkCalories,
      ranchCalories,
      condimentCalories,
      totalCalories,
    });

    return Math.round(totalCalories);
  } catch (error) {
    console.error("Error calculating total calories:", error);
    return 0;
  }
}
