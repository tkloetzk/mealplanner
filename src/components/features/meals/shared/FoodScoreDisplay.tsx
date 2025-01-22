import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";

interface FoodScoreAnalysis {
  score: string;
  summary: string;
  positives: string[];
  negatives: string[];
}

export const FoodScoreDisplay: React.FC<{ analysis: FoodScoreAnalysis }> = ({
  analysis,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Simplified grade mapping
  const getLetterGrade = (score: number) => {
    if (score >= 90) return { letterGrade: "A", coloring: "text-green-400" };
    if (score >= 75) return { letterGrade: "B", coloring: "text-green-600" };
    if (score >= 55) return { letterGrade: "C", coloring: "text-yellow-600" };
    if (score >= 40) return { letterGrade: "D", coloring: "text-orange-200" };
    return { letterGrade: "F", coloring: "text-red-600" };
  };

  // Parse numeric score
  const numericScore = parseInt(analysis.score);
  const letterGrade = getLetterGrade(numericScore).letterGrade;
  const coloring = getLetterGrade(numericScore).coloring;

  return (
    <div className="flex items-center justify-end">
      <div className="flex items-center gap-1">
        <span className={`text-xs font-medium ${coloring}`}>
          {letterGrade} ({numericScore}/100)
        </span>

        <Button
          variant="ghost"
          size="icon"
          className="h-4 w-4"
          onClick={() => setIsDialogOpen(true)}
        >
          <Info className="h-3.5 w-3.5 text-gray-500" />
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nutrition Analysis</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="text-sm text-gray-700">{analysis.summary}</div>

            {analysis.positives.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Positives</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  {analysis.positives.map((positive, index) => (
                    <li key={index}>{positive}</li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.negatives.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Negatives</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  {analysis.negatives.map((negative, index) => (
                    <li key={index}>{negative}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
