import React from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sliders } from "lucide-react";
import { ServingSizeUnit } from "@/types/food";

interface ServingAdjusterProps {
  servings: number;
  servingSize: string;
  servingSizeUnit: ServingSizeUnit;
  onServingsChange: (servings: number) => void;
}

export const ServingAdjuster = ({
  servings,
  servingSize,
  servingSizeUnit,
  onServingsChange,
}: ServingAdjusterProps) => {
  const [localServings, setLocalServings] = React.useState(servings.toString());
  const [open, setOpen] = React.useState(false);

  const handleServingsChange = (value: string) => {
    setLocalServings(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      onServingsChange(numValue);
    }
  };

  const adjustServings = (adjustment: number) => {
    const currentServings = parseFloat(localServings) || servings;
    const newServings = Math.max(0.25, currentServings + adjustment);
    handleServingsChange(newServings.toString());
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          className="p-2 rounded-full hover:bg-blue-200 transition-colors cursor-pointer"
          title="Adjust Servings"
        >
          <Sliders className="h-4 w-4 text-blue-600" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Adjust Servings</h4>
            <p className="text-sm text-muted-foreground">
              Base serving: {servingSize} {servingSizeUnit}
            </p>
          </div>
          <div className="grid gap-2">
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="servings">Servings</Label>
              <div className="col-span-2 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => adjustServings(-0.25)}
                >
                  -
                </Button>
                <Input
                  id="servings"
                  type="number"
                  step="0.25"
                  min="0.25"
                  value={localServings}
                  onChange={(e) => handleServingsChange(e.target.value)}
                  className="h-8"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => adjustServings(0.25)}
                >
                  +
                </Button>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button variant="default" size="sm" onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
