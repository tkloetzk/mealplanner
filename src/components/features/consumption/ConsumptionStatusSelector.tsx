import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ConsumptionInfo, FoodConsumptionStatus } from "@/types/shared";
import type { MealSelection } from "@/types/meals";
import type { Food } from "@/types/food";

interface ConsumptionStatusSelectorProps {
  initialStatus?: ConsumptionInfo;
  /** The calendar date of this meal (ISO string or Date). Used to combine with the time input. */
  mealDate?: string | Date;
  mealSelections?: MealSelection; // Original foods offered in the meal
  onSave: (status: ConsumptionInfo) => void;
  onCancel: () => void;
}

// Flatten all foods from a MealSelection into a flat array
function flattenMealFoods(mealSelections: MealSelection): Food[] {
  const foods: Food[] = [];
  const arrayFields = ["proteins", "grains", "fruits", "vegetables", "other", "condiments"] as const;
  const singleFields = ["milk", "ranch"] as const;

  for (const field of arrayFields) {
    const val = mealSelections[field];
    if (Array.isArray(val)) {
      foods.push(...val.filter(Boolean));
    }
  }
  for (const field of singleFields) {
    const val = mealSelections[field];
    if (val) foods.push(val);
  }
  return foods;
}

/**
 * Extract "HH:MM" from an ISO datetime string for use in a time input.
 * Returns the current time if the input is missing or invalid.
 */
function toTimeInputValue(iso: string | undefined): string {
  if (iso) {
    const d = new Date(iso);
    if (!Number.isNaN(d.getTime())) {
      return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    }
  }
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

/**
 * Combine a calendar date with a "HH:MM" time string into an ISO datetime.
 */
function combineDateAndTime(date: string | Date | undefined, time: string): string {
  const base = date ? new Date(date) : new Date();
  const [hours, minutes] = time.split(":").map(Number);
  const combined = new Date(base);
  combined.setHours(hours, minutes, 0, 0);
  return combined.toISOString();
}

export function ConsumptionStatusSelector({
  initialStatus,
  mealDate,
  mealSelections,
  onSave,
  onCancel,
}: ConsumptionStatusSelectorProps) {
  // Initialize foods with meal selections if available
  const [foods, setFoods] = React.useState<FoodConsumptionStatus[]>(() => {
    if (initialStatus?.foods && initialStatus.foods.length > 0) {
      return initialStatus.foods;
    } else if (mealSelections) {
      return flattenMealFoods(mealSelections).map((food) => ({
        foodId: food.id,
        status: "not_eaten" as const,
        percentageEaten: 0,
        notes: undefined,
      }));
    }
    return [];
  });

  const [notes, setNotes] = React.useState<string>(initialStatus?.notes || "");
  const [currentFoodId, setCurrentFoodId] = React.useState<string | null>(null);

  // ── Meal time state ──
  const [mealTimeValue, setMealTimeValue] = React.useState<string>(
    () => toTimeInputValue(initialStatus?.mealTime),
  );

  const getFoodPercentageById = (foodsArray: FoodConsumptionStatus[], foodId: string) => {
    return foodsArray.find((f) => f.foodId === foodId)?.percentageEaten || 0;
  };

  const calculateOverallStatus = (): "offered" | "partially_eaten" | "eaten" => {
    if (foods.length === 0) return "offered";
    const eatenCount = foods.filter((f) => f.status === "eaten").length;
    const notEatenCount = foods.filter((f) => f.status === "not_eaten").length;
    if (eatenCount === foods.length) return "eaten";
    if (notEatenCount === foods.length) return "offered";
    return "partially_eaten";
  };

  const getFoodStatusById = (foodsArray: FoodConsumptionStatus[], foodId: string) => {
    return foodsArray.find((food) => food.foodId === foodId)?.status || "not_eaten";
  };

  const getFoodStatusVariant = (
    foodsArray: FoodConsumptionStatus[],
    foodId: string,
    status: "not_eaten" | "partially_eaten" | "eaten"
  ) => {
    const currentStatus = foodsArray.find((f) => f.foodId === foodId)?.status || "not_eaten";
    return currentStatus === status ? "default" : "outline";
  };

  const updateFoodStatus = (foodId: string, status: "not_eaten" | "partially_eaten" | "eaten") => {
    setFoods((prevFoods) => {
      const existingIndex = prevFoods.findIndex((f) => f.foodId === foodId);
      const updated = {
        foodId,
        status,
        percentageEaten: status === "partially_eaten" ? getFoodPercentageById(prevFoods, foodId) : status === "eaten" ? 100 : 0,
        notes: undefined as string | undefined,
      };
      if (existingIndex !== -1) {
        const newFoods = [...prevFoods];
        newFoods[existingIndex] = updated;
        return newFoods;
      }
      return [...prevFoods, updated];
    });
  };

  const updateFoodPercentage = (foodId: string, percentage: number) => {
    setFoods((prevFoods) => {
      const existingIndex = prevFoods.findIndex((f) => f.foodId === foodId);
      if (existingIndex !== -1) {
        const newFoods = [...prevFoods];
        newFoods[existingIndex] = { ...newFoods[existingIndex], percentageEaten: percentage };
        return newFoods;
      }
      return [...prevFoods, { foodId, status: "partially_eaten", percentageEaten: percentage, notes: undefined }];
    });
  };

  const handleSave = () => {
    const mealTimeIso = combineDateAndTime(mealDate, mealTimeValue);
    onSave({
      foods,
      overallStatus: calculateOverallStatus(),
      notes: notes || undefined,
      mealTime: mealTimeIso,
      // Preserve existing satiety log — it's edited separately via SatietyLogger
      satietyLog: initialStatus?.satietyLog,
    });
    setCurrentFoodId(null);
  };

  // Get all foods from mealSelections for name lookup and rendering
  const allMealFoods = mealSelections ? flattenMealFoods(mealSelections) : [];

  const renderFoodStatus = (food: Food) => (
    <div key={food.id} className="space-y-2">
      <div className="text-sm font-medium">{food.name}</div>
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={getFoodStatusVariant(foods, food.id, "not_eaten")}
          onClick={() => updateFoodStatus(food.id, "not_eaten")}
          size="sm"
        >
          Not Eaten
        </Button>
        <Button
          variant={getFoodStatusVariant(foods, food.id, "partially_eaten")}
          onClick={() => {
            updateFoodStatus(food.id, "partially_eaten");
            setCurrentFoodId(food.id);
          }}
          size="sm"
        >
          Partially Eaten
        </Button>
        <Button
          variant={getFoodStatusVariant(foods, food.id, "eaten")}
          onClick={() => updateFoodStatus(food.id, "eaten")}
          size="sm"
        >
          Eaten
        </Button>
      </div>
      {currentFoodId === food.id && getFoodStatusById(foods, food.id) === "partially_eaten" && (
        <div className="mt-2 space-y-2">
          <Label className="text-xs">
            Percentage Eaten: {getFoodPercentageById(foods, food.id)}%
          </Label>
          <Slider
            value={[getFoodPercentageById(foods, food.id)]}
            onValueChange={([value]) => updateFoodPercentage(food.id, value)}
            max={100}
            step={5}
            className="w-full"
          />
        </div>
      )}
    </div>
  );

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Mark Meal Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* ── Meal time picker ── */}
        <div className="space-y-2">
          <Label htmlFor="meal-time" className="text-sm font-medium">
            Meal Time
          </Label>
          <Input
            id="meal-time"
            type="time"
            value={mealTimeValue}
            onChange={(e) => setMealTimeValue(e.target.value)}
            className="w-auto"
            aria-label="Meal time"
          />
          <p className="text-xs text-gray-500">When did they actually eat?</p>
        </div>

        <div className="space-y-4">
          <Label className="text-sm font-medium">Food Items</Label>

          {/* List of already tracked foods */}
          {foods.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-gray-600">Tracked Foods:</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {foods.map((food, index) => {
                  const matchingFood = allMealFoods.find((f) => f.id === food.foodId);
                  const foodName = matchingFood?.name ?? "Unknown Food";
                  return (
                    <div
                      key={`${food.foodId}-${index}`}
                      className="flex justify-between items-center p-2 bg-gray-50 rounded"
                    >
                      <div>
                        <div className="text-sm">{foodName}</div>
                        <div className="text-xs">
                          {food.status.replace("_", " ")}
                          {food.percentageEaten !== undefined && ` - ${food.percentageEaten}%`}
                        </div>
                        {food.notes && (
                          <div className="text-xs text-gray-500 italic">{food.notes}</div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newFoods = [...foods];
                          newFoods.splice(index, 1);
                          setFoods(newFoods);
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Update status for each food */}
          {allMealFoods.length > 0 && (
            <div className="space-y-3 p-3 bg-blue-50 rounded">
              <Label className="text-xs font-medium">Update Food Status</Label>
              {allMealFoods.map(renderFoodStatus)}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes" className="text-sm font-medium">General Notes</Label>
          <Input
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about the meal consumption..."
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSave}>Save Status</Button>
        </div>
      </CardContent>
    </Card>
  );
}
