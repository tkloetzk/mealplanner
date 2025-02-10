import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { FoodEditor } from "../FoodEditor/FoodEditor";
import { MealEditor } from "../MealEditor/MealEditor";
import { Food, Recipe } from "@/types/food";

interface AddFoodMenuProps {
  onFoodAdded: (food: Food) => Promise<void>;
}

export function AddFoodMenu({ onFoodAdded }: AddFoodMenuProps) {
  const [showFoodEditor, setShowFoodEditor] = useState(false);
  const [showMealEditor, setShowMealEditor] = useState(false);

  const handleMealCreated = async (recipe: Recipe) => {
    // Convert recipe to Food type
    const food: Partial<Food> = {
      name: recipe.name,
      category: recipe.category,
      meal: recipe.meal,
      servingSize: recipe.servingSize,
      servingSizeUnit: recipe.servingSizeUnit,
      calories: recipe.totalNutrition.calories,
      protein: recipe.totalNutrition.protein,
      carbs: recipe.totalNutrition.carbs,
      fat: recipe.totalNutrition.fat,
      ingredients: recipe.ingredients
        .map((i) => `${i.amount} ${i.unit} ${i.name}`)
        .join(", "),
    };
    await onFoodAdded(food as Food);
    setShowMealEditor(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setShowFoodEditor(true)}>
            Add Single Food
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowMealEditor(true)}>
            Create Meal
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {showFoodEditor && (
        <FoodEditor
          onSave={async (food) => {
            await onFoodAdded(food);
            setShowFoodEditor(false);
          }}
          onCancel={() => setShowFoodEditor(false)}
        />
      )}

      {showMealEditor && (
        <MealEditor
          onSave={handleMealCreated}
          onCancel={() => setShowMealEditor(false)}
        />
      )}
    </>
  );
}
