// components/FoodEditor.tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Camera, AlertCircle } from "lucide-react";
import { Food, CategoryType, ServingSizeUnit } from "@/types/food";
import { BarcodeScanner } from "./BarcodeScanner";
import { ImageCapture } from "./ImageCapture";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FoodEditorProps {
  onSave: (food: Food) => void;
  onCancel: () => void;
  initialFood?: Partial<Food>;
}

// Nutrition validation constants
const CALORIES_PER_PROTEIN = 4;
const CALORIES_PER_CARB = 4;
const CALORIES_PER_FAT = 9;
const MAX_CALORIES_PER_SERVING = 1000;
const MIN_CALORIES_PER_SERVING = 0;

export function FoodEditor({ onSave, onCancel, initialFood }: FoodEditorProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);
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
      imageUrl: "",
    }
  );
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const validateNutrition = (foodData: Partial<Food>): string[] => {
    const errors: string[] = [];

    // Basic range checks
    if (
      foodData.calories! < MIN_CALORIES_PER_SERVING ||
      foodData.calories! > MAX_CALORIES_PER_SERVING
    ) {
      errors.push(
        `Calories should be between ${MIN_CALORIES_PER_SERVING} and ${MAX_CALORIES_PER_SERVING}`
      );
    }

    if (foodData.protein! < 0) errors.push("Protein cannot be negative");
    if (foodData.carbs! < 0) errors.push("Carbs cannot be negative");
    if (foodData.fat! < 0) errors.push("Fat cannot be negative");

    // Calculate expected calories from macronutrients
    const expectedCalories =
      foodData.protein! * CALORIES_PER_PROTEIN +
      foodData.carbs! * CALORIES_PER_CARB +
      foodData.fat! * CALORIES_PER_FAT;

    // Allow for some rounding differences (±10 calories)
    if (Math.abs(expectedCalories - foodData.calories!) > 10) {
      errors.push("Calories don't match the macronutrient totals");
    }

    // Validate serving size
    if (parseFloat(foodData.servingSize!) <= 0) {
      errors.push("Serving size must be greater than 0");
    }

    return errors;
  };

  const handleUPCScan = async (upc: string) => {
    setIsScanning(false);
    setLoading(true);
    try {
      const response = await fetch(`/api/upc?upc=${upc}`);
      if (response.ok) {
        const data = await response.json();
        setFood((prev) => ({ ...prev, ...data }));
        // Validate the scanned data
        const errors = validateNutrition(data);
        setValidationErrors(errors);
      } else {
        const errorData = await response.json();
        setValidationErrors([
          errorData.error || "Failed to fetch product data",
        ]);
      }
    } catch (error) {
      console.error(error);
      setValidationErrors([
        "Error scanning product. Please try again or enter manually.",
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageCapture = async (imageData: string) => {
    setIsTakingPhoto(false);
    setLoading(true);
    try {
      // Upload the image and get a URL back
      const formData = new FormData();
      formData.append("image", imageData);
      const response = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });
      if (response.ok) {
        const { url } = await response.json();
        setFood((prev) => ({ ...prev, imageUrl: url }));
      }
    } catch (error) {
      console.error(error);

      setValidationErrors(["Failed to upload image. Please try again."]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateNutrition(food);
    setValidationErrors(errors);

    if (errors.length === 0 && isValidFood(food)) {
      onSave(food as Food);
    }
  };

  const isValidFood = (food: Partial<Food>): food is Food => {
    return !!(food.name && food.calories !== undefined && food.category);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">
            {initialFood ? "Edit Food" : "Add New Food"}
          </h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsTakingPhoto(true)}
              disabled={loading}
            >
              <Camera className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsScanning(true)}
              disabled={loading}
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  d="M4 7V4h3m13 0h3v3M20 17v3h-3m-13 0H4v-3"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </Button>
          </div>
        </div>

        {validationErrors.length > 0 && (
          <div className="mb-4">
            {validationErrors.map((error, index) => (
              <Alert variant="destructive" key={index} className="mb-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <Input
              value={food.name}
              onChange={(e) =>
                setFood((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Calories</label>
              <Input
                type="number"
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
              <label className="block text-sm font-medium mb-1">Category</label>
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

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Protein (g)
              </label>
              <Input
                type="number"
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
              <label className="block text-sm font-medium mb-1">
                Carbs (g)
              </label>
              <Input
                type="number"
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
              <label className="block text-sm font-medium mb-1">Fat (g)</label>
              <Input
                type="number"
                step="0.1"
                value={food.fat}
                onChange={(e) =>
                  setFood((prev) => ({ ...prev, fat: Number(e.target.value) }))
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Serving Size
              </label>
              <Input
                value={food.servingSize}
                onChange={(e) =>
                  setFood((prev) => ({ ...prev, servingSize: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Unit</label>
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
                  <SelectItem value="cup">cups</SelectItem>
                  <SelectItem value="piece">pieces</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
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

        {isScanning && (
          <BarcodeScanner
            onScan={handleUPCScan}
            onClose={() => setIsScanning(false)}
          />
        )}

        {isTakingPhoto && (
          <ImageCapture
            onCapture={handleImageCapture}
            onCancel={() => setIsTakingPhoto(false)}
          />
        )}
      </div>
    </div>
  );
}
