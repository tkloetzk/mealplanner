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
import { CATEGORY_EMOJIS } from "@/constants/index";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FoodItem } from "../shared/FoodItem";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarcodeScanner } from "../../food/FoodEditor/components/BarcodeScanner";
import { FoodSearch } from "../../food/FoodSearch/FoodSearch";
import { ServingSelector } from "../shared/ServingSelector";
import { FoodEditor } from "../../food/FoodEditor/FoodEditor";

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
  upc?: string;
}

interface ServingSelectorContext {
  category: CategoryType;
  food: Food;
  currentServings: number;
}

const ARRAY_CATEGORIES: CategoryType[] = [
  "proteins",
  "grains",
  "fruits",
  "vegetables",
  "condiments",
  "other",
];

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
  const [pendingAnalyzedFood, setPendingAnalyzedFood] =
    useState<Partial<Food> | null>(null);
  const [showFoodReview, setShowFoodReview] = useState(false);
  const [postSaveFood, setPostSaveFood] = useState<Food | null>(null);

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
      proteins: [],
      grains: [],
      fruits: [],
      vegetables: [],
      milk: null,
      ranch: null,
      condiments: [],
      other: [],
    },
  );

  // Serving selector context
  const [servingSelectorContext, setServingSelectorContext] =
    useState<ServingSelectorContext | null>(null);

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

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setName("");
      setError(null);
      setCreationMethod("select");
      setDescription("");
      setRecipe("");
      setIngredients([]);
      setCurrentIngredient({});
      setPendingAnalyzedFood(null);
      setShowFoodReview(false);
      setPostSaveFood(null);
      setSelections(
        initialSelections || {
          proteins: [],
          grains: [],
          fruits: [],
          vegetables: [],
          milk: null,
          ranch: null,
          condiments: [],
          other: [],
        },
      );
    }
  }, [isOpen, initialSelections]);

  const handleFoodSelect = (category: CategoryType, food: Food) => {
    setSelections((prev) => {
      if (category === "condiments") {
        const currentCondiments = prev.condiments || [];
        const isSelected = currentCondiments.some((f) => f.id === food.id);
        return {
          ...prev,
          condiments: isSelected
            ? currentCondiments.filter((f) => f.id !== food.id)
            : [...currentCondiments, { ...food, servings: food.servings || 1 }],
        };
      } else if (category === "milk" || category === "ranch") {
        const current = prev[category];
        return {
          ...prev,
          [category]:
            current?.id === food.id
              ? null
              : { ...food, servings: food.servings || 1 },
        };
      } else {
        const current = prev[category] as Food[];
        const isSelected = current.some((f) => f.id === food.id);
        return {
          ...prev,
          [category]: isSelected
            ? current.filter((f) => f.id !== food.id)
            : [...current, { ...food, servings: food.servings || 1 }],
        };
      }
    });
  };

  const handleServingClick = (category: CategoryType, food: Food) => {
    setServingSelectorContext((prev) => {
      // If the serving selector is already open for this food, close it
      if (prev?.food.id === food.id) {
        return null;
      }

      // Get the current food with its updated servings from the selections
      const currentFood = ARRAY_CATEGORIES.includes(category)
        ? (selections[category] as Food[])?.find((f) => f.id === food.id)
        : (selections[category] as Food | null);

      // If we found the food in selections, use its servings, otherwise use the default food's servings
      const currentServings = currentFood?.servings || food.servings || 1;

      return {
        category,
        food: {
          ...food,
          servings: currentServings, // Make sure the food object has the current servings
        },
        currentServings,
      };
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

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    // Clear name-related error when valid input is entered
    if (newName.trim() && error === "Please enter a meal name") {
      setError(null);
    }
  };

  const handleServingsChange = (
    category: CategoryType,
    adjustedFood: Food,
    newServings: number,
  ) => {
    const updatedFood = {
      ...adjustedFood,
      servings: newServings,
      adjustedCalories: Math.round(adjustedFood.calories * newServings),
      adjustedProtein: adjustedFood.protein * newServings,
      adjustedCarbs: adjustedFood.carbs * newServings,
      adjustedFat: adjustedFood.fat * newServings,
    };

    setSelections((prev) => {
      if (ARRAY_CATEGORIES.includes(category)) {
        const current = (prev[category] as Food[]) || [];
        return {
          ...prev,
          [category]: current.map((f) =>
            f.id === adjustedFood.id ? updatedFood : f,
          ),
        };
      } else {
        return {
          ...prev,
          [category]: updatedFood,
        };
      }
    });
  };

  const handleSave = async () => {
    setError(null);
    if (!name.trim()) {
      setError("Please enter a meal name");
      return;
    }

    try {
      switch (creationMethod) {
        case "select": {
          const hasSelections = Object.values(selections).some(
            (s) => s !== null && (!Array.isArray(s) || s.length > 0),
          );
          if (!hasSelections) {
            setError("Please select at least one food item");
            return;
          }
          setLoading(true);
          await onSave(name, selections);
          onClose();
          break;
        }
        case "describe": {
          if (!description.trim()) {
            setError("Please enter a meal description");
            return;
          }
          await handleDescriptionAnalysis();
          // FoodEditor review handles closing
          break;
        }
        case "recipe": {
          if (!recipe.trim()) {
            setError("Please enter a recipe");
            return;
          }
          await handleRecipeAnalysis();
          // FoodEditor review handles closing
          break;
        }
        case "scan": {
          if (ingredients.length === 0) {
            setError("Please add at least one ingredient");
            return;
          }
          setError("Scan mode save is not yet implemented");
          break;
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save meal");
    } finally {
      setLoading(false);
    }
  };

  const inferServingSizeUnit = (desc?: string): ServingSizeUnit => {
    if (!desc) return "piece";
    const lower = desc.toLowerCase();
    if (lower.includes("cup")) return "cup";
    if (lower.includes("tbsp") || lower.includes("tablespoon")) return "tbsp";
    if (lower.includes("tsp") || lower.includes("teaspoon")) return "tsp";
    if (lower.includes(" oz") || lower.includes("ounce")) return "oz";
    if (lower.includes(" g") || lower.includes("gram")) return "g";
    if (lower.includes("ml") || lower.includes("milliliter")) return "ml";
    return "piece";
  };

  const analyzeFoodText = async (
    text: string,
    promptPrefix: string,
    isRecipe = false,
  ): Promise<Partial<Food>> => {
    const prompt = `${promptPrefix}

If the recipe specifies a yield (e.g., "makes 21 pieces"), return nutrition PER SINGLE SERVING/PIECE, not for the entire batch.

Return ONLY a JSON object with these exact keys:
{
  "name": string,
  "calories": number,
  "protein": number (grams),
  "carbs": number (grams),
  "fat": number (grams),
  "sodium": number (milligrams, 0 if unknown),
  "sugar": number (grams, 0 if unknown),
  "saturatedFat": number (grams, 0 if unknown),
  "fiber": number (grams, 0 if unknown),
  "servingsPerRecipe": number,
  "servingDescription": string (e.g. "1 muffin", "1 cup", "2 tbsp"),
  "estimatedServingWeightGrams": number (approximate gram weight of one serving),
  "suggestedCategory": "proteins" | "grains" | "fruits" | "vegetables" | "other",
  "ingredients": string (comma-separated ingredient list)
}
All nutrition values should be per single serving.

Input: ${text}`;

    const response = await fetch("/api/analyze-food", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      if (response.status === 429 || errorData?.error === "quota_exceeded") {
        throw new Error(
          "AI quota exceeded — please wait a minute and try again, or add this food manually.",
        );
      }
      throw new Error(errorData?.error ?? "Analysis failed");
    }
    const data = await response.json();

    if (!data.calories && data.calories !== 0) {
      throw new Error(
        "Could not parse nutritional information from AI response",
      );
    }

    const gramsEquivalent: number = data.estimatedServingWeightGrams ?? 100;
    const factor = gramsEquivalent > 0 ? 100 / gramsEquivalent : 1;
    const baseNutritionPer100g = {
      calories: Math.round((data.calories ?? 0) * factor),
      protein: Math.round((data.protein ?? 0) * factor),
      carbs: Math.round((data.carbs ?? 0) * factor),
      fat: Math.round((data.fat ?? 0) * factor),
      sodium: Math.round((data.sodium ?? 0) * factor),
      sugar: Math.round((data.sugar ?? 0) * factor),
      saturatedFat: Math.round((data.saturatedFat ?? 0) * factor),
      fiber: Math.round((data.fiber ?? 0) * factor),
    };
    const unit = inferServingSizeUnit(data.servingDescription);

    return {
      name: data.name || name || "Analyzed Recipe",
      category: data.suggestedCategory || "other",
      meal: ["breakfast", "lunch", "dinner", "midmorning_snack", "afternoon_snack", "bedtime_snack"],
      servings: 1,
      servingSize: "1",
      servingSizeUnit: unit,
      baseNutritionPer100g,
      servingSizes: [{
        id: "default",
        label: data.servingDescription || "1 serving",
        amount: 1,
        unit,
        gramsEquivalent,
      }],
      calories: Math.round(data.calories ?? 0),
      protein: Math.round(data.protein ?? 0),
      carbs: Math.round(data.carbs ?? 0),
      fat: Math.round(data.fat ?? 0),
      sodium: Math.round(data.sodium ?? 0),
      sugar: Math.round(data.sugar ?? 0),
      saturatedFat: Math.round(data.saturatedFat ?? 0),
      fiber: Math.round(data.fiber ?? 0),
      ingredients: data.ingredients || "",
      ingredientText: data.ingredients
        ? data.ingredients.split(",").map((s: string) => s.trim()).filter(Boolean)
        : [],
      ...(isRecipe && {
        recipeText: text,
        recipeYield: data.servingsPerRecipe ?? undefined,
        isRecipe: true,
      }),
    };
  };

  const handleDescriptionAnalysis = async () => {
    try {
      setLoading(true);
      const food = await analyzeFoodText(
        description,
        "Analyze this meal description and estimate nutritional information per serving.",
      );
      setPendingAnalyzedFood(food);
      setShowFoodReview(true);
      setError(null);
    } catch (error) {
      console.error("Error analyzing description:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to analyze meal description",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRecipeAnalysis = async () => {
    try {
      setLoading(true);
      const food = await analyzeFoodText(
        recipe,
        "Parse this recipe and calculate nutritional information per serving.",
        true,
      );
      setPendingAnalyzedFood(food);
      setShowFoodReview(true);
      setError(null);
    } catch (error) {
      console.error("Error analyzing recipe:", error);
      setError(
        error instanceof Error ? error.message : "Failed to analyze recipe",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReviewedFoodSave = async (food: Food) => {
    try {
      setLoading(true);
      const response = await fetch("/api/foods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(food),
      });
      if (!response.ok) throw new Error("Failed to save food");
      const result = await response.json();
      const persistedFood: Food = { ...food, id: result.insertedId };
      setShowFoodReview(false);
      setPendingAnalyzedFood(null);
      setPostSaveFood(persistedFood);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save food");
    } finally {
      setLoading(false);
    }
  };

  const handlePostSaveEdit = async (food: Food) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/foods/${food.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(food),
      });
      if (!response.ok) throw new Error("Failed to update food");
      setPostSaveFood(food);
      setShowFoodReview(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update food");
      setShowFoodReview(false);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDone = async () => {
    if (!postSaveFood) return;
    try {
      setLoading(true);
      const category = postSaveFood.category || "other";
      const updated = { ...selections };
      if (category === "milk" || category === "ranch") {
        (updated as Record<string, unknown>)[category] = postSaveFood;
      } else {
        const arr = (Array.isArray(updated[category as CategoryType])
          ? updated[category as CategoryType]
          : []) as Food[];
        (updated as Record<string, unknown>)[category] = [...arr, postSaveFood];
      }
      await onSave(name, updated as MealSelection);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save meal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open && !loading) {
            if (postSaveFood) {
              void handleConfirmDone();
            } else {
              onClose();
            }
          }
        }}
      >
        <DialogContent
          className="max-w-3xl max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <DialogHeader>
            <DialogTitle>
              {postSaveFood
                ? "Food Saved"
                : initialSelections
                  ? "Edit Meal"
                  : "Create New Meal"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 min-h-0">
            {!postSaveFood && (
              <div className="space-y-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="meal-name">Meal Name</Label>
                  <Input
                    id="meal-name"
                    value={name}
                    onChange={handleNameChange}
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
            )}

            {postSaveFood ? (
              <div className="flex-1 flex flex-col gap-4 py-2">
                <div className="flex items-center gap-2">
                  <div>
                    <p className="font-semibold text-base">{postSaveFood.name}</p>
                    <span className="text-sm font-medium capitalize bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                      {`${CATEGORY_EMOJIS[postSaveFood.category as keyof typeof CATEGORY_EMOJIS] ?? "🍽️"} ${postSaveFood.category}`}
                    </span>
                  </div>
                </div>

                <div className="flex gap-4 text-sm">
                  <span><strong>{postSaveFood.calories}</strong> cal</span>
                  <span><strong>{postSaveFood.protein}g</strong> protein</span>
                  <span><strong>{postSaveFood.carbs}g</strong> carbs</span>
                  <span><strong>{postSaveFood.fat}g</strong> fat</span>
                </div>

                {postSaveFood.servingSizes?.[0]?.label && (
                  <p className="text-xs text-gray-500">
                    Per serving: {postSaveFood.servingSizes[0].label}
                  </p>
                )}

                {postSaveFood.meal && postSaveFood.meal.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {postSaveFood.meal.map((m) => (
                      <Badge key={m} variant="outline" className="text-xs capitalize">
                        {m.replace(/_/g, " ")}
                      </Badge>
                    ))}
                  </div>
                )}

                {error && <div className="text-sm text-red-500">{error}</div>}
              </div>
            ) : (
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
                                    category === "condiments" ||
                                    (category !== "milk" && category !== "ranch")
                                      ? (
                                          selections[
                                            category as CategoryType
                                          ] as Food[]
                                        ).some((f) => f.id === food.id)
                                      : (
                                          selections[
                                            category as CategoryType
                                          ] as Food | null
                                        )?.id === food.id;

                                  const selectedFood =
                                    category === "milk" || category === "ranch"
                                      ? (selections[
                                          category as CategoryType
                                        ] as Food | null)
                                      : ((
                                          selections[
                                            category as CategoryType
                                          ] as Food[]
                                        )?.find((f) => f.id === food.id) ?? null);

                                  return (
                                    <div key={food.id || index}>
                                      <FoodItem
                                        key={food.id || index}
                                        food={food}
                                        category={category as CategoryType}
                                        index={index}
                                        isSelected={!!isSelected}
                                        selectedFoodInCategory={
                                          selectedFood || null
                                        }
                                        onSelect={() =>
                                          handleFoodSelect(
                                            category as CategoryType,
                                            food,
                                          )
                                        }
                                        onServingClick={() =>
                                          handleServingClick(
                                            category as CategoryType,
                                            food,
                                          )
                                        }
                                        showVisibilityControls={false}
                                        isChildView={false}
                                        onToggleVisibility={() => {}}
                                        isHidden={false}
                                        mealType={mealType || "breakfast"}
                                      />
                                      {servingSelectorContext?.food.id ===
                                        food.id && (
                                        <div className="mt-2 p-4 bg-white border rounded-lg shadow-lg">
                                          <ServingSelector
                                            food={servingSelectorContext.food}
                                            currentServings={
                                              servingSelectorContext.currentServings
                                            }
                                            onConfirm={(adjustedFood) => {
                                              handleServingsChange(
                                                servingSelectorContext.category,
                                                adjustedFood,
                                                adjustedFood.servings,
                                              );
                                            }}
                                            onCancel={() =>
                                              setServingSelectorContext(null)
                                            }
                                            compact={true}
                                          />
                                        </div>
                                      )}
                                    </div>
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
                    <Button
                      onClick={handleDescriptionAnalysis}
                      disabled={!description.trim() || loading}
                    >
                      {loading ? "Analyzing..." : "Analyze Description"}
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="recipe">
                  <div className="space-y-4">
                    <Label htmlFor="recipe">Enter Recipe</Label>
                    <Textarea
                      id="recipe"
                      placeholder="Enter ingredients and instructions..."
                      value={recipe}
                      onChange={(e) => {
                        setRecipe(e.target.value);
                        setPendingAnalyzedFood(null);
                      }}
                      className="h-[200px]"
                    />
                    <Button
                      onClick={handleRecipeAnalysis}
                      disabled={!recipe.trim() || loading}
                    >
                      {loading ? "Analyzing..." : "Analyze Recipe"}
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="scan">
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <FoodSearch
                          onFoodFound={(food) => {
                            setIngredients([
                              ...ingredients,
                              {
                                name: food.name,
                                amount: 1,
                                unit: food.servingSizeUnit,
                                foodId: food.id,
                                upc: food.upc,
                              },
                            ]);
                          }}
                          onError={(error: string | Error) => {
                            console.error("Food search error:", error);
                            setError(
                              typeof error === "string" ? error : error.message,
                            );
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
            )}
          </div>

          <DialogFooter className="mt-4">
            {postSaveFood ? (
              <>
                <Button variant="outline" onClick={() => setShowFoodReview(true)} disabled={loading}>
                  Edit
                </Button>
                <Button onClick={handleConfirmDone} disabled={loading}>
                  {loading ? "Saving..." : "Done"}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={onClose} disabled={loading}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={loading}>
                  {loading ? "Saving..." : "Save Meal"}
                </Button>
              </>
            )}
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

      {showFoodReview && (pendingAnalyzedFood || postSaveFood) && (
        <FoodEditor
          initialFood={postSaveFood ?? pendingAnalyzedFood ?? undefined}
          onSave={postSaveFood ? handlePostSaveEdit : handleReviewedFoodSave}
          onCancel={() => {
            setShowFoodReview(false);
            if (!postSaveFood) setPendingAnalyzedFood(null);
          }}
        />
      )}
    </>
  );
};
