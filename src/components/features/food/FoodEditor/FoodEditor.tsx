// components/FoodEditor.tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Trash2 } from "lucide-react";
import { Food, CategoryType, ServingSizeUnit, MealType } from "@/types/food";
import { UPCScanner } from "../../../FoodEditor/UPCScanner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { NutriScore } from "@/components/features/nutrition/NutritionSummary/components/NutriScore/NutriScore";
import {
  validateNutrition,
  isValidFood,
} from "@/components/features/food/FoodEditor/utils/validateNutrition";
import { ImageUploader } from "./components/BarcodeScanner/ImageUploader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const MEAL_TYPES: { label: string; value: string }[] = [
  { label: "Breakfast", value: "breakfast" },
  { label: "Lunch", value: "lunch" },
  { label: "Dinner", value: "dinner" },
  { label: "Snack", value: "snack" },
];

interface FoodEditorProps {
  onSave: (food: Food) => Promise<void>;
  onCancel: () => void;
  onDelete?: (foodId: string) => Promise<void>;
  initialFood?: Partial<Food>;
}

export function FoodEditor({
  onSave,
  onCancel,
  onDelete,
  initialFood,
}: FoodEditorProps) {
  const initialFoodState: Partial<Food> = {
    name: "",
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    servingSize: "1",
    servingSizeUnit: "g" as ServingSizeUnit,
    category: "proteins" as CategoryType,
    meal: [],
    ...initialFood, // Spread initialFood last to override defaults
  };

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [food, setFood] = useState<Partial<Food>>(initialFoodState);

  const [capturedImage, setCapturedImage] = useState<string | null>(
    initialFood?.cloudinaryUrl ||
      initialFood?.imageUrl ||
      initialFood?.imagePath ||
      null
  );
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleDelete = async () => {
    if (!initialFood?.id) {
      setDeleteError("Cannot delete a food that hasn't been saved.");
      return;
    }

    setLoading(true);
    setDeleteError(null);

    try {
      if (onDelete) {
        await onDelete(initialFood.id.toString());
        onCancel(); // Close the editor after successful deletion
      } else {
        setDeleteError("Deletion method not provided.");
      }
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred during deletion."
      );
    } finally {
      setLoading(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleMealCompatibilityChange = (mealType: MealType) => {
    // @ts-expect-error Idk what to do
    setFood((prev) => {
      const currentCompatibility = prev.meal || [];
      // @ts-expect-error Idk what to do
      const newCompatibility = currentCompatibility.includes(mealType)
        ? currentCompatibility.filter((meal) => meal !== mealType)
        : [...currentCompatibility, mealType];

      return {
        ...prev,
        meal: newCompatibility,
      };
    });
  };

  // Input change handlers with type safety
  const handleNumberInput =
    (field: keyof Food) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value === "" ? 0 : Number(e.target.value);
      setFood((prev) => ({ ...prev, [field]: value }));
    };

  const handleTextInput =
    (field: keyof Food) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFood((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const uploadImage = async (imageData: string) => {
    try {
      const response = await fetch(imageData);
      if (!response.ok) {
        throw new Error(`Image fetch failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const file = new File([blob], "captured-image.jpg", {
        type: "image/jpeg",
      });

      const formData = new FormData();
      formData.append("image", file);

      const uploadResponse = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Upload failed: ${errorText}`);
      }

      const { url } = await uploadResponse.json();
      return url;
    } catch (error) {
      console.error("Image upload error:", error);
      throw error;
    }
  };

  const handleUPCFound = (data: Food) => {
    setFood((prev) => ({ ...prev, ...data }));
  };

  const handleImageCaptured = (imageData: string) => {
    setCapturedImage(imageData);
    // Update food state to include the image
    setFood((prev) => ({
      ...prev,
      cloudinaryUrl: imageData,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateNutrition(food);
    setValidationErrors(errors);

    if (errors.length === 0 && isValidFood(food)) {
      setLoading(true);
      try {
        // Upload image if captured
        if (capturedImage) {
          const cloudinaryUrl = await uploadImage(capturedImage);
          food.cloudinaryUrl = cloudinaryUrl;
        }

        await onSave(food as Food);
      } catch (error) {
        console.error("Error saving food:", error);
        // Optionally set an error state to show to the user
      } finally {
        setLoading(false);
      }
    }
  };
  const isNew = initialFood && Object.keys(initialFood).length === 0;
  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onCancel();
        }
      }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-3 z-50 overflow-auto"
    >
      <div className="bg-white rounded-lg w-full max-w-md p-4 flex flex-col space-y-3 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">
            {!isNew ? "Edit Food" : "Add New Food"}
          </h2>
          {!isNew && (
            <Button
              variant="destructive"
              size="icon"
              onClick={() => setIsDeleteDialogOpen(true)}
              disabled={loading}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        <UPCScanner
          onUPCFound={handleUPCFound}
          onManualEntry={(upc) => handleUPCFound({ upc } as Food)}
        />
        <ImageUploader food={food} onUpload={handleImageCaptured} />{" "}
        {food.score && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div>
                <h4 className="text-sm font-medium">Nutrition Score</h4>
                <p className="text-xs text-gray-600">
                  Based on nutritional quality
                </p>
              </div>
              <NutriScore score={food.score} size="medium" />
            </div>
            {food.novaGroup && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <div className="text-sm">
                  <span className="font-medium">Processing Level: </span>
                  Group {food.novaGroup}
                </div>
              </div>
            )}
            {food.nutrientLevels && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <h4 className="text-sm font-medium mb-1">Nutrient Levels</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(food.nutrientLevels).map(
                    ([nutrient, level]) => (
                      <div key={nutrient} className="flex items-center gap-1">
                        <span className="capitalize">
                          {nutrient.replace("-", " ")}:
                        </span>
                        <span
                          className={`font-medium
                        ${level === "low" ? "text-green-600" : ""}
                        ${level === "moderate" ? "text-yellow-600" : ""}
                        ${level === "high" ? "text-red-600" : ""}`}
                        >
                          {level}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        {validationErrors.length > 0 && (
          <div>
            {validationErrors.map((error, index) => (
              <Alert variant="destructive" key={index} className="mb-2 py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label className="text-sm" htmlFor="name">
              Name
            </Label>
            <Input
              id="name"
              value={food.name ?? ""} // Provide empty string fallback
              onChange={handleTextInput("name")}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm">Calories</Label>
              <Input
                type="number"
                value={food.calories ?? 0} // Provide number fallback
                onChange={handleNumberInput("calories")}
                min={0}
                required
              />
            </div>
            <div>
              <Label className="text-sm">Category</Label>
              <Select
                value={food.category}
                onValueChange={(value: CategoryType) =>
                  setFood((prev) => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="proteins">Proteins</SelectItem>
                  <SelectItem value="grains">Grains</SelectItem>
                  <SelectItem value="fruits">Fruits</SelectItem>
                  <SelectItem value="vegetables">Vegetables</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-sm">Protein (g)</Label>
              <Input
                type="number"
                value={food.protein ?? 0}
                onChange={handleNumberInput("protein")}
                min={0}
                step="0.1"
              />
            </div>

            <div>
              <Label className="text-sm">Carbs (g)</Label>
              <Input
                type="number"
                value={food.carbs ?? 0}
                onChange={handleNumberInput("carbs")}
                min={0}
                step="0.1"
              />
            </div>

            <div>
              <Label className="text-sm">Fat (g)</Label>
              <Input
                type="number"
                value={food.fat ?? 0}
                onChange={handleNumberInput("fat")}
                min={0}
                step="0.1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm">Serving Size</Label>
              <Input
                value={food.servingSize ?? "1"}
                onChange={handleTextInput("servingSize")}
              />
            </div>
            <div>
              <Label className="text-sm">Unit</Label>
              <Select
                value={food.servingSizeUnit}
                onValueChange={(value: ServingSizeUnit) =>
                  setFood((prev) => ({ ...prev, servingSizeUnit: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="g">grams</SelectItem>
                  <SelectItem value="ml">milliliters</SelectItem>
                  <SelectItem value="oz">ounces</SelectItem>
                  <SelectItem value="tsp">tsp</SelectItem>
                  <SelectItem value="tbsp">tbsp</SelectItem>
                  <SelectItem value="cup">cups</SelectItem>
                  <SelectItem value="piece">pieces</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-sm">Compatible Meals</Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {MEAL_TYPES.map(({ label, value }) => (
                <div key={value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`meal-${value}`}
                    checked={food.meal?.includes(value)}
                    onCheckedChange={() => handleMealCompatibilityChange(value)}
                  />
                  <Label
                    htmlFor={`meal-${value}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="sticky bottom-0 bg-white pt-2 flex justify-end gap-2 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                loading || !isValidFood(food) || validationErrors.length > 0
              }
            >
              Save Food
            </Button>
          </div>
        </form>
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Food</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this food? This action cannot be
                undone.
              </DialogDescription>
            </DialogHeader>

            {deleteError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{deleteError}</AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
              >
                {loading ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
