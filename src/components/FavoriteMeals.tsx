// components/FavoriteMeals.tsx
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Plus } from "lucide-react";
import type { MealSelection, MealType } from "@/types/food";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export interface FavoriteMeal {
  id: string;
  kidId: string;
  name: string;
  mealType: MealType;
  selections: MealSelection;
}

interface FavoriteMealsProps {
  kidId: string;
  currentMeal: MealType | null;
  currentSelections: MealSelection;
  favorites: FavoriteMeal[];
  onSaveFavorite: (
    name: string,
    mealType: MealType,
    selections: MealSelection
  ) => void;
  onSelectFavorite: (selections: MealSelection) => void;
}

export function FavoriteMeals({
  kidId,
  currentMeal,
  currentSelections,
  favorites,
  onSaveFavorite,
  onSelectFavorite,
}: FavoriteMealsProps) {
  const [isNaming, setIsNaming] = useState(false);
  const [newName, setNewName] = useState("");

  const filteredFavorites = favorites.filter(
    (fav) => fav.kidId === kidId && fav.mealType === currentMeal
  );

  const handleSave = () => {
    if (!currentMeal || !newName.trim()) return;
    onSaveFavorite(newName.trim(), currentMeal, currentSelections);
    setNewName("");
    setIsNaming(false);
  };

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Favorite Combinations</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsNaming(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Save Current
        </Button>
      </div>

      {isNaming && (
        <div className="flex gap-2 mb-4">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Name this combination"
            className="flex-1"
          />
          <Button onClick={handleSave}>Save</Button>
          <Button variant="ghost" onClick={() => setIsNaming(false)}>
            Cancel
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {filteredFavorites.map((favorite) => (
          <Card
            key={favorite.id}
            className="cursor-pointer hover:bg-gray-50"
            onClick={() => onSelectFavorite(favorite.selections)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span>{favorite.name}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
