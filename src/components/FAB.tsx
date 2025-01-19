// components/FAB.tsx
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface FABProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  label?: string;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  showLabel?: boolean;
}

const positionClasses = {
  "bottom-right": "bottom-4 right-4",
  "bottom-left": "bottom-4 left-4",
  "top-right": "top-4 right-4",
  "top-left": "top-4 left-4",
} as const;

export function FAB({
  icon: Icon,
  position = "bottom-right",
  className,
  ...props
}: FABProps) {
  return (
    <button
      className={cn(
        "fixed shadow-lg bg-blue-500 hover:bg-blue-600 text-white",
        "h-12 w-12 rounded-full flex items-center justify-center",
        positionClasses[position],
        "transition-all duration-200 hover:scale-105 hover:shadow-xl",
        "focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2",
        "active:scale-95",
        className
      )}
      type="button"
      data-testid="fab-btn"
      {...props}
    >
      <div className="flex items-center gap-2">
        <Icon className={cn("h-5 w-5")} />
      </div>
    </button>
  );
}
