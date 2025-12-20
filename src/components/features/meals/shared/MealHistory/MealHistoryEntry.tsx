import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MealHistoryRecord, MealSelection } from "@/types/meals";
import type { ConsumptionInfo, MealType } from "@/types/shared";
import { MEAL_TYPES } from "@/constants";
import { DAILY_GOALS } from "@/constants/meal-goals";
import { MarkConsumptionButton } from "@/components/features/consumption";
import { useMealStore } from "@/store/useMealStore";

interface MealHistoryEntryProps {
  entries: MealHistoryRecord[];
}

export function MealHistoryEntry({ entries }: MealHistoryEntryProps) {
  // Sort entries by meal type according to MEAL_TYPES order
  const sortedEntries = [...entries].sort((a, b) => {
    return (
      MEAL_TYPES.indexOf(a.meal as MealType) -
      MEAL_TYPES.indexOf(b.meal as MealType)
    );
  });

  // Helper function to calculate calories for a meal considering consumption data
  const calculateMealCalories = (entry: MealHistoryRecord) => {
    let total = 0;

    // If consumption data exists, use it to calculate actual consumed calories
    if (
      entry.consumptionData?.foods &&
      entry.consumptionData.foods.length > 0
    ) {
      // Calculate calories from main foods considering consumption
      Object.entries(entry.selections)
        .filter(
          ([category]) =>
            category !== "condiments" &&
            category !== "milk" &&
            category !== "ranch"
        )
        .forEach(([, food]) => {
          if (food) {
            // Find corresponding consumption data for this food
            const foodConsumption = entry.consumptionData?.foods?.find(
              (f) => f.foodId === food.id
            );

            // Calculate calories based on consumption percentage
            let foodCalories =
              Number(food.adjustedCalories) || Number(food.calories) || 0;
            if (foodConsumption) {
              if (foodConsumption.status === "not_eaten") {
                foodCalories = 0; // Not eaten contributes 0 calories
              } else if (
                foodConsumption.status === "partially_eaten" &&
                foodConsumption.percentageEaten !== undefined
              ) {
                foodCalories *= foodConsumption.percentageEaten / 100; // Scale by percentage eaten
              }
              // If status is 'eaten', use full calories
            }
            total += foodCalories;
          }
        });

      // Add milk calories considering consumption if present
      if (entry.selections.milk) {
        const milkConsumption = entry.consumptionData?.foods?.find(
          (f) => f.foodId === entry.selections.milk?.id
        );

        let milkCalories =
          Number(entry.selections.milk.adjustedCalories) ||
          Number(entry.selections.milk.calories) ||
          0;

        if (milkConsumption) {
          if (milkConsumption.status === "not_eaten") {
            milkCalories = 0;
          } else if (
            milkConsumption.status === "partially_eaten" &&
            milkConsumption.percentageEaten !== undefined
          ) {
            milkCalories *= milkConsumption.percentageEaten / 100;
          }
        }
        total += milkCalories;
      }

      // Add ranch calories considering consumption if present
      if (entry.selections.ranch) {
        const ranchConsumption = entry.consumptionData?.foods?.find(
          (f) => f.foodId === entry.selections.ranch?.id
        );

        let ranchCalories =
          Number(entry.selections.ranch.adjustedCalories) ||
          Number(entry.selections.ranch.calories) ||
          0;

        if (ranchConsumption) {
          if (ranchConsumption.status === "not_eaten") {
            ranchCalories = 0;
          } else if (
            ranchConsumption.status === "partially_eaten" &&
            ranchConsumption.percentageEaten !== undefined
          ) {
            ranchCalories *= ranchConsumption.percentageEaten / 100;
          }
        }
        total += ranchCalories;
      }

      // Add condiment calories considering consumption
      if (Array.isArray(entry.selections.condiments)) {
        entry.selections.condiments.forEach((condiment) => {
          if (condiment) {
            const condimentConsumption = entry.consumptionData?.foods?.find(
              (f) => f.foodId === condiment.id
            );

            let condimentCalories = Number(condiment.adjustedCalories) || 0;

            if (condimentConsumption) {
              if (condimentConsumption.status === "not_eaten") {
                condimentCalories = 0;
              } else if (
                condimentConsumption.status === "partially_eaten" &&
                condimentConsumption.percentageEaten !== undefined
              ) {
                condimentCalories *= condimentConsumption.percentageEaten / 100;
              }
            }
            total += condimentCalories;
          }
        });
      }
    } else {
      // If no consumption data, use the original calculation (assuming all was eaten)
      Object.entries(entry.selections)
        .filter(
          ([category]) =>
            category !== "condiments" &&
            category !== "milk" &&
            category !== "ranch"
        )
        .forEach(([, food]) => {
          if (food) {
            total +=
              Number(food.adjustedCalories) || Number(food.calories) || 0;
          }
        });

      // Add milk calories if present
      if (entry.selections.milk) {
        total +=
          Number(entry.selections.milk.adjustedCalories) ||
          Number(entry.selections.milk.calories) ||
          0;
      }

      // Add ranch calories if present
      if (entry.selections.ranch) {
        total +=
          Number(entry.selections.ranch.adjustedCalories) ||
          Number(entry.selections.ranch.calories) ||
          0;
      }

      // Add condiment calories
      if (Array.isArray(entry.selections.condiments)) {
        entry.selections.condiments.forEach((condiment) => {
          total += Number(condiment.adjustedCalories) || 0;
        });
      }
    }

    return Math.round(total);
  };

  // Calculate total daily calories
  const dailyTotalCalories = sortedEntries.reduce((total, entry) => {
    return total + calculateMealCalories(entry);
  }, 0);

  // Calculate percentage of daily goal
  const percentOfDailyGoal =
    (dailyTotalCalories / DAILY_GOALS.dailyTotals.calories) * 100;

  // Helper function to get color based on percentage of goal
  const getCalorieColor = (calories: number, targetCalories: number) => {
    const percentage = (calories / targetCalories) * 100;
    if (percentage > 110) return "text-red-600";
    if (percentage < 90) return "text-yellow-600";
    return "text-green-600";
  };

  // Helper function to check if there are any foods in the meal selections
  const hasFoods = (selections: MealSelection) => {
    return (
      !!selections.proteins ||
      !!selections.grains ||
      !!selections.fruits ||
      !!selections.vegetables ||
      !!selections.milk ||
      !!selections.ranch ||
      (Array.isArray(selections.condiments) &&
        selections.condiments.length > 0) ||
      !!selections.other
    );
  };

  return (
    <Card>
      {/* Daily Calories Summary */}
      <CardHeader className="pb-0">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">Daily Total</div>
          <div
            className={`font-bold ${getCalorieColor(
              dailyTotalCalories,
              DAILY_GOALS.dailyTotals.calories
            )}`}
          >
            {dailyTotalCalories} / {DAILY_GOALS.dailyTotals.calories} cal
            <div className="text-xs text-gray-500 text-right">
              {percentOfDailyGoal.toFixed(1)}% of daily goal
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {sortedEntries.map((entry, index) => {
          const mealCalories = calculateMealCalories(entry);
          const mealTarget =
            DAILY_GOALS.mealCalories[
              entry.meal as keyof typeof DAILY_GOALS.mealCalories
            ];

          return (
            <div
              key={`${entry._id}-${index}`}
              className={`${index > 0 ? "mt-6 pt-6 border-t" : ""}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">
                    {entry.meal.charAt(0).toUpperCase() + entry.meal.slice(1)}
                  </h3>
                </div>
                <div className="text-right">
                  <div
                    className={`font-medium ${getCalorieColor(
                      mealCalories,
                      mealTarget
                    )}`}
                  >
                    {mealCalories} / {mealTarget} cal
                  </div>
                  <div className="text-xs text-gray-500">
                    {((mealCalories / mealTarget) * 100).toFixed(1)}% of target
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {/* Main Foods */}
                {(
                  [
                    ["proteins", entry.selections.proteins],
                    ["grains", entry.selections.grains],
                    ["fruits", entry.selections.fruits],
                    ["vegetables", entry.selections.vegetables],
                    ["other", entry.selections.other],
                  ] as const
                )
                  .filter(([, food]) => !!food)
                  .map(([category, food]) => (
                    <div
                      key={category}
                      className="flex justify-between items-center"
                    >
                      <div>
                        <span className="font-medium">{food!.name}</span>
                        <div className="text-sm text-gray-600">
                          {food!.servings} serving(s) •{" "}
                          {food!.adjustedCalories || food!.calories} cal
                        </div>
                      </div>
                    </div>
                  ))}

                {/* Consumption Data */}
                <div className="mt-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      {entry.consumptionData && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm font-medium">
                            Overall Status:{" "}
                            {entry.consumptionData.overallStatus.replace(
                              "_",
                              " "
                            )}
                          </div>
                          {/* Display per-food consumption if available */}
                          {entry.consumptionData.foods &&
                            entry.consumptionData.foods.length > 0 && (
                              <div className="mt-2">
                                <h4 className="text-xs font-medium text-gray-600">
                                  Food Items:
                                </h4>
                                <div className="space-y-1 mt-1">
                                  {entry.consumptionData.foods.map(
                                    (food, index) => (
                                      <div
                                        key={index}
                                        className="flex justify-between text-xs"
                                      >
                                        <span>
                                          {food.status.replace("_", " ")}
                                        </span>
                                        {food.percentageEaten !== undefined && (
                                          <span>{food.percentageEaten}%</span>
                                        )}
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                          {entry.consumptionData.notes && (
                            <p className="text-sm text-gray-600 mt-1">
                              {entry.consumptionData.notes}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    {hasFoods(entry.selections) && (
                      <div>
                        <UpdateConsumptionButton entry={entry} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Milk */}
                {entry.selections.milk && (
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">
                        {entry.selections.milk.name}
                      </span>
                      <div className="text-sm text-gray-600">
                        {entry.selections.milk.servings} serving(s) •{" "}
                        {entry.selections.milk.adjustedCalories ||
                          entry.selections.milk.calories}{" "}
                        cal
                      </div>
                    </div>
                  </div>
                )}

                {/* Ranch */}
                {entry.selections.ranch && (
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">
                        {entry.selections.ranch.name}
                      </span>
                      <div className="text-sm text-gray-600">
                        {entry.selections.ranch.servings} serving(s) •{" "}
                        {entry.selections.ranch.adjustedCalories ||
                          entry.selections.ranch.calories}{" "}
                        cal
                      </div>
                    </div>
                  </div>
                )}

                {/* Condiments Section */}
                {entry.selections.condiments?.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Added Toppings:
                    </h4>
                    <div className="space-y-2">
                      {entry.selections.condiments.map((condiment, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center"
                        >
                          <div>
                            <span className="text-sm">{condiment.name}</span>
                            <div className="text-xs text-gray-600">
                              {condiment.servings || 1} serving(s) •{" "}
                              {condiment.adjustedCalories || 0} cal
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

interface UpdateConsumptionButtonProps {
  entry: MealHistoryRecord;
}

function UpdateConsumptionButton({ entry }: UpdateConsumptionButtonProps) {
  const updateConsumptionData = useMealStore(
    (state) => state.updateConsumptionData
  );

  const handleUpdateConsumption = async (consumptionInfo: ConsumptionInfo) => {
    try {
      await updateConsumptionData(
        entry.kidId,
        new Date(entry.date),
        entry.meal,
        consumptionInfo
      );
    } catch (error) {
      console.error("Error updating consumption data:", error);
    }
  };

  return (
    <MarkConsumptionButton
      initialStatus={entry.consumptionData}
      mealSelections={entry.selections}
      onSave={handleUpdateConsumption}
    />
  );
}
