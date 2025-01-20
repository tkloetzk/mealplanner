// src/components/ViewToggle.tsx
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface ViewToggleProps {
  isChildView: boolean;
  onToggle: (isChild: boolean) => void;
}

export function ViewToggle({ isChildView, onToggle }: ViewToggleProps) {
  return (
    <div className="flex items-center space-x-2">
      <Switch id="view-mode" checked={isChildView} onCheckedChange={onToggle} />
      <Label htmlFor="view-mode" className="text-sm font-medium">
        {isChildView ? "Kid's View" : "Parent's View"}
      </Label>
    </div>
  );
}
