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
  const [manualUPC, setManualUPC] = useState(""); // State for manual UPC entry
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
    }
  );
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateNutrition(food);
    setValidationErrors(errors);

    // if (errors.length === 0 && isValidFood(food)) {
    console.log(food);
    onSave(food as Food);
    //}
  };

  const isValidFood = (food: Partial<Food>): food is Food => {
    return !!(food.name && food.calories !== undefined && food.category);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-auto">
      <div className="bg-white rounded-lg w-full max-w-md p-6 flex flex-col space-y-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">
            {initialFood ? "Edit Food" : "Add New Food"}
          </h2>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Manual UPC</label>
          <div className="flex gap-2">
            <Input
              type="text"
              value={manualUPC}
              placeholder="Enter UPC code"
              onChange={(e) => setManualUPC(e.target.value)}
            />
            <Button
              onClick={() => handleUPCEntry()}
              disabled={!manualUPC || loading}
            >
              Search
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsScanning(true)}
              disabled={loading}
            >
              Use Scanner
            </Button>
          </div>
        </div>

        {/* Image Display/Capture Section */}
        <div className="mb-6">
          {food.imageUrl ? (
            <div className="relative aspect-square mb-2">
              <img
                src={food.imageUrl}
                alt={food.name || "Food image"}
                style={{ width: "100%" }}
                // fill
                // unoptimized
                className="object-cover rounded-lg"
              />
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
            <Button
              variant="outline"
              className="w-full aspect-square flex flex-col items-center justify-center gap-2"
              onClick={() => setIsTakingPhoto(true)}
            >
              <Camera className="h-8 w-8" />
              Take Photo
            </Button>
          )}
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

        <form onSubmit={handleSubmit} className="space-y-4 overflow-auto mb-12">
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

          {food?.score && <div>{food.score}</div>}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Protein (g)
              </label>
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
              <label className="block text-sm font-medium mb-1">
                Carbs (g)
              </label>
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
              <label className="block text-sm font-medium mb-1">Fat (g)</label>
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
                  <SelectItem value="tsp">tsp</SelectItem>
                  <SelectItem value="tbsp">tbsp</SelectItem>
                  <SelectItem value="cup">cups</SelectItem>
                  <SelectItem value="piece">pieces</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Sticky buttons */}
          <div className="sticky bottom-0 bg-white py-4 flex justify-end gap-2">
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
