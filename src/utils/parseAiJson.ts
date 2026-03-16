/**
 * Safely parse a JSON string that may be wrapped in markdown code fences.
 * Returns { data, error } — never throws.
 */
export function safeParseAiJson<T = unknown>(
  raw: string
): { data: T; error: null } | { data: null; error: string } {
  // Strip markdown fences: ```json\n...\n``` or ```\n...\n```
  const stripped = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  try {
    const data = JSON.parse(stripped) as T;
    return { data, error: null };
  } catch {
    return {
      data: null,
      error: `AI returned invalid JSON: ${stripped.slice(0, 200)}`,
    };
  }
}

// --- Shape validators ---

export interface FoodImageAnalysis {
  foods: {
    name: string;
    description: string;
    portionSize: string;
    visualCharacteristics: string;
    nutritionalAnalysis: string;
    suggestions: string;
    concerns: string;
  }[];
  summary: string;
}

export function validateFoodImageAnalysis(
  data: unknown
): data is FoodImageAnalysis {
  return (
    typeof data === "object" &&
    data !== null &&
    Array.isArray((data as FoodImageAnalysis).foods) &&
    typeof (data as FoodImageAnalysis).summary === "string"
  );
}

export interface ConsumptionAnalysis {
  foods: { name: string; percentageEaten: number; notes: string }[];
  summary: string;
}

export function validateConsumptionAnalysis(
  data: unknown
): data is ConsumptionAnalysis {
  return (
    typeof data === "object" &&
    data !== null &&
    Array.isArray((data as ConsumptionAnalysis).foods) &&
    typeof (data as ConsumptionAnalysis).summary === "string"
  );
}
