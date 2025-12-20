import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ConsumptionInfo, FoodConsumptionStatus } from "@/types/shared";
import type { MealSelection } from "@/types/meals";

interface ConsumptionStatusSelectorProps {
  initialStatus?: ConsumptionInfo;
  mealSelections?: MealSelection; // Original foods offered in the meal
  onSave: (status: ConsumptionInfo) => void;
  onCancel: () => void;
}

export function ConsumptionStatusSelector({
  initialStatus,
  mealSelections,
  onSave,
  onCancel,
}: ConsumptionStatusSelectorProps) {
  // Initialize foods with meal selections if available
  const [foods, setFoods] = React.useState<FoodConsumptionStatus[]>(() => {
    if (initialStatus?.foods && initialStatus.foods.length > 0) {
      // If there's already consumption data, use that
      return initialStatus.foods;
    } else if (mealSelections) {
      // Create initial food entries based on meal selections
      const initialFoods: FoodConsumptionStatus[] = [];

      if (mealSelections.proteins) {
        initialFoods.push({
          foodId: mealSelections.proteins.id,
          status: "not_eaten",
          percentageEaten: 0,
          notes: undefined,
        });
      }

      if (mealSelections.grains) {
        initialFoods.push({
          foodId: mealSelections.grains.id,
          status: "not_eaten",
          percentageEaten: 0,
          notes: undefined,
        });
      }

      if (mealSelections.fruits) {
        initialFoods.push({
          foodId: mealSelections.fruits.id,
          status: "not_eaten",
          percentageEaten: 0,
          notes: undefined,
        });
      }

      if (mealSelections.vegetables) {
        initialFoods.push({
          foodId: mealSelections.vegetables.id,
          status: "not_eaten",
          percentageEaten: 0,
          notes: undefined,
        });
      }

      if (mealSelections.milk) {
        initialFoods.push({
          foodId: mealSelections.milk.id,
          status: "not_eaten",
          percentageEaten: 0,
          notes: undefined,
        });
      }

      if (mealSelections.ranch) {
        initialFoods.push({
          foodId: mealSelections.ranch.id,
          status: "not_eaten",
          percentageEaten: 0,
          notes: undefined,
        });
      }

      if (mealSelections.other) {
        initialFoods.push({
          foodId: mealSelections.other.id,
          status: "not_eaten",
          percentageEaten: 0,
          notes: undefined,
        });
      }

      // Handle condiments
      if (
        mealSelections.condiments &&
        Array.isArray(mealSelections.condiments)
      ) {
        mealSelections.condiments.forEach((condiment) => {
          if (condiment) {
            initialFoods.push({
              foodId: condiment.id,
              status: "not_eaten",
              percentageEaten: 0,
              notes: undefined,
            });
          }
        });
      }

      return initialFoods;
    } else {
      // Fall back to empty array if no selections or initial data
      return [];
    }
  });

  const [notes, setNotes] = React.useState<string>(initialStatus?.notes || "");

  // State for food-specific tracking
  const [currentFoodId, setCurrentFoodId] = React.useState<string | null>(null);

  // Helper function to get the percentage eaten of a food by ID
  const getFoodPercentageById = (
    foodsArray: FoodConsumptionStatus[],
    foodId: string
  ) => {
    const food = foodsArray.find((f) => f.foodId === foodId);
    return food?.percentageEaten || 0;
  };

  // Helper function to calculate overall status based on individual food statuses
  const calculateOverallStatus = ():
    | "offered"
    | "partially_eaten"
    | "eaten" => {
    if (foods.length === 0) return "offered";

    const eatenCount = foods.filter((f) => f.status === "eaten").length;
    const notEatenCount = foods.filter((f) => f.status === "not_eaten").length;

    if (eatenCount === foods.length) {
      return "eaten"; // All foods were eaten
    } else if (notEatenCount === foods.length) {
      return "offered"; // No foods were eaten
    } else {
      return "partially_eaten"; // Some were eaten, some weren't
    }
  };

  // Helper function to get food status by ID
  const getFoodStatusById = (
    foodsArray: FoodConsumptionStatus[],
    foodId: string
  ) => {
    const foodItem = foodsArray.find((food) => food.foodId === foodId);
    return foodItem?.status || "not_eaten";
  };

  // Helper function to get appropriate button variant based on food status
  const getFoodStatusVariant = (
    foodsArray: FoodConsumptionStatus[],
    foodId: string,
    status: "not_eaten" | "partially_eaten" | "eaten"
  ) => {
    const currentStatus =
      foodsArray.find((f) => f.foodId === foodId)?.status || "not_eaten";
    return currentStatus === status ? "default" : "outline";
  };

  // Helper function to update food status in the state
  const updateFoodStatus = (
    foodId: string,
    status: "not_eaten" | "partially_eaten" | "eaten"
  ) => {
    setFoods((prevFoods) => {
      const existingIndex = prevFoods.findIndex((f) => f.foodId === foodId);

      if (existingIndex !== -1) {
        // Update existing food record
        const updatedFoods = [...prevFoods];
        updatedFoods[existingIndex] = {
          ...updatedFoods[existingIndex],
          status: status,
          percentageEaten:
            status === "partially_eaten"
              ? getFoodPercentageById(updatedFoods, foodId)
              : status === "eaten"
              ? 100
              : 0,
        };
        return updatedFoods;
      } else {
        // Add new food record
        return [
          ...prevFoods,
          {
            foodId,
            status,
            percentageEaten:
              status === "partially_eaten" ? 50 : status === "eaten" ? 100 : 0, // Default to 50% for partially eaten
            notes: undefined,
          },
        ];
      }
    });
  };

  // Helper function to update food percentage eaten
  const updateFoodPercentage = (foodId: string, percentage: number) => {
    setFoods((prevFoods) => {
      const existingIndex = prevFoods.findIndex((f) => f.foodId === foodId);

      if (existingIndex !== -1) {
        // Update existing food record
        const updatedFoods = [...prevFoods];
        updatedFoods[existingIndex] = {
          ...updatedFoods[existingIndex],
          percentageEaten: percentage,
        };
        return updatedFoods;
      } else {
        // Add new food record with percentage
        return [
          ...prevFoods,
          {
            foodId,
            status: "partially_eaten",
            percentageEaten: percentage,
            notes: undefined,
          },
        ];
      }
    });
  };

  const handleSave = () => {
    // Calculate overall status based on individual food statuses
    const calculatedOverallStatus = calculateOverallStatus();

    onSave({
      foods: foods,
      overallStatus: calculatedOverallStatus,
      notes: notes || undefined,
    });

    // Reset currentFoodId state after saving
    setCurrentFoodId(null);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Mark Meal Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Food-specific tracking section */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Food Items</Label>

          {/* List of already tracked foods */}
          {foods.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-gray-600">
                Tracked Foods:
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {foods.map((food, index) => {
                  // Find the food name based on the foodId
                  let foodName = "Unknown Food";
                  if (mealSelections) {
                    // Look for the food in each category
                    const allFoodCategories = [
                      mealSelections.proteins,
                      mealSelections.grains,
                      mealSelections.fruits,
                      mealSelections.vegetables,
                      mealSelections.milk,
                      mealSelections.ranch,
                      mealSelections.other,
                      ...(mealSelections.condiments || []),
                    ];

                    const matchingFood = allFoodCategories.find(
                      (f) => f && f.id === food.foodId
                    );
                    if (matchingFood) {
                      foodName = matchingFood.name;
                    }
                  }

                  return (
                    <div
                      key={`${food.foodId}-${index}`}
                      className="flex justify-between items-center p-2 bg-gray-50 rounded"
                    >
                      <div>
                        <div className="text-sm">{foodName}</div>
                        <div className="text-xs">
                          {food.status.replace("_", " ")}
                          {food.percentageEaten !== undefined &&
                            ` - ${food.percentageEaten}%`}
                        </div>
                        {food.notes && (
                          <div className="text-xs text-gray-500 italic">
                            {food.notes}
                          </div>
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

          {/* Allow manual updates to each existing food */}
          {mealSelections && (
            <div className="space-y-3 p-3 bg-blue-50 rounded">
              <Label className="text-xs font-medium">Update Food Status</Label>

              {/* Protein */}
              {mealSelections.proteins && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">
                    {mealSelections.proteins.name}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={getFoodStatusVariant(
                        foods,
                        mealSelections.proteins.id,
                        "not_eaten"
                      )}
                      onClick={() =>
                        updateFoodStatus(
                          mealSelections.proteins.id,
                          "not_eaten"
                        )
                      }
                      size="sm"
                    >
                      Not Eaten
                    </Button>
                    <Button
                      variant={getFoodStatusVariant(
                        foods,
                        mealSelections.proteins.id,
                        "partially_eaten"
                      )}
                      onClick={() => {
                        updateFoodStatus(
                          mealSelections.proteins.id,
                          "partially_eaten"
                        );
                        // Set as currently selected for percentage adjustment
                        setCurrentFoodId(mealSelections.proteins.id);
                      }}
                      size="sm"
                    >
                      Partially Eaten
                    </Button>
                    <Button
                      variant={getFoodStatusVariant(
                        foods,
                        mealSelections.proteins.id,
                        "eaten"
                      )}
                      onClick={() =>
                        updateFoodStatus(mealSelections.proteins.id, "eaten")
                      }
                      size="sm"
                    >
                      Eaten
                    </Button>
                  </div>

                  {/* Percentage slider for this food if it's partially eaten */}
                  {currentFoodId === mealSelections.proteins.id &&
                    getFoodStatusById(foods, mealSelections.proteins.id) ===
                      "partially_eaten" && (
                      <div className="mt-2 space-y-2">
                        <Label className="text-xs">
                          Percentage Eaten:{" "}
                          {getFoodPercentageById(
                            foods,
                            mealSelections.proteins.id
                          )}
                          %
                        </Label>
                        <Slider
                          value={[
                            getFoodPercentageById(
                              foods,
                              mealSelections.proteins.id
                            ),
                          ]}
                          onValueChange={([value]) =>
                            updateFoodPercentage(
                              mealSelections.proteins.id,
                              value
                            )
                          }
                          max={100}
                          step={5}
                          className="w-full"
                        />
                      </div>
                    )}
                </div>
              )}

              {/* Grains */}
              {mealSelections.grains && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">
                    {mealSelections.grains.name}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={getFoodStatusVariant(
                        foods,
                        mealSelections.grains.id,
                        "not_eaten"
                      )}
                      onClick={() =>
                        updateFoodStatus(mealSelections.grains.id, "not_eaten")
                      }
                      size="sm"
                    >
                      Not Eaten
                    </Button>
                    <Button
                      variant={getFoodStatusVariant(
                        foods,
                        mealSelections.grains.id,
                        "partially_eaten"
                      )}
                      onClick={() => {
                        updateFoodStatus(
                          mealSelections.grains.id,
                          "partially_eaten"
                        );
                        setCurrentFoodId(mealSelections.grains.id);
                      }}
                      size="sm"
                    >
                      Partially Eaten
                    </Button>
                    <Button
                      variant={getFoodStatusVariant(
                        foods,
                        mealSelections.grains.id,
                        "eaten"
                      )}
                      onClick={() =>
                        updateFoodStatus(mealSelections.grains.id, "eaten")
                      }
                      size="sm"
                    >
                      Eaten
                    </Button>
                  </div>

                  {currentFoodId === mealSelections.grains.id &&
                    getFoodStatusById(foods, mealSelections.grains.id) ===
                      "partially_eaten" && (
                      <div className="mt-2 space-y-2">
                        <Label className="text-xs">
                          Percentage Eaten:{" "}
                          {getFoodPercentageById(
                            foods,
                            mealSelections.grains.id
                          )}
                          %
                        </Label>
                        <Slider
                          value={[
                            getFoodPercentageById(
                              foods,
                              mealSelections.grains.id
                            ),
                          ]}
                          onValueChange={([value]) =>
                            updateFoodPercentage(
                              mealSelections.grains.id,
                              value
                            )
                          }
                          max={100}
                          step={5}
                          className="w-full"
                        />
                      </div>
                    )}
                </div>
              )}

              {/* Fruits */}
              {mealSelections.fruits && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">
                    {mealSelections.fruits.name}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={getFoodStatusVariant(
                        foods,
                        mealSelections.fruits.id,
                        "not_eaten"
                      )}
                      onClick={() =>
                        updateFoodStatus(mealSelections.fruits.id, "not_eaten")
                      }
                      size="sm"
                    >
                      Not Eaten
                    </Button>
                    <Button
                      variant={getFoodStatusVariant(
                        foods,
                        mealSelections.fruits.id,
                        "partially_eaten"
                      )}
                      onClick={() => {
                        updateFoodStatus(
                          mealSelections.fruits.id,
                          "partially_eaten"
                        );
                        setCurrentFoodId(mealSelections.fruits.id);
                      }}
                      size="sm"
                    >
                      Partially Eaten
                    </Button>
                    <Button
                      variant={getFoodStatusVariant(
                        foods,
                        mealSelections.fruits.id,
                        "eaten"
                      )}
                      onClick={() =>
                        updateFoodStatus(mealSelections.fruits.id, "eaten")
                      }
                      size="sm"
                    >
                      Eaten
                    </Button>
                  </div>

                  {currentFoodId === mealSelections.fruits.id &&
                    getFoodStatusById(foods, mealSelections.fruits.id) ===
                      "partially_eaten" && (
                      <div className="mt-2 space-y-2">
                        <Label className="text-xs">
                          Percentage Eaten:{" "}
                          {getFoodPercentageById(
                            foods,
                            mealSelections.fruits.id
                          )}
                          %
                        </Label>
                        <Slider
                          value={[
                            getFoodPercentageById(
                              foods,
                              mealSelections.fruits.id
                            ),
                          ]}
                          onValueChange={([value]) =>
                            updateFoodPercentage(
                              mealSelections.fruits.id,
                              value
                            )
                          }
                          max={100}
                          step={5}
                          className="w-full"
                        />
                      </div>
                    )}
                </div>
              )}

              {/* Vegetables */}
              {mealSelections.vegetables && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">
                    {mealSelections.vegetables.name}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={getFoodStatusVariant(
                        foods,
                        mealSelections.vegetables.id,
                        "not_eaten"
                      )}
                      onClick={() =>
                        updateFoodStatus(
                          mealSelections.vegetables.id,
                          "not_eaten"
                        )
                      }
                      size="sm"
                    >
                      Not Eaten
                    </Button>
                    <Button
                      variant={getFoodStatusVariant(
                        foods,
                        mealSelections.vegetables.id,
                        "partially_eaten"
                      )}
                      onClick={() => {
                        updateFoodStatus(
                          mealSelections.vegetables.id,
                          "partially_eaten"
                        );
                        setCurrentFoodId(mealSelections.vegetables.id);
                      }}
                      size="sm"
                    >
                      Partially Eaten
                    </Button>
                    <Button
                      variant={getFoodStatusVariant(
                        foods,
                        mealSelections.vegetables.id,
                        "eaten"
                      )}
                      onClick={() =>
                        updateFoodStatus(mealSelections.vegetables.id, "eaten")
                      }
                      size="sm"
                    >
                      Eaten
                    </Button>
                  </div>

                  {currentFoodId === mealSelections.vegetables.id &&
                    getFoodStatusById(foods, mealSelections.vegetables.id) ===
                      "partially_eaten" && (
                      <div className="mt-2 space-y-2">
                        <Label className="text-xs">
                          Percentage Eaten:{" "}
                          {getFoodPercentageById(
                            foods,
                            mealSelections.vegetables.id
                          )}
                          %
                        </Label>
                        <Slider
                          value={[
                            getFoodPercentageById(
                              foods,
                              mealSelections.vegetables.id
                            ),
                          ]}
                          onValueChange={([value]) =>
                            updateFoodPercentage(
                              mealSelections.vegetables.id,
                              value
                            )
                          }
                          max={100}
                          step={5}
                          className="w-full"
                        />
                      </div>
                    )}
                </div>
              )}

              {/* Milk */}
              {mealSelections.milk && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">
                    {mealSelections.milk.name}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={getFoodStatusVariant(
                        foods,
                        mealSelections.milk.id,
                        "not_eaten"
                      )}
                      onClick={() =>
                        updateFoodStatus(mealSelections.milk.id, "not_eaten")
                      }
                      size="sm"
                    >
                      Not Eaten
                    </Button>
                    <Button
                      variant={getFoodStatusVariant(
                        foods,
                        mealSelections.milk.id,
                        "partially_eaten"
                      )}
                      onClick={() => {
                        updateFoodStatus(
                          mealSelections.milk.id,
                          "partially_eaten"
                        );
                        setCurrentFoodId(mealSelections.milk.id);
                      }}
                      size="sm"
                    >
                      Partially Eaten
                    </Button>
                    <Button
                      variant={getFoodStatusVariant(
                        foods,
                        mealSelections.milk.id,
                        "eaten"
                      )}
                      onClick={() =>
                        updateFoodStatus(mealSelections.milk.id, "eaten")
                      }
                      size="sm"
                    >
                      Eaten
                    </Button>
                  </div>

                  {currentFoodId === mealSelections.milk.id &&
                    getFoodStatusById(foods, mealSelections.milk.id) ===
                      "partially_eaten" && (
                      <div className="mt-2 space-y-2">
                        <Label className="text-xs">
                          Percentage Eaten:{" "}
                          {getFoodPercentageById(foods, mealSelections.milk.id)}
                          %
                        </Label>
                        <Slider
                          value={[
                            getFoodPercentageById(
                              foods,
                              mealSelections.milk.id
                            ),
                          ]}
                          onValueChange={([value]) =>
                            updateFoodPercentage(mealSelections.milk.id, value)
                          }
                          max={100}
                          step={5}
                          className="w-full"
                        />
                      </div>
                    )}
                </div>
              )}

              {/* Ranch */}
              {mealSelections.ranch && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">
                    {mealSelections.ranch.name}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={getFoodStatusVariant(
                        foods,
                        mealSelections.ranch.id,
                        "not_eaten"
                      )}
                      onClick={() =>
                        updateFoodStatus(mealSelections.ranch.id, "not_eaten")
                      }
                      size="sm"
                    >
                      Not Eaten
                    </Button>
                    <Button
                      variant={getFoodStatusVariant(
                        foods,
                        mealSelections.ranch.id,
                        "partially_eaten"
                      )}
                      onClick={() => {
                        updateFoodStatus(
                          mealSelections.ranch.id,
                          "partially_eaten"
                        );
                        setCurrentFoodId(mealSelections.ranch.id);
                      }}
                      size="sm"
                    >
                      Partially Eaten
                    </Button>
                    <Button
                      variant={getFoodStatusVariant(
                        foods,
                        mealSelections.ranch.id,
                        "eaten"
                      )}
                      onClick={() =>
                        updateFoodStatus(mealSelections.ranch.id, "eaten")
                      }
                      size="sm"
                    >
                      Eaten
                    </Button>
                  </div>

                  {currentFoodId === mealSelections.ranch.id &&
                    getFoodStatusById(foods, mealSelections.ranch.id) ===
                      "partially_eaten" && (
                      <div className="mt-2 space-y-2">
                        <Label className="text-xs">
                          Percentage Eaten:{" "}
                          {getFoodPercentageById(
                            foods,
                            mealSelections.ranch.id
                          )}
                          %
                        </Label>
                        <Slider
                          value={[
                            getFoodPercentageById(
                              foods,
                              mealSelections.ranch.id
                            ),
                          ]}
                          onValueChange={([value]) =>
                            updateFoodPercentage(mealSelections.ranch.id, value)
                          }
                          max={100}
                          step={5}
                          className="w-full"
                        />
                      </div>
                    )}
                </div>
              )}

              {/* Other */}
              {mealSelections.other && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">
                    {mealSelections.other.name}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={getFoodStatusVariant(
                        foods,
                        mealSelections.other.id,
                        "not_eaten"
                      )}
                      onClick={() =>
                        updateFoodStatus(mealSelections.other.id, "not_eaten")
                      }
                      size="sm"
                    >
                      Not Eaten
                    </Button>
                    <Button
                      variant={getFoodStatusVariant(
                        foods,
                        mealSelections.other.id,
                        "partially_eaten"
                      )}
                      onClick={() => {
                        updateFoodStatus(
                          mealSelections.other.id,
                          "partially_eaten"
                        );
                        setCurrentFoodId(mealSelections.other.id);
                      }}
                      size="sm"
                    >
                      Partially Eaten
                    </Button>
                    <Button
                      variant={getFoodStatusVariant(
                        foods,
                        mealSelections.other.id,
                        "eaten"
                      )}
                      onClick={() =>
                        updateFoodStatus(mealSelections.other.id, "eaten")
                      }
                      size="sm"
                    >
                      Eaten
                    </Button>
                  </div>

                  {currentFoodId === mealSelections.other.id &&
                    getFoodStatusById(foods, mealSelections.other.id) ===
                      "partially_eaten" && (
                      <div className="mt-2 space-y-2">
                        <Label className="text-xs">
                          Percentage Eaten:{" "}
                          {getFoodPercentageById(
                            foods,
                            mealSelections.other.id
                          )}
                          %
                        </Label>
                        <Slider
                          value={[
                            getFoodPercentageById(
                              foods,
                              mealSelections.other.id
                            ),
                          ]}
                          onValueChange={([value]) =>
                            updateFoodPercentage(mealSelections.other.id, value)
                          }
                          max={100}
                          step={5}
                          className="w-full"
                        />
                      </div>
                    )}
                </div>
              )}

              {/* Condiments */}
              {mealSelections.condiments &&
                mealSelections.condiments.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Condiments/Toppings</h4>
                    {mealSelections.condiments.map((condiment, index) => (
                      <div key={index} className="space-y-2 ml-2">
                        <div className="text-sm">{condiment.name}</div>
                        <div className="flex gap-2">
                          <Button
                            variant={getFoodStatusVariant(
                              foods,
                              condiment.id,
                              "not_eaten"
                            )}
                            onClick={() =>
                              updateFoodStatus(condiment.id, "not_eaten")
                            }
                            size="sm"
                          >
                            Not Eaten
                          </Button>
                          <Button
                            variant={getFoodStatusVariant(
                              foods,
                              condiment.id,
                              "partially_eaten"
                            )}
                            onClick={() => {
                              updateFoodStatus(condiment.id, "partially_eaten");
                              setCurrentFoodId(condiment.id);
                            }}
                            size="sm"
                          >
                            Partially Eaten
                          </Button>
                          <Button
                            variant={getFoodStatusVariant(
                              foods,
                              condiment.id,
                              "eaten"
                            )}
                            onClick={() =>
                              updateFoodStatus(condiment.id, "eaten")
                            }
                            size="sm"
                          >
                            Eaten
                          </Button>
                        </div>

                        {currentFoodId === condiment.id &&
                          getFoodStatusById(foods, condiment.id) ===
                            "partially_eaten" && (
                            <div className="mt-2 space-y-2">
                              <Label className="text-xs">
                                Percentage Eaten:{" "}
                                {getFoodPercentageById(foods, condiment.id)}%
                              </Label>
                              <Slider
                                value={[
                                  getFoodPercentageById(foods, condiment.id),
                                ]}
                                onValueChange={([value]) =>
                                  updateFoodPercentage(condiment.id, value)
                                }
                                max={100}
                                step={5}
                                className="w-full"
                              />
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                )}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes" className="text-sm font-medium">
            General Notes
          </Label>
          <Input
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about the meal consumption..."
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Status</Button>
        </div>
      </CardContent>
    </Card>
  );
}
