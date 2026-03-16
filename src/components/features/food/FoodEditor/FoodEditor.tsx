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
import { AlertCircle, Trash2, Minus, Plus, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Food,
  FoodPreparation,
  ServingSizeUnit,
  ServingSizeOption,
} from "@/types/food";
import { CategoryType, MealType, NutritionInfo } from "@/types/shared";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { validateNutrition, isValidFood } from "./utils/validateNutrition";
import { FoodSearch } from "../FoodSearch/FoodSearch";
import { ImageUploader } from "./components/BarcodeScanner/ImageUploader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { FoodScoreDisplay } from "../../meals/shared/FoodScoreDisplay";
import { BarcodeScanner } from "./components/BarcodeScanner";
import { calculateNutritionForServing } from "@/utils/foodMigration";

// Add these constants at the top of the file
const SUBCATEGORIES = [
  { label: "Spreads", value: "spreads" },
  { label: "Dressings", value: "dressings" },
  { label: "Sauces", value: "sauces" },
  { label: "Dips", value: "dips" },
  { label: "Toppings", value: "toppings" },
] as const;

const RECOMMENDED_USES = [
  { label: "Breads", value: "breads" },
  { label: "Vegetables", value: "vegetables" },
  { label: "Fruits", value: "fruits" },
  { label: "Proteins", value: "proteins" },
  { label: "Any", value: "any" },
] as const;

const MEAL_TYPES: { label: string; value: MealType }[] = [
  { label: "Breakfast", value: "breakfast" },
  { label: "Lunch", value: "lunch" },
  { label: "Dinner", value: "dinner" },
  { label: "Midmorning Snack", value: "midmorning_snack" },
  { label: "Afternoon Snack", value: "afternoon_snack" },
  { label: "Bedtime Snack", value: "bedtime_snack" },
] as const;

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
    sodium: 0,
    fiber: 0,
    sugar: 0,
    saturatedFat: 0,
    transFat: 0,
    cholesterol: 0,
    servingSize: "1",
    servingSizeUnit: "tbsp" as ServingSizeUnit,
    category: "proteins" as CategoryType,
    meal: [],
    subcategory: "",
    recommendedUses: [],
    maxServingsPerMeal: 2,
    isCondiment: false,
    ...initialFood,
  };

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [food, setFood] = useState<Partial<Food>>(initialFoodState);
  const [isScanning, setIsScanning] = useState(false);
  const [showToChild, setShowToChild] = useState(!initialFood?.hiddenFromChild);

  const [capturedImage, setCapturedImage] = useState<string | null>(
    initialFood?.cloudinaryUrl ||
      initialFood?.imageUrl ||
      initialFood?.imagePath ||
      null,
  );
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // New state for multiple serving sizes
  const [baseNutrition, setBaseNutrition] = useState<NutritionInfo>(
    initialFood?.baseNutritionPer100g || {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    },
  );

  const [servingSizes, setServingSizes] = useState<ServingSizeOption[]>(
    initialFood?.servingSizes || [
      {
        id: "default",
        label: "1 serving",
        amount: 1,
        unit: "piece",
        gramsEquivalent: 100,
      },
    ],
  );

  // State for collapsible base nutrition section
  const [showBaseNutrition, setShowBaseNutrition] = useState(false);
  const [showExtendedNutrition, setShowExtendedNutrition] = useState(false);

  const [preparations, setPreparations] = useState<FoodPreparation[]>(
    initialFood?.preparations || [],
  );

  const handleAddPreparation = () => {
    setPreparations((prev) => [
      ...prev,
      { id: `prep-${Date.now()}`, name: "" },
    ]);
  };

  const handleUpdatePreparation = (
    index: number,
    field: keyof FoodPreparation,
    value: string,
  ) => {
    setPreparations((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemovePreparation = (index: number) => {
    setPreparations((prev) => prev.filter((_, i) => i !== index));
  };

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
          : "An unexpected error occurred during deletion.",
      );
    } finally {
      setLoading(false);
      setIsDeleteDialogOpen(false);
    }
  };

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

  const handleNumberInput =
    (field: keyof Food) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value === "" ? 0 : Number(e.target.value);
      setFood((prev) => ({ ...prev, [field]: value }));
    };

  const handleTextInput =
    (field: keyof Food) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFood((prev) => ({ ...prev, [field]: e.target.value }));
    };

  // Handlers for base nutrition
  const handleBaseNutritionChange =
    (field: keyof NutritionInfo) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value === "" ? 0 : Number(e.target.value);
      setBaseNutrition((prev) => ({ ...prev, [field]: value }));
    };

  // Handlers for serving sizes
  const handleAddServingSize = () => {
    const newOption: ServingSizeOption = {
      id: `serving-${Date.now()}`,
      label: "",
      amount: 1,
      unit: "piece",
      gramsEquivalent: 0,
    };
    setServingSizes([...servingSizes, newOption]);
  };

  const handleUpdateServingSize = (
    index: number,
    field: keyof ServingSizeOption,
    value: string | number,
  ) => {
    const updated = [...servingSizes];
    updated[index] = { ...updated[index], [field]: value };
    setServingSizes(updated);
  };

  const handleRemoveServingSize = (index: number) => {
    if (servingSizes.length > 1) {
      setServingSizes(servingSizes.filter((_, i) => i !== index));
    }
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
    setSearchError(null);
    setFood((prev) => ({ ...prev, ...data }));

    // Update base nutrition if provided from UPC scan
    if (data.baseNutritionPer100g) {
      setBaseNutrition(data.baseNutritionPer100g);
    }
    if (data.servingSizes?.length) {
      setServingSizes(data.servingSizes);
    }
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

        // Auto-populate per-serving macros from base nutrition if not set manually
        const perServing =
          food.protein === 0 &&
          food.carbs === 0 &&
          food.fat === 0 &&
          baseNutrition.protein > 0 &&
          (servingSizes[0]?.gramsEquivalent ?? 0) > 0
            ? calculateNutritionForServing(
                baseNutrition,
                servingSizes[0].gramsEquivalent,
                1,
              )
            : null;

        // Add condiment-specific fields if category is condiments
        const foodToSave = {
          ...food,
          ...(perServing && {
            calories: Math.round(perServing.calories),
            protein: perServing.protein,
            carbs: perServing.carbs,
            fat: perServing.fat,
          }),
          hiddenFromChild: !showToChild,
          isCondiment: food.category === "condiments",
          baseNutritionPer100g: baseNutrition,
          servingSizes: servingSizes,
          preparations: preparations.length > 0 ? preparations : undefined,
          ...(food.category === "condiments" && {
            subcategory: food.subcategory || "other",
            recommendedUses: food.recommendedUses || ["any"],
            maxServingsPerMeal: food.maxServingsPerMeal || 2,
          }),
        };

        await onSave(foodToSave as Food);
      } catch (error) {
        console.error("Error saving food:", error);
        setValidationErrors(["Failed to save food"]);
      } finally {
        setLoading(false);
      }
    }
  };

  const isNew = !initialFood || !initialFood.id;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-3 z-50 overflow-auto">
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

        <FoodSearch
          onFoodFound={handleUPCFound}
          onError={setSearchError}
          onScanRequest={() => setIsScanning(true)}
        />

        {isScanning && (
          <BarcodeScanner
            onScan={(upc) => {
              setIsScanning(false);
              handleUPCFound(upc);
            }}
            onClose={() => setIsScanning(false)}
          />
        )}

        {searchError && (
          <Alert variant="destructive" className="py-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{searchError}</AlertDescription>
          </Alert>
        )}

        <ImageUploader food={food} onUpload={handleImageCaptured} />

        {food.analysis && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3 justify-between">
              <div>
                <h4 className="text-sm font-medium">Nutrition Score</h4>
                <p className="text-xs text-gray-600">
                  Based on nutritional quality
                </p>
              </div>
              {food?.analysis?.score && (
                <FoodScoreDisplay analysis={food?.analysis} />
              )}
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
                    ),
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
                <AlertDescription data-testid="validation-error">
                  {error}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="mt-4">
            <Label className="flex items-center space-x-2">
              <Checkbox
                checked={showToChild}
                onCheckedChange={(checked) => setShowToChild(!!checked)}
              />
              <span>Show to children</span>
            </Label>
          </div>

          <div>
            <Label className="text-sm" htmlFor="name">
              Name
            </Label>
            <Input
              id="name"
              value={food.name ?? ""}
              onChange={handleTextInput("name")}
              required
            />
          </div>

          <div>
            <Label className="text-sm" htmlFor="ingredients">
              Ingredients
            </Label>
            <Textarea
              id="ingredients"
              value={food.ingredients ?? ""}
              onChange={(e) =>
                setFood((prev) => ({ ...prev, ingredients: e.target.value }))
              }
              placeholder="e.g., Water, Sugar, Salt..."
              rows={3}
              className="text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm" htmlFor="calories">
                Calories
              </Label>
              <Input
                type="number"
                value={food.calories ?? 0}
                onChange={handleNumberInput("calories")}
                min={0}
                id="calories"
                required
              />
            </div>
            <div>
              <Label className="text-sm" htmlFor="category">
                Category
              </Label>
              <Select
                value={food.category}
                onValueChange={(value: CategoryType) =>
                  setFood((prev) => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue data-testid="category-select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="proteins">Proteins</SelectItem>
                  <SelectItem value="grains">Grains</SelectItem>
                  <SelectItem value="fruits">Fruits</SelectItem>
                  <SelectItem value="vegetables">Vegetables</SelectItem>
                  <SelectItem value="condiments">Condiments</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {food.category === "condiments" && (
              <div className="space-y-4 border-t pt-4 mt-4">
                <div>
                  <Label className="text-sm mb-2">Subcategory</Label>
                  <Select
                    value={food.subcategory}
                    onValueChange={(value) =>
                      setFood((prev) => ({ ...prev, subcategory: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a subcategory" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBCATEGORIES.map(({ label, value }) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm mb-2 block">Recommended Uses</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {RECOMMENDED_USES.map(({ label, value }) => (
                      <div key={value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`use-${value}`}
                          checked={food.recommendedUses?.includes(value)}
                          onCheckedChange={(checked) =>
                            setFood((prev) => ({
                              ...prev,
                              recommendedUses: checked
                                ? [...(prev.recommendedUses || []), value]
                                : (prev.recommendedUses || []).filter(
                                    (use) => use !== value,
                                  ),
                            }))
                          }
                        />
                        <Label
                          htmlFor={`use-${value}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm mb-2">
                    Maximum Servings per Meal
                  </Label>
                  <Input
                    type="number"
                    min="0.5"
                    max="5"
                    step="0.5"
                    value={food.maxServingsPerMeal || 2}
                    onChange={(e) =>
                      setFood((prev) => ({
                        ...prev,
                        maxServingsPerMeal: parseFloat(e.target.value),
                      }))
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Recommended: 2-3 servings maximum
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-sm" htmlFor="protein">
                Protein (g)
              </Label>
              <Input
                type="number"
                id="protein"
                value={food.protein ?? 0}
                onChange={handleNumberInput("protein")}
                min={0}
                step="0.1"
              />
            </div>
            <div>
              <Label className="text-sm" htmlFor="carbs">
                Carbs (g)
              </Label>
              <Input
                type="number"
                id="carbs"
                value={food.carbs ?? 0}
                onChange={handleNumberInput("carbs")}
                min={0}
                step="0.1"
              />
            </div>
            <div>
              <Label className="text-sm" htmlFor="fat">
                Fat (g)
              </Label>
              <Input
                type="number"
                id="fat"
                value={food.fat ?? 0}
                onChange={handleNumberInput("fat")}
                min={0}
                step="0.1"
              />
            </div>
          </div>

          {/* Base Nutrition Section (per 100g) - Collapsible */}
          <div className="border rounded-lg">
            <button
              type="button"
              onClick={() => setShowBaseNutrition(!showBaseNutrition)}
              className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-t-lg transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">
                  Base Nutrition (per 100g)
                </span>
                {baseNutrition.calories > 0 && (
                  <Badge variant="outline" className="text-xs">
                    Auto-calculated
                  </Badge>
                )}
              </div>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  showBaseNutrition ? "rotate-180" : ""
                }`}
              />
            </button>

            {showBaseNutrition && (
              <div className="p-4 border-t bg-gray-50">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Calories</Label>
                    <Input
                      type="number"
                      value={baseNutrition.calories ?? 0}
                      onChange={handleBaseNutritionChange("calories")}
                      min={0}
                      step="0.1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Protein (g)</Label>
                    <Input
                      type="number"
                      value={baseNutrition.protein ?? 0}
                      onChange={handleBaseNutritionChange("protein")}
                      min={0}
                      step="0.1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Carbs (g)</Label>
                    <Input
                      type="number"
                      value={baseNutrition.carbs ?? 0}
                      onChange={handleBaseNutritionChange("carbs")}
                      min={0}
                      step="0.1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Fat (g)</Label>
                    <Input
                      type="number"
                      value={baseNutrition.fat ?? 0}
                      onChange={handleBaseNutritionChange("fat")}
                      min={0}
                      step="0.1"
                    />
                  </div>
                </div>
              </div>
            )}

            {!showBaseNutrition && baseNutrition.calories === 0 && (
              <p className="text-xs text-gray-500 px-3 pb-2">
                Usually auto-calculated from serving sizes or UPC scan
              </p>
            )}
          </div>

          {/* Extended Nutrition (per serving) */}
          <div className="border rounded-lg">
            <button
              type="button"
              className="w-full flex items-center justify-between p-3 text-sm font-medium"
              onClick={() => setShowExtendedNutrition((v) => !v)}
            >
              <span>Extended Nutrition</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${showExtendedNutrition ? "rotate-180" : ""}`}
              />
            </button>
            {showExtendedNutrition && (
              <div className="grid grid-cols-2 gap-3 p-3 pt-0">
                <div>
                  <Label className="text-sm" htmlFor="sodium">Sodium (mg)</Label>
                  <Input type="number" id="sodium" value={food.sodium ?? 0} onChange={handleNumberInput("sodium")} min={0} step="1" />
                </div>
                <div>
                  <Label className="text-sm" htmlFor="fiber">Fiber (g)</Label>
                  <Input type="number" id="fiber" value={food.fiber ?? 0} onChange={handleNumberInput("fiber")} min={0} step="0.1" />
                </div>
                <div>
                  <Label className="text-sm" htmlFor="sugar">Sugar (g)</Label>
                  <Input type="number" id="sugar" value={food.sugar ?? 0} onChange={handleNumberInput("sugar")} min={0} step="0.1" />
                </div>
                <div>
                  <Label className="text-sm" htmlFor="saturatedFat">Saturated Fat (g)</Label>
                  <Input type="number" id="saturatedFat" value={food.saturatedFat ?? 0} onChange={handleNumberInput("saturatedFat")} min={0} step="0.1" />
                </div>
                <div>
                  <Label className="text-sm" htmlFor="transFat">Trans Fat (g)</Label>
                  <Input type="number" id="transFat" value={food.transFat ?? 0} onChange={handleNumberInput("transFat")} min={0} step="0.1" />
                </div>
                <div>
                  <Label className="text-sm" htmlFor="cholesterol">Cholesterol (mg)</Label>
                  <Input type="number" id="cholesterol" value={food.cholesterol ?? 0} onChange={handleNumberInput("cholesterol")} min={0} step="1" />
                </div>
              </div>
            )}
          </div>

          {/* Serving Sizes Section */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-sm">Serving Sizes</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddServingSize}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>

            {servingSizes.map((option, index) => {
              const calculatedNutrition = calculateNutritionForServing(
                baseNutrition,
                option.gramsEquivalent || 0,
                1,
              );

              return (
                <div
                  key={option.id}
                  className="border rounded-lg p-3 space-y-2 bg-white"
                >
                  <div className="flex justify-between items-start">
                    <Label className="text-xs font-medium text-gray-600">
                      Option {index + 1}
                    </Label>
                    {servingSizes.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveServingSize(index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2">
                      <Label className="text-xs">Label</Label>
                      <Input
                        placeholder="e.g., 1 strawberry, 1 cup"
                        value={option.label}
                        onChange={(e) =>
                          handleUpdateServingSize(
                            index,
                            "label",
                            e.target.value,
                          )
                        }
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Amount</Label>
                      <Input
                        type="number"
                        value={option.amount}
                        onChange={(e) =>
                          handleUpdateServingSize(
                            index,
                            "amount",
                            Number(e.target.value),
                          )
                        }
                        min="0.1"
                        step="0.1"
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Unit</Label>
                      <Select
                        value={option.unit}
                        onValueChange={(value) =>
                          handleUpdateServingSize(index, "unit", value)
                        }
                      >
                        <SelectTrigger className="text-sm">
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
                    <div className="col-span-2">
                      <Label className="text-xs">Weight (grams)</Label>
                      <Input
                        type="number"
                        placeholder="How many grams?"
                        value={option.gramsEquivalent || ""}
                        onChange={(e) =>
                          handleUpdateServingSize(
                            index,
                            "gramsEquivalent",
                            Number(e.target.value),
                          )
                        }
                        min="0"
                        step="0.1"
                        className="text-sm"
                      />
                    </div>
                  </div>

                  {/* Calculated nutrition preview */}
                  {option.gramsEquivalent > 0 && (
                    <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                      Per serving: {Math.round(calculatedNutrition.calories)}{" "}
                      cal, {calculatedNutrition.protein.toFixed(1)}g protein,{" "}
                      {calculatedNutrition.carbs.toFixed(1)}g carbs,{" "}
                      {calculatedNutrition.fat.toFixed(1)}g fat
                    </div>
                  )}
                </div>
              );
            })}
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

          {/* Preparations Section */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-sm">Preparations</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddPreparation}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
            {preparations.length === 0 && (
              <p className="text-xs text-gray-500">
                Add preparation variants (e.g., Scrambled Eggs, Hard Boiled) so
                kids can choose how it&apos;s made.
              </p>
            )}
            {preparations.map((prep, index) => (
              <div
                key={prep.id}
                className="border rounded-lg p-3 space-y-2 bg-white"
              >
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-medium text-gray-600">
                    Preparation {index + 1}
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemovePreparation(index)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <div>
                  <Label className="text-xs">Name</Label>
                  <Input
                    placeholder="e.g., Scrambled Eggs"
                    value={prep.name}
                    onChange={(e) =>
                      handleUpdatePreparation(index, "name", e.target.value)
                    }
                    className="text-sm"
                  />
                </div>
                <ImageUploader
                  imageUrl={prep.cloudinaryUrl || prep.imageUrl || null}
                  onUpload={(url) =>
                    handleUpdatePreparation(index, "cloudinaryUrl", url)
                  }
                />
              </div>
            ))}
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
              {loading ? "Saving..." : "Save Food"}
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
