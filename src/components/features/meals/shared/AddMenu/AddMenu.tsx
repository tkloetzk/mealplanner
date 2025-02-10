import React, { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Apple, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AddMenuProps {
  onAddFood: () => void;
  onAddMeal: () => void;
  className?: string;
}

export const AddMenu = ({
  onAddFood,
  onAddMeal,
  className = "",
}: AddMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleAddFood = () => {
    setIsOpen(false);
    onAddFood();
  };

  const handleAddMeal = () => {
    setIsOpen(false);
    onAddMeal();
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          data-testid="fab-btn"
          className={`rounded-full shadow-lg hover:shadow-xl transition-all ${className}`}
        >
          <Plus className="h-6 w-6" />
          <span className="sr-only">Add menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={handleAddFood}
          className="cursor-pointer"
          data-testid="add-food-option"
        >
          <Apple className="mr-2 h-4 w-4" />
          <span>Add Food</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleAddMeal}
          className="cursor-pointer"
          data-testid="add-meal-option"
        >
          <UtensilsCrossed className="mr-2 h-4 w-4" />
          <span>Add Meal</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
