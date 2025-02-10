import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Recipe, RecipeIngredient } from "@/types/food";
import { FoodSearch } from "../FoodSearch/FoodSearch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MealEditorProps {
  onSave: (recipe: Recipe) => Promise<void>;
  onCancel: () => void;
}

export function MealEditor({ onSave, onCancel }: MealEditorProps) {
  const [activeTab, setActiveTab] = useState("description");
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
  const [recipe, setRecipe] = useState<string>("");

  const handleDescriptionAnalysis = async () => {
    try {
      const response = await fetch("/api/analyze-meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Analyze this meal description and provide nutritional information: ${description}`,
        }),
      });

      if (!response.ok) throw new Error("Analysis failed");
      const data = await response.json();
      // Handle the analyzed data
    } catch (error) {
      console.error("Error analyzing description:", error);
    }
  };

  const handleRecipeAnalysis = async () => {
    try {
      const response = await fetch("/api/analyze-meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Parse this recipe and calculate nutritional information per serving: ${recipe}`,
        }),
      });

      if (!response.ok) throw new Error("Analysis failed");
      const data = await response.json();
      // Handle the analyzed recipe data
    } catch (error) {
      console.error("Error analyzing recipe:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl p-6">
        <h2 className="text-2xl font-bold mb-4">Create New Meal</h2>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="recipe">Recipe</TabsTrigger>
            <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
          </TabsList>

          <TabsContent value="description">
            <Textarea
              placeholder="Describe the meal (e.g., 'Deviled Egg')"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mb-4"
            />
            <Button onClick={handleDescriptionAnalysis}>
              Analyze Description
            </Button>
          </TabsContent>

          <TabsContent value="recipe">
            <Textarea
              placeholder="Enter the complete recipe with ingredients and instructions"
              value={recipe}
              onChange={(e) => setRecipe(e.target.value)}
              className="mb-4"
            />
            <Button onClick={handleRecipeAnalysis}>Analyze Recipe</Button>
          </TabsContent>

          <TabsContent value="ingredients">
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
              onError={(error) => console.error(error)}
            />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={() => {}}>Save Meal</Button>
        </div>
      </div>
    </div>
  );
}
