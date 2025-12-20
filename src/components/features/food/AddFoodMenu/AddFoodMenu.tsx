import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FoodEditor } from "../FoodEditor/FoodEditor";
import { MealEditor } from "@/components/features/meals/MealEditor/MealEditor";
import { Food } from "@/types/food";
import type { MealSelection } from "@/types/meals";
import type { MealType } from "@/types/shared";

interface AddFoodMenuProps {
  onFoodAdded: (food: Food) => Promise<void>;
}

export function AddFoodMenu({ onFoodAdded }: AddFoodMenuProps) {
  const [showFoodEditor, setShowFoodEditor] = useState(false);
  const [showMealEditor, setShowMealEditor] = useState(false);

  const handleMealCreated = async (name: string, selections: MealSelection) => {
    const selectedFoods = Object.values(selections).flatMap((v) =>
      Array.isArray(v) ? v : v ? [v] : []
    );

    const totals = selectedFoods.reduce(
      (acc, f) => {
        const servings = f.servings || 1;
        return {
          calories: acc.calories + (f.calories || 0) * servings,
          protein: acc.protein + (f.protein || 0) * servings,
          carbs: acc.carbs + (f.carbs || 0) * servings,
          fat: acc.fat + (f.fat || 0) * servings,
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    const food: Food = {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name,
      category: "other",
      meal: ["breakfast", "lunch", "dinner", "snack"] as MealType[],
      servings: 1,
      servingSize: "1",
      servingSizeUnit: "piece",
      calories: Math.round(totals.calories),
      protein: Math.round(totals.protein),
      carbs: Math.round(totals.carbs),
      fat: Math.round(totals.fat),
      ingredients: selectedFoods.map((f) => f.name).join(", "),
    };

    await onFoodAdded(food);
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
          isOpen={showMealEditor}
          onClose={() => setShowMealEditor(false)}
          onSave={handleMealCreated}
        />
      )}
    </>
  );
}
