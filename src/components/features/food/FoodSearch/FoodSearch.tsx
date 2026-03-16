// src/components/features/food/FoodSearch/FoodSearch.tsx
//
// Unified food search with a three-tier cascade:
//   1. Local DB + Open Food Facts (parallel, via /api/foods/search)
//   2. Explicit AI estimate (user clicks a button)
//
// Results are grouped by source and displayed in a listbox.

import React, { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Camera, Sparkles, Search, Database, Globe, Loader2 } from "lucide-react";
import type { Food } from "@/types/food";
import type {
  FoodSearchResult,
  FoodSearchResponse,
} from "@/types/foodSearch";
import { searchResultToPartialFood } from "@/services/food/normalizers";

// ── Props ──────────────────────────────────────────────────────────────

interface FoodSearchProps {
  onFoodFound: (food: Partial<Food>, source?: FoodSearchResult["source"]) => void;
  onError: (error: string) => void;
  onScanRequest?: () => void;
}

// ── Source display config ──────────────────────────────────────────────

const SOURCE_CONFIG = {
  local: { label: "Your Foods", icon: Database, color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  openfoodfacts: { label: "Open Food Facts", icon: Globe, color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  spoonacular: { label: "Product Database", icon: Globe, color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" },
  ai: { label: "AI Estimate", icon: Sparkles, color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
} as const;

// ── Component ──────────────────────────────────────────────────────────

export function FoodSearch({ onFoodFound, onError, onScanRequest }: FoodSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isEstimating, setIsEstimating] = useState(false);
  const [results, setResults] = useState<FoodSearchResult[]>([]);
  const [aiAvailable, setAiAvailable] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // ── Search handler ───────────────────────────────────────────────

  const handleSearch = useCallback(async () => {
    const trimmed = searchTerm.trim();
    if (!trimmed) return;

    setIsSearching(true);
    setResults([]);
    setShowResults(false);
    setSelectedIndex(-1);

    try {
      // Check if input looks like a UPC barcode (all digits, 8-14 chars)
      const isUPC = /^\d{8,14}$/.test(trimmed);

      if (isUPC) {
        const response = await fetch(`/api/foods/search?id=${trimmed}`);
        if (response.ok) {
          const result: FoodSearchResult = await response.json();
          onFoodFound(searchResultToPartialFood(result), result.source);
          return;
        }
        // If UPC lookup fails, fall through to text search
      }

      // Text search — hits local DB + Open Food Facts in parallel
      const response = await fetch(
        `/api/foods/search?query=${encodeURIComponent(trimmed)}`
      );

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data: FoodSearchResponse = await response.json();
      setResults(data.results);
      setAiAvailable(data.aiAvailable);
      setShowResults(true);

      // If no results at all, auto-trigger AI estimate if available
      if (data.results.length === 0 && data.aiAvailable) {
        await handleAIEstimate(trimmed);
      }
    } catch (error) {
      console.error("Search error:", error);
      onError("Search failed. Please try again.");
    } finally {
      setIsSearching(false);
    }
  }, [searchTerm, onFoodFound, onError]);

  // ── AI estimate handler ──────────────────────────────────────────

  const handleAIEstimate = useCallback(
    async (foodName?: string) => {
      const name = foodName ?? searchTerm.trim();
      if (!name) return;

      setIsEstimating(true);
      try {
        const response = await fetch("/api/foods/estimate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });

        if (response.status === 429) {
          onFoodFound(
            {
              name,
              calories: 0,
              protein: 0,
              carbs: 0,
              fat: 0,
              servingSize: "1",
              servingSizeUnit: "piece",
              category: "other",
              meal: ["breakfast", "lunch", "dinner"],
            },
            "ai"
          );
          onError(
            "AI estimation quota exceeded. Please fill in nutrition values manually."
          );
          return;
        }

        if (!response.ok) {
          throw new Error("AI estimation failed");
        }

        const result: FoodSearchResult = await response.json();
        const food = searchResultToPartialFood(result);
        onFoodFound(food, "ai");
        setShowResults(false);
      } catch (error) {
        console.error("AI estimate error:", error);
        onError("Could not estimate nutrition. Please enter values manually.");
      } finally {
        setIsEstimating(false);
      }
    },
    [searchTerm, onFoodFound, onError]
  );

  // ── Select a result ──────────────────────────────────────────────

  const handleSelectResult = useCallback(
    async (result: FoodSearchResult) => {
      setIsSearching(true);
      try {
        if (result.nutrition) {
          // Result already has full nutrition — use directly
          const food = searchResultToPartialFood(result);
          onFoodFound(food, result.source);
        } else {
          // Need to fetch details (e.g. OFF product by barcode, or Spoonacular)
          const response = await fetch(
            `/api/foods/search?id=${encodeURIComponent(result.id)}`
          );
          if (!response.ok) throw new Error("Failed to get product details");
          const detail: FoodSearchResult = await response.json();
          const food = searchResultToPartialFood(detail);
          onFoodFound(food, detail.source);
        }
        setShowResults(false);
      } catch (error) {
        console.error("Select error:", error);
        onError("Failed to load product details");
      } finally {
        setIsSearching(false);
      }
    },
    [onFoodFound, onError]
  );

  // ── Keyboard navigation ──────────────────────────────────────────

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showResults || results.length === 0) {
        if (e.key === "Enter") {
          e.preventDefault();
          handleSearch();
        }
        return;
      }

      const totalItems = results.length + (aiAvailable ? 1 : 0);

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, totalItems - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, -1));
          break;
        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < results.length) {
            handleSelectResult(results[selectedIndex]);
          } else if (selectedIndex === results.length && aiAvailable) {
            handleAIEstimate();
          } else {
            handleSearch();
          }
          break;
        case "Escape":
          setShowResults(false);
          setSelectedIndex(-1);
          inputRef.current?.focus();
          break;
      }
    },
    [showResults, results, aiAvailable, selectedIndex, handleSearch, handleSelectResult, handleAIEstimate]
  );

  // ── Group results by source ──────────────────────────────────────

  const groupedResults = groupBySource(results);

  // ── Render ───────────────────────────────────────────────────────

  const isLoading = isSearching || isEstimating;

  return (
    <div className="relative flex flex-col gap-2" onKeyDown={handleKeyDown}>
      {/* Search input row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search foods or enter UPC..."
            disabled={isLoading}
            aria-label="Search for food"
            aria-expanded={showResults}
            aria-controls="food-search-results"
            aria-activedescendant={
              selectedIndex >= 0 ? `food-result-${selectedIndex}` : undefined
            }
            role="combobox"
            aria-autocomplete="list"
            autoComplete="off"
          />
        </div>
        <Button
          onClick={handleSearch}
          disabled={isLoading || !searchTerm.trim()}
          aria-label="Search"
        >
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          <span className="ml-1.5 hidden sm:inline">
            {isSearching ? "Searching..." : "Search"}
          </span>
        </Button>
        {onScanRequest && (
          <Button
            variant="outline"
            onClick={onScanRequest}
            disabled={isLoading}
            aria-label="Scan barcode"
          >
            <Camera className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Results dropdown */}
      {showResults && (results.length > 0 || aiAvailable) && (
        <ul
          id="food-search-results"
          ref={listRef}
          role="listbox"
          aria-label="Search results"
          className="absolute top-full left-0 right-0 z-50 mt-1 max-h-80 overflow-y-auto rounded-md border bg-popover shadow-lg"
        >
          {groupedResults.map(([source, items]) => {
            const config = SOURCE_CONFIG[source];
            const Icon = config.icon;

            return (
              <li key={source} role="presentation">
                {/* Source group header */}
                <div className="sticky top-0 z-10 flex items-center gap-2 bg-muted/80 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-muted-foreground">
                  <Icon className="h-3 w-3" />
                  {config.label}
                  <span className="ml-auto">{items.length}</span>
                </div>

                {/* Results within this source */}
                <ul role="group" aria-label={config.label}>
                  {items.map((result) => {
                    const flatIndex = results.indexOf(result);
                    const isSelected = flatIndex === selectedIndex;

                    return (
                      <li
                        key={result.id}
                        id={`food-result-${flatIndex}`}
                        role="option"
                        aria-selected={isSelected}
                        className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-accent text-accent-foreground"
                            : "hover:bg-accent/50"
                        }`}
                        onClick={() => handleSelectResult(result)}
                        onMouseEnter={() => setSelectedIndex(flatIndex)}
                      >
                        {/* Thumbnail */}
                        {result.image ? (
                          <img
                            src={result.image}
                            alt=""
                            className="h-8 w-8 rounded object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded bg-muted flex-shrink-0" />
                        )}

                        {/* Name + nutrition preview */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {result.name}
                          </p>
                          {result.nutrition && (
                            <p className="text-xs text-muted-foreground">
                              {result.nutrition.calories} cal
                              {result.nutrition.protein != null &&
                                ` · ${result.nutrition.protein}g protein`}
                            </p>
                          )}
                        </div>

                        {/* Source badge */}
                        <Badge
                          variant="secondary"
                          className={`text-[10px] flex-shrink-0 ${config.color}`}
                        >
                          {source === "local" ? "Saved" : source === "openfoodfacts" ? "OFF" : source}
                        </Badge>
                      </li>
                    );
                  })}
                </ul>
              </li>
            );
          })}

          {/* AI Estimate option — always at the bottom */}
          {aiAvailable && (
            <li
              id={`food-result-${results.length}`}
              role="option"
              aria-selected={selectedIndex === results.length}
              className={`flex items-center gap-3 px-3 py-3 cursor-pointer border-t transition-colors ${
                selectedIndex === results.length
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/50"
              }`}
              onClick={() => handleAIEstimate()}
              onMouseEnter={() => setSelectedIndex(results.length)}
            >
              {isEstimating ? (
                <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
              ) : (
                <Sparkles className="h-4 w-4 text-purple-600" />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {isEstimating
                    ? "Estimating nutrition..."
                    : `Get AI estimate for "${searchTerm.trim()}"`}
                </p>
                <p className="text-xs text-muted-foreground">
                  Uses AI to estimate nutritional values
                </p>
              </div>
              <Badge
                variant="secondary"
                className={SOURCE_CONFIG.ai.color}
              >
                AI
              </Badge>
            </li>
          )}

          {/* Empty state (no results, no AI) */}
          {results.length === 0 && !aiAvailable && (
            <li className="px-3 py-4 text-center text-sm text-muted-foreground">
              No results found for &ldquo;{searchTerm}&rdquo;
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────

function groupBySource(
  results: FoodSearchResult[]
): [FoodSearchResult["source"], FoodSearchResult[]][] {
  const order: FoodSearchResult["source"][] = [
    "local",
    "openfoodfacts",
    "spoonacular",
    "ai",
  ];
  const groups = new Map<FoodSearchResult["source"], FoodSearchResult[]>();

  for (const result of results) {
    const existing = groups.get(result.source);
    if (existing) {
      existing.push(result);
    } else {
      groups.set(result.source, [result]);
    }
  }

  // Return in display order, omitting empty groups
  return order
    .filter((source) => groups.has(source))
    .map((source) => [source, groups.get(source)!]);
}
