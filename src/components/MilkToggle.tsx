// components/MilkToggle.tsx
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MILK_OPTION } from "@/constants/meal-goals";

interface MilkToggleProps {
  isSelected: boolean;
  onChange: (includesMilk: boolean) => void;
}

export const MilkToggle = ({ isSelected, onChange }: MilkToggleProps) => {
  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
      <div className="flex items-center space-x-2">
        <span className="text-2xl">🥛</span>
        <div>
          <Label className="text-base">Include Milk</Label>
          <p className="text-sm text-gray-600">
            {MILK_OPTION.calories} calories | {MILK_OPTION.protein}g protein
          </p>
        </div>
      </div>
      <Switch checked={isSelected} onCheckedChange={onChange} />
    </div>
  );
};
