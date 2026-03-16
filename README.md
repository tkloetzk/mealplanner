# Food Search Refactor — Integration Guide

## File Structure

```
src/
├── types/
│   └── foodSearch.ts              # NEW: FoodSearchResult, FoodSource, response types
├── services/
│   └── food/
│       ├── normalizers.ts         # NEW: normalizeLocalFood, normalizeOFFProduct, normalizeAIEstimate, etc.
│       └── __tests__/
│           └── normalizers.test.ts
├── app/api/foods/
│   ├── search/
│   │   └── route.ts              # REPLACES: existing search route (local DB + OFF text search)
│   └── estimate/
│       ├── route.ts              # NEW: Gemini AI nutrition estimation
│       └── __tests__/
│           └── route.test.ts
└── components/features/food/
    └── FoodSearch/
        ├── FoodSearch.tsx         # REPLACES: existing FoodSearch component
        └── __tests__/
            └── FoodSearch.test.tsx
```

## What Changed and Why

### 1. `src/types/foodSearch.ts`
New shared types that all sources normalize into. The key type is `FoodSearchResult` —
every search result from any source (local DB, Open Food Facts, Spoonacular, AI) gets
normalized into this shape before reaching the client.

### 2. `src/services/food/normalizers.ts`
Pure functions that convert each data source's raw response into `FoodSearchResult`.
Also includes `searchResultToPartialFood()` which converts a search result into the
`Partial<Food>` that FoodEditor expects as `initialFood`.

### 3. `src/app/api/foods/search/route.ts`
Refactored to:
- Search local DB first (same as before)
- Search Open Food Facts v1 text search (NEW — replaces Spoonacular as primary public search)
- Spoonacular code is preserved but commented out
- Returns `FoodSearchResponse` with source-tagged results + `aiAvailable` flag

### 4. `src/app/api/foods/estimate/route.ts`
New dedicated endpoint for AI nutrition estimation. Separated from the generic
`/api/analyze-food` route because:
- Tighter, nutrition-specific Gemini prompt
- Proper structured JSON output (responseMimeType: "application/json")
- Model: gemini-3.1-flash-lite-preview
- Returns a normalized `FoodSearchResult` with `confidence: "estimated"`

### 5. `src/components/features/food/FoodSearch/FoodSearch.tsx`
Refactored to:
- Use a proper ARIA combobox/listbox pattern (replaces the DropdownMenu hack)
- Group results by source with labeled sections
- Show nutrition preview inline (calories + protein)
- "Get AI Estimate" button at the bottom of results
- Keyboard navigation (arrow keys, Enter, Escape)
- Auto-triggers AI when no results found and AI is available
- Source badges on each result

## Integration Steps

1. **Drop in the new files** at the paths listed above.

2. **Update FoodEditor** to handle the new `source` parameter from `onFoodFound`:
   ```tsx
   // In FoodEditor or AddFoodMenu, the onFoodFound callback now receives:
   onFoodFound={(food: Partial<Food>, source?: FoodSource) => {
     // `source` tells you where this data came from
     // You can show a badge like "AI Estimate" if source === "ai"
   }}
   ```

3. **The `/api/upc` route stays as-is** — the FoodSearch component still routes UPC
   barcodes (8-14 digit strings) directly to `/api/upc`. No changes needed there.

4. **The existing `/api/analyze-food` route stays as-is** — it's still used by
   `UPCScanner.tsx` and `MealEditor.tsx`. The new `/api/foods/estimate` is a cleaner,
   purpose-built alternative specifically for food search.

5. **Environment variables needed:**
   - `GEMINI_API_KEY` — required for AI estimation (you already have this)
   - `SPOONACULAR_API_KEY` — optional, only if you re-enable Spoonacular later

## Search Cascade Flow

```
User types "chicken breast" → clicks Search
  │
  ▼
GET /api/foods/search?query=chicken+breast
  ├── 1. Local MongoDB: regex search on `name` field
  ├── 2. Open Food Facts: v1 text search (cgi/search.pl)
  │    └── (Spoonacular: commented out, re-enable if needed)
  │
  ▼
Client receives tagged results:
  ┌─────────────────────────────────────────┐
  │ 🏠 Your Foods                           │
  │   Grilled Chicken Breast  [200 cal]     │
  │                                         │
  │ 🌐 Open Food Facts                      │
  │   Tyson Chicken Breast Tenders          │
  │                                         │
  │ ✨ Get AI estimate for "chicken breast" │
  └─────────────────────────────────────────┘
  
User selects a result:
  ├── Has nutrition? → Populate FoodEditor immediately
  └── No nutrition?  → Detail-fetch via /api/foods/search?id=...

User clicks AI estimate:
  └── POST /api/foods/estimate { name: "chicken breast" }
      └── Returns normalized result with confidence: "estimated"
```
