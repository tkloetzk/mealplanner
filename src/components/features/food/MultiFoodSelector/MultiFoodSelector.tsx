import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CategoryType } from "@/types/shared";
import { Food } from "@/types/food";
import { FoodSearch } from "../FoodSearch/FoodSearch";
import { X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SelectedFoodWithCategory {
  id: string; // Unique identifier for this selection (since same food could be added twice to condiments)
  food: Food;
  category: CategoryType;
  servings: number;
}

interface MultiFoodSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    selections: Array<{ category: CategoryType; food: Food; servings: number }>
  ) => void;
}

const CATEGORIES: { value: CategoryType; label: string }[] = [
  { value: "proteins", label: "Proteins" },
  { value: "grains", label: "Grains" },
  { value: "fruits", label: "Fruits" },
  { value: "vegetables", label: "Vegetables" },
  { value: "milk", label: "Milk" },
  { value: "ranch", label: "Ranch" },
  { value: "condiments", label: "Condiments" },
  { value: "other", label: "Other" },
];

export const MultiFoodSelector = ({
  isOpen,
  onClose,
  onConfirm,
}: MultiFoodSelectorProps) => {
  const [selectedFoods, setSelectedFoods] = useState<
    SelectedFoodWithCategory[]
  >([]);
  const [error, setError] = useState<string | null>(null);

  const handleFoodFound = (food: Food) => {
    // Auto-assign category based on food's category property
    const defaultCategory = food.category || "other";

    const newSelection: SelectedFoodWithCategory = {
      id: `${food.id || food.name}-${Date.now()}`,
      food,
      category: defaultCategory,
      servings: 1,
    };

    setSelectedFoods((prev) => [...prev, newSelection]);
    setError(null);
  };

  const handleRemoveFood = (id: string) => {
    setSelectedFoods((prev) => prev.filter((s) => s.id !== id));
  };

  const handleCategoryChange = (id: string, newCategory: CategoryType) => {
    setSelectedFoods((prev) =>
      prev.map((s) => (s.id === id ? { ...s, category: newCategory } : s))
    );
    setError(null);
  };

  const handleServingsChange = (id: string, newServings: number) => {
    setSelectedFoods((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, servings: Math.max(1, newServings) } : s
      )
    );
  };

  const validateSelections = (): string | null => {
    if (selectedFoods.length === 0) {
      return "Please add at least one food";
    }

    // Check for duplicate categories (except condiments)
    const categoryCounts: Record<string, number> = {};

    selectedFoods.forEach(({ category }) => {
      if (category !== "condiments") {
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      }
    });

    const duplicateCategories = Object.entries(categoryCounts)
      .filter(([, count]) => count > 1)
      .map(([category]) => category);

    if (duplicateCategories.length > 0) {
      return `Cannot add multiple foods to: ${duplicateCategories.join(", ")}. Only condiments allow multiple foods.`;
    }

    return null;
  };

  const handleConfirm = () => {
    const validationError = validateSelections();
    if (validationError) {
      setError(validationError);
      return;
    }

    onConfirm(
      selectedFoods.map(({ food, category, servings }) => ({
        food,
        category,
        servings,
      }))
    );

    // Reset state
    setSelectedFoods([]);
    setError(null);
    onClose();
  };

  const handleCancel = () => {
    setSelectedFoods([]);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Multiple Foods</DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex flex-col gap-4">
          {/* Search Section */}
          <div className="space-y-2">
            <Label>Search for foods to add</Label>
            <FoodSearch
              onFoodFound={handleFoodFound}
              onError={(err) =>
                setError(typeof err === "string" ? err : err.message)
              }
            />
          </div>

          {/* Selected Foods List */}
          <div className="flex-1 min-h-0 space-y-2">
            <Label>
              Selected Foods ({selectedFoods.length}){selectedFoods.length === 0 && " - Add foods using search above"}
            </Label>

            {selectedFoods.length > 0 && (
              <ScrollArea className="h-[300px] border rounded-md p-4">
                <div className="space-y-3">
                  {selectedFoods.map((selection) => (
                    <div
                      key={selection.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border"
                    >
                      {/* Food Name */}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {selection.food.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {selection.food.calories} cal | P:{" "}
                          {selection.food.protein}g | C: {selection.food.carbs}
                          g | F: {selection.food.fat}g
                        </div>
                      </div>

                      {/* Category Selector */}
                      <div className="w-36">
                        <Select
                          value={selection.category}
                          onValueChange={(value) =>
                            handleCategoryChange(
                              selection.id,
                              value as CategoryType
                            )
                          }
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map((cat) => (
                              <SelectItem key={cat.value} value={cat.value}>
                                {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Servings Input */}
                      <div className="w-20">
                        <Input
                          type="number"
                          min="1"
                          value={selection.servings}
                          onChange={(e) =>
                            handleServingsChange(
                              selection.id,
                              parseInt(e.target.value) || 1
                            )
                          }
                          className="h-8"
                        />
                      </div>

                      {/* Remove Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveFood(selection.id)}
                        className="h-8 w-8"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedFoods.length === 0}
          >
            Add All to Meal ({selectedFoods.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
