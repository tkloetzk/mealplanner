import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { MealType, CategoryType } from "@/types/shared";
import { MealSelection } from "@/types/meals";
import { Food, ServingSizeUnit } from "@/types/food";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FoodItem } from "../../meals/shared/FoodItem";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarcodeScanner } from "../../food/FoodEditor/components/BarcodeScanner";
import { FoodSearch } from "../../food/FoodSearch/FoodSearch";

interface MealEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, selections: MealSelection) => Promise<void>;
  initialSelections?: MealSelection;
  mealType?: MealType;
}

type CreationMethod = "select" | "describe" | "recipe" | "scan";

interface Ingredient {
  name: string;
  amount: number;
  unit: ServingSizeUnit;
  foodId?: string;
}

export const MealEditor = ({
  isOpen,
  onClose,
  onSave,
  initialSelections,
  mealType,
}: MealEditorProps) => {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creationMethod, setCreationMethod] =
    useState<CreationMethod>("select");
  const [description, setDescription] = useState("");
  const [recipe, setRecipe] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [currentIngredient, setCurrentIngredient] = useState<
    Partial<Ingredient>
  >({});
  const [isScanning, setIsScanning] = useState(false);

  // Original food selection state
  const [foodOptions, setFoodOptions] = useState<Record<CategoryType, Food[]>>({
    proteins: [],
    grains: [],
    fruits: [],
    vegetables: [],
    milk: [],
    ranch: [],
    condiments: [],
    other: [],
  });
  const [selections, setSelections] = useState<MealSelection>(
    initialSelections || {
      proteins: null,
      grains: null,
      fruits: null,
      vegetables: null,
      milk: null,
      ranch: null,
      condiments: [],
      other: null,
    }
  );

  // Fetch available foods when the editor opens
  useEffect(() => {
    const fetchFoods = async () => {
      try {
        const response = await fetch("/api/foods");
        if (!response.ok) throw new Error("Failed to fetch foods");
        const data = await response.json();
        setFoodOptions(data);
      } catch (error) {
        console.error("Error fetching foods:", error);
        setError("Failed to load food options");
      }
    };

    if (isOpen) {
      fetchFoods();
    }
  }, [isOpen]);

  const handleFoodSelect = (category: CategoryType, food: Food) => {
    setSelections((prev) => {
      if (category === "condiments") {
        const currentCondiments = prev.condiments || [];
        const isSelected = currentCondiments.some((f) => f.id === food.id);
        return {
          ...prev,
          condiments: isSelected
            ? currentCondiments.filter((f) => f.id !== food.id)
            : [...currentCondiments, food],
        };
      } else {
        return {
          ...prev,
          [category]: prev[category]?.id === food.id ? null : food,
        };
      }
    });
  };

  const handleAddIngredient = () => {
    if (
      !currentIngredient.name ||
      !currentIngredient.amount ||
      !currentIngredient.unit
    ) {
      setError("Please fill in all ingredient fields");
      return;
    }
    setIngredients([...ingredients, currentIngredient as Ingredient]);
    setCurrentIngredient({});
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Please enter a meal name");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      switch (creationMethod) {
        case "select": {
          const hasSelections = Object.values(selections).some(
            (selection) =>
              selection !== null &&
              (!Array.isArray(selection) || selection.length > 0)
          );
          if (!hasSelections) {
            throw new Error("Please select at least one food item");
          }
          await onSave(name, selections);
          break;
        }
        case "describe": {
          if (!description.trim()) {
            throw new Error("Please enter a meal description");
          }
          // TODO: Call AI endpoint to convert description to meal
          break;
        }
        case "recipe": {
          if (!recipe.trim()) {
            throw new Error("Please enter a recipe");
          }
          // TODO: Call AI endpoint to convert recipe to meal
          break;
        }
        case "scan": {
          if (ingredients.length === 0) {
            throw new Error("Please add at least one ingredient");
          }
          // TODO: Convert scanned ingredients to meal
          break;
        }
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save meal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {initialSelections ? "Edit Meal" : "Create New Meal"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0">
          <div className="space-y-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="meal-name">Meal Name</Label>
              <Input
                id="meal-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter meal name"
              />
            </div>

            {mealType && (
              <div className="text-sm text-gray-500">
                This meal will be saved as a {mealType} option
              </div>
            )}

            {error && <div className="text-sm text-red-500">{error}</div>}
          </div>

          <Tabs
            value={creationMethod}
            onValueChange={(v) => setCreationMethod(v as CreationMethod)}
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="select">Select Foods</TabsTrigger>
              <TabsTrigger value="describe">Describe</TabsTrigger>
              <TabsTrigger value="recipe">Recipe</TabsTrigger>
              <TabsTrigger value="scan">Scan & Add</TabsTrigger>
            </TabsList>

            <TabsContent value="select">
              <ScrollArea className="h-[50vh] pr-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(foodOptions).map(([category, foods]) => {
                    if (foods.length === 0) return null;
                    return (
                      <Card key={category}>
                        <CardContent className="p-4">
                          <h3 className="text-lg font-semibold capitalize mb-3">
                            {category}
                          </h3>
                          <div className="space-y-2">
                            {foods.map((food, index) => {
                              const isSelected =
                                category === "condiments"
                                  ? selections.condiments?.some(
                                      (f) => f.id === food.id
                                    )
                                  : selections[category as CategoryType]?.id ===
                                    food.id;

                              return (
                                <FoodItem
                                  key={food.id}
                                  food={food}
                                  category={category as CategoryType}
                                  index={index}
                                  isSelected={!!isSelected}
                                  selectedFoodInCategory={
                                    isSelected ? food : null
                                  }
                                  onSelect={() =>
                                    handleFoodSelect(
                                      category as CategoryType,
                                      food
                                    )
                                  }
                                  showVisibilityControls={false}
                                  isChildView={false}
                                  onServingClick={() => {}}
                                  isHidden={false}
                                  onToggleVisibility={() => {}}
                                  mealType={mealType}
                                />
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="describe">
              <div className="space-y-4">
                <Label htmlFor="description">Describe the Meal</Label>
                <Textarea
                  id="description"
                  placeholder="Example: Deviled eggs made with mustard, mayo, and paprika"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-[200px]"
                />
              </div>
            </TabsContent>

            <TabsContent value="recipe">
              <div className="space-y-4">
                <Label htmlFor="recipe">Enter Recipe</Label>
                <Textarea
                  id="recipe"
                  placeholder="Enter ingredients and instructions..."
                  value={recipe}
                  onChange={(e) => setRecipe(e.target.value)}
                  className="h-[200px]"
                />
              </div>
            </TabsContent>

            <TabsContent value="scan">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <FoodSearch
                      onFoodFound={(food) => {
                        setCurrentIngredient((prev) => ({
                          ...prev,
                          name: food.name,
                          foodId: food.id,
                        }));
                      }}
                      onScanRequest={() => setIsScanning(true)}
                    />
                  </div>
                  <Input
                    type="number"
                    placeholder="Amount"
                    className="w-24"
                    value={currentIngredient.amount || ""}
                    onChange={(e) =>
                      setCurrentIngredient((prev) => ({
                        ...prev,
                        amount: parseFloat(e.target.value),
                      }))
                    }
                  />
                  <select
                    className="border rounded px-2"
                    value={currentIngredient.unit || ""}
                    onChange={(e) =>
                      setCurrentIngredient((prev) => ({
                        ...prev,
                        unit: e.target.value as ServingSizeUnit,
                      }))
                    }
                  >
                    <option value="">Unit</option>
                    <option value="g">grams</option>
                    <option value="ml">ml</option>
                    <option value="cup">cup</option>
                    <option value="tbsp">tbsp</option>
                    <option value="tsp">tsp</option>
                    <option value="piece">piece</option>
                  </select>
                  <Button onClick={handleAddIngredient}>Add</Button>
                </div>

                <div className="space-y-2">
                  {ingredients.map((ingredient, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-2 bg-gray-50 rounded"
                    >
                      <span>{ingredient.name}</span>
                      <span>
                        {ingredient.amount} {ingredient.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Meal"}
          </Button>
        </DialogFooter>
      </DialogContent>

      {isScanning && (
        <BarcodeScanner
          onScan={(food) => {
            setIsScanning(false);
            setCurrentIngredient((prev) => ({
              ...prev,
              name: food.name,
              foodId: food.id,
            }));
          }}
          onClose={() => setIsScanning(false)}
        />
      )}
    </Dialog>
  );
};
