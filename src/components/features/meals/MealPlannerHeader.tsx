// components/features/meals/MealPlannerHeader.tsx
import { KidSelector } from "@/components/common/KidSelector";
import { ViewToggle } from "@/components/common/ViewToggle";
import { Kid } from "@/types/user";

interface MealPlannerHeaderProps {
  kids: Kid[];
  selectedKid: string;
  isChildView: boolean;
  onKidSelect: (kidId: string) => void;
  onViewToggle: (isChild: boolean) => void;
}

export function MealPlannerHeader({
  kids,
  selectedKid,
  isChildView,
  onKidSelect,
  onViewToggle,
}: MealPlannerHeaderProps) {
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Meal Planner</h1>
        <ViewToggle isChildView={isChildView} onToggle={onViewToggle} />
      </div>

      <KidSelector
        kids={kids}
        selectedKid={selectedKid}
        onSelect={onKidSelect}
      />
    </>
  );
}
