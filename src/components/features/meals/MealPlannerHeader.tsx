// components/features/meals/MealPlannerHeader.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
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
        <div className="flex items-center gap-3">
          {!isChildView && (
            <Button asChild variant="outline" size="sm">
              <Link href="/settings">Settings</Link>
            </Button>
          )}
          <ViewToggle isChildView={isChildView} onToggle={onViewToggle} />
        </div>
      </div>

      <KidSelector
        kids={kids}
        selectedKid={selectedKid}
        onSelect={onKidSelect}
      />
    </>
  );
}
