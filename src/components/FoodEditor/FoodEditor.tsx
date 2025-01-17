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
import { AlertCircle } from "lucide-react";
import { Food, CategoryType, ServingSizeUnit, MealType } from "@/types/food";
import { UPCScanner } from "./UPCScanner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { NutriScore } from "@/components/NutriScore";
import {
  validateNutrition,
  isValidFood,
} from "@/components/FoodEditor/NutritionValidator";
import { ImageUploader } from "./ImageUploader";

const MEAL_TYPES: { label: string; value: MealType }[] = [
  { label: "Breakfast", value: "breakfast" },
  { label: "Lunch", value: "lunch" },
  { label: "Dinner", value: "dinner" },
  { label: "Snack", value: "snack" },
];

interface FoodEditorProps {
  onSave: (food: Food) => Promise<void>;
  onCancel: () => void;
  initialFood?: Partial<Food>;
}

export function FoodEditor({ onSave, onCancel, initialFood }: FoodEditorProps) {
  const [food, setFood] = useState<Partial<Food>>(
    initialFood || {
      name: "",
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      servingSize: "1",
      servingSizeUnit: "g",
      category: "proteins",
      meal: [],
    }
  );
  const [capturedImage, setCapturedImage] = useState<string | null>(
    initialFood?.cloudinaryUrl ||
      initialFood?.imageUrl ||
      initialFood?.imagePath ||
      null
  );
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleMealCompatibilityChange = (mealType: MealType) => {
    setFood((prev) => {
      const currentCompatibility = prev.meal || [];
      const newCompatibility = currentCompatibility.includes(mealType)
        ? currentCompatibility.filter((meal) => meal !== mealType)
        : [...currentCompatibility, mealType];

      return {
        ...prev,
        meal: newCompatibility,
      };
    });
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
            {initialFood ? "Edit Food" : "Add New Food"}
          </h2>
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
            <Label className="text-sm">Name</Label>
            <Input
              value={food.name}
              onChange={(e) =>
                setFood((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm">Calories</Label>
              <Input
                type="text"
                value={food.calories}
                onChange={(e) =>
                  setFood((prev) => ({
                    ...prev,
                    calories: Number(e.target.value),
                  }))
                }
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
                type="text"
                step="0.1"
                value={food.protein}
                onChange={(e) =>
                  setFood((prev) => ({
                    ...prev,
                    protein: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div>
              <Label className="text-sm">Carbs (g)</Label>
              <Input
                type="text"
                step="0.1"
                value={food.carbs}
                onChange={(e) =>
                  setFood((prev) => ({
                    ...prev,
                    carbs: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div>
              <Label className="text-sm">Fat (g)</Label>
              <Input
                type="text"
                step="0.1"
                value={food.fat}
                onChange={(e) =>
                  setFood((prev) => ({ ...prev, fat: Number(e.target.value) }))
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm">Serving Size</Label>
              <Input
                value={food.servingSize}
                onChange={(e) =>
                  setFood((prev) => ({ ...prev, servingSize: e.target.value }))
                }
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
      </div>
    </div>
  );
}
