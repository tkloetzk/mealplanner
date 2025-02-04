import React from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { X } from "lucide-react";

interface AnalysisDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

const AnalysisDialog: React.FC<AnalysisDialogProps> = ({
  isOpen,
  onOpenChange,
  children,
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-xl">
        <div className="flex justify-between items-start mb-4">
          <AlertDialogHeader>
            <AlertDialogTitle>Plate Photo Analysis</AlertDialogTitle>
          </AlertDialogHeader>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full h-8 w-8 p-0"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>
        {children}
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default AnalysisDialog;
