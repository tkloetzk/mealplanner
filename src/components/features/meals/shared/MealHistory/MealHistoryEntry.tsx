import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MealHistoryRecord, MealType } from "@/types/meals";
import { MEAL_TYPES } from "@/constants";
import { DAILY_GOALS } from "@/constants/meal-goals";

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

  // Helper function to calculate calories for a meal
  const calculateMealCalories = (entry: MealHistoryRecord) => {
    let total = 0;

    // Calculate calories from main foods
    Object.entries(entry.selections)
      .filter(
        ([category]) =>
          category !== "condiments" &&
          category !== "milk" &&
          category !== "ranch"
      )
      .forEach(([, food]) => {
        if (food) {
          total += Number(food.adjustedCalories) || Number(food.calories) || 0;
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
                {Object.entries(entry.selections)
                  .filter(
                    ([category, food]) =>
                      food !== null &&
                      category !== "condiments" &&
                      category !== "milk" &&
                      category !== "ranch"
                  )
                  .map(([category, food]) => (
                    <div
                      key={category}
                      className="flex justify-between items-center"
                    >
                      <div>
                        <span className="font-medium">{food.name}</span>
                        <div className="text-sm text-gray-600">
                          {food.servings} serving(s) •{" "}
                          {food.adjustedCalories || food.calories} cal
                        </div>
                      </div>
                    </div>
                  ))}

                {/* Consumption Data */}
                {entry.consumptionData && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium">
                      {entry.consumptionData.percentEaten}% eaten
                    </div>
                    {entry.consumptionData.notes && (
                      <p className="text-sm text-gray-600 mt-1">
                        {entry.consumptionData.notes}
                      </p>
                    )}
                  </div>
                )}

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

                {/* Consumption Summary */}
                {entry.consumptionData?.summary && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      {entry.consumptionData.summary}
                    </p>
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
