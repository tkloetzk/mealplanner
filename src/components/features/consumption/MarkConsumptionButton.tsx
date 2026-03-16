import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConsumptionStatusSelector } from "./ConsumptionStatusSelector";
import { ConsumptionInfo } from "@/types/shared";
import type { MealSelection } from "@/types/meals";

interface MarkConsumptionButtonProps {
  initialStatus?: ConsumptionInfo;
  mealId?: string;
  /** The calendar date of this meal — forwarded to ConsumptionStatusSelector for time combination */
  mealDate?: string | Date;
  mealSelections?: MealSelection; // The original foods that were offered in the meal
  onSave: (status: ConsumptionInfo) => void;
  children?: React.ReactNode;
}

export function MarkConsumptionButton({
  initialStatus,
  mealDate,
  mealSelections,
  onSave,
  children = "Mark Consumption",
}: MarkConsumptionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSave = (status: ConsumptionInfo) => {
    onSave(status);
    setIsOpen(false);
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} variant="outline" size="sm">
        {children}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mark Consumption Status</DialogTitle>
          </DialogHeader>
          <ConsumptionStatusSelector
            initialStatus={initialStatus}
            mealDate={mealDate}
            mealSelections={mealSelections}
            onSave={handleSave}
            onCancel={() => setIsOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
