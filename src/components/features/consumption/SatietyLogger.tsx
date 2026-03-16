import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SatietyEntry, SatietyRating } from "@/types/shared";
import { computeSatietyDuration, formatDuration } from "@/types/shared";

interface SatietyLoggerProps {
  /** ISO datetime of when the meal was eaten */
  mealTime: string | undefined;
  /** Existing satiety log to pre-populate (for edits) */
  existingLog?: SatietyEntry;
  /** Called whenever the satiety data changes */
  onUpdate: (entry: SatietyEntry) => void;
}

const RATING_OPTIONS: ReadonlyArray<{ value: SatietyRating; label: string; emoji: string }> = [
  { value: 1, label: "Hungry fast", emoji: "😟" },
  { value: 2, label: "Moderate", emoji: "😐" },
  { value: 3, label: "Stayed full", emoji: "😊" },
] as const;

export function SatietyLogger({ mealTime, existingLog, onUpdate }: SatietyLoggerProps) {
  const [rating, setRating] = React.useState<SatietyRating | undefined>(
    existingLog?.satietyRating,
  );
  const [hungryAgainAt, setHungryAgainAt] = React.useState<string | undefined>(
    existingLog?.hungryAgainAt,
  );
  const [notes, setNotes] = React.useState<string>(existingLog?.notes ?? "");

  // Emit the full SatietyEntry whenever any field changes
  const emitUpdate = React.useCallback(
    (patch: Partial<SatietyEntry>) => {
      const next: SatietyEntry = {
        hungryAgainAt: patch.hungryAgainAt ?? hungryAgainAt,
        satietyRating: patch.satietyRating ?? rating,
        notes: (patch.notes ?? notes) || undefined,
      };
      onUpdate(next);
    },
    [hungryAgainAt, rating, notes, onUpdate],
  );

  const handleRatingSelect = (value: SatietyRating) => {
    setRating(value);
    emitUpdate({ satietyRating: value });
  };

  const handleHungryNow = () => {
    const now = new Date().toISOString();
    setHungryAgainAt(now);
    emitUpdate({ hungryAgainAt: now });
  };

  const handleNotesBlur = () => {
    emitUpdate({ notes });
  };

  const durationMinutes = computeSatietyDuration(mealTime, hungryAgainAt);
  const durationText = formatDuration(durationMinutes);

  const mealTimeDisplay = mealTime
    ? new Date(mealTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : null;

  const hungryTimeDisplay = hungryAgainAt
    ? new Date(hungryAgainAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : null;

  return (
    <div className="space-y-3 p-3 bg-amber-50 rounded-lg" role="region" aria-label="Fullness tracking">
      <Label className="text-xs font-semibold text-amber-800">Fullness Tracking</Label>

      {/* Quick rating buttons */}
      <div className="flex gap-2 flex-wrap">
        {RATING_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            variant={rating === opt.value ? "default" : "outline"}
            size="sm"
            onClick={() => handleRatingSelect(opt.value)}
            aria-pressed={rating === opt.value}
            className="text-xs"
          >
            {opt.emoji} {opt.label}
          </Button>
        ))}
      </div>

      {/* "Hungry now" button */}
      {!hungryAgainAt && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleHungryNow}
          className="w-full text-xs border-amber-300 text-amber-700 hover:bg-amber-100"
        >
          🔔 Hungry Again Now
        </Button>
      )}

      {/* Duration display */}
      {hungryAgainAt && (
        <div className="text-xs text-amber-800 space-y-1">
          {mealTimeDisplay && hungryTimeDisplay && (
            <div>
              Ate at {mealTimeDisplay} → Hungry at {hungryTimeDisplay}
            </div>
          )}
          {durationText && (
            <div className="font-medium" data-testid="satiety-duration">
              ⏱️ Lasted {durationText}
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      <div className="space-y-1">
        <Label htmlFor="satiety-notes" className="text-xs text-amber-700">
          Fullness Notes
        </Label>
        <Input
          id="satiety-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={handleNotesBlur}
          placeholder="e.g. asked for crackers 45 min later"
          className="text-xs h-8"
        />
      </div>
    </div>
  );
}
