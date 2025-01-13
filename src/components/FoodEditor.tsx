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
import { Camera, AlertCircle } from "lucide-react";
import { Food, CategoryType, ServingSizeUnit, MealType } from "@/types/food";
import { BarcodeScanner } from "./BarcodeScanner";
import { ImageCapture } from "./ImageCapture";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { NutriScore } from "./NutriScore";

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

const MEAL_TYPES: { label: string; value: MealType }[] = [
  { label: "Breakfast", value: "breakfast" },
  { label: "Lunch", value: "lunch" },
  { label: "Dinner", value: "dinner" },
  { label: "Snack", value: "snack" },
];

export function FoodEditor({ onSave, onCancel, initialFood }: FoodEditorProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [manualUPC, setManualUPC] = useState("");
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
      meal: [], // Initialize empty meal compatibility array
    }
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

  const handleUPC = async (upc: string) => {
    if (!upc || typeof upc !== "string") {
      console.error("Invalid UPC:", upc);
      return;
    }

    console.log("Fetching product for UPC:", upc);
    setLoading(true);

    try {
      const response = await fetch(`/api/upc?upc=${encodeURIComponent(upc)}`);
      if (response.ok) {
        const data = await response.json();
        setFood((prev) => ({ ...prev, ...data }));
      } else {
        console.error("Failed to fetch product data. Status:", response.status);
      }
    } catch (error) {
      console.error("Error fetching product data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUPCEntry = () => {
    handleUPC(manualUPC);
  };

  const handleUPCScan = (scannedFood: Food) => {
    if (scannedFood?.upc) {
      handleUPC(scannedFood.upc);
    } else {
      console.error("Invalid UPC in scanned food:", scannedFood);
    }
  };

  const handleImageCapture = async (imageData: string) => {
    setIsTakingPhoto(false);
    setLoading(true);
    try {
      // Upload the captured image
      const formData = new FormData();
      formData.append("image", imageData);
      const response = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });
      if (response.ok) {
        const { url } = await response.json();
        // Update the food with the new image URL
        setFood((prev) => ({ ...prev, imageUrl: url }));
      }
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setLoading(false);
    }
  };

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

    // Validate meal compatibility
    if (!foodData.meal?.length) {
      errors.push("Select at least one compatible meal type");
    }

    return errors;
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
    return !!(
      food.name &&
      food.calories !== undefined &&
      food.category &&
      food.meal?.length
    );
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

        <div className="flex gap-2 items-center">
          <Input
            type="text"
            value={manualUPC}
            placeholder="Enter UPC code"
            onChange={(e) => setManualUPC(e.target.value)}
            className="flex-1"
          />
          <Button
            size="sm"
            onClick={() => handleUPCEntry()}
            disabled={!manualUPC || loading}
          >
            Search
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsScanning(true)}
            disabled={loading}
          >
            Scan
          </Button>
        </div>

        {/* Image Section */}
        <div className="mb-2">
          {food.imageUrl ? (
            <div className="relative max-w-sm mx-auto">
              <div className="w-full max-h-[320px] rounded-lg overflow-hidden">
                <div className="relative pb-[75%]">
                  <img
                    src={food.imageUrl}
                    alt={food.name || "Food image"}
                    className="absolute inset-0 w-full h-full object-contain bg-gray-50"
                  />
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="absolute bottom-2 right-2"
                onClick={() => setIsTakingPhoto(true)}
              >
                <Camera className="h-4 w-4 mr-1" />
                Take New Photo
              </Button>
            </div>
          ) : (
            <div className="max-w-sm mx-auto">
              <Button
                variant="outline"
                className="w-full h-[240px] flex flex-col items-center justify-center gap-2"
                onClick={() => setIsTakingPhoto(true)}
              >
                <Camera className="h-8 w-8" />
                Take Photo
              </Button>
            </div>
          )}
        </div>

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
              <Label className="text-sm">Fat (g)</Label>
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
