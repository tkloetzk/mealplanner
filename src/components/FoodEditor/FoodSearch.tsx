import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Food } from "@/types/food";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface FoodSearchProps {
  onFoodFound: (food: Food) => void;
  onError: (error: string) => void;
}

interface SearchResult {
  id?: string;
  title: string;
  image?: string;
  isGeneric?: boolean;
}

export function FoodSearch({ onFoodFound, onError }: FoodSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  const handleAnalyzeFood = async (searchText: string): Promise<Food> => {
    try {
      const response = await fetch("/api/analyze-food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Can you give me nutritional information on ${searchText}?
          I need these information: calories, carbs, saturated fat, protein, sugar, sodium, trans fat, fiber, poly unsaturated fat, if there are any additives, serving size, serving size unit,  nova group, nutrient levels, and ecoscoreGrade`,
        }),
      });

      if (!response.ok) throw new Error("Analysis failed");
      const data = await response.json();
      return {
        ...data,
        name: searchText,
      };
    } catch (error) {
      onError("Could not find nutritional information");
      throw error;
    }
  };

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      if (/^\d+$/.test(searchTerm)) {
        // UPC search
        const response = await fetch(`/api/upc?upc=${searchTerm}`);
        if (!response.ok) {
          throw new Error("Product not found");
        }
        const data = await response.json();
        onFoodFound(data);
      } else {
        // Text search
        const response = await fetch(
          `/api/foods/search?query=${encodeURIComponent(searchTerm)}`
        );
        if (!response.ok) {
          throw new Error("Search failed");
        }
        const data = await response.json();
        setSearchResults(data.products || []);
      }
    } catch (error) {
      console.error(error);
      if (searchTerm.length > 0) {
        await handleAnalyzeFood(searchTerm);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectProduct = async (result: SearchResult) => {
    setIsLoading(true);
    try {
      if (result.isGeneric) {
        const analyzedFood = await handleAnalyzeFood(searchTerm);
        onFoodFound(analyzedFood);
      } else {
        const response = await fetch(`/api/foods/search?id=${result.id}`);
        if (!response.ok) {
          throw new Error("Failed to get product details");
        }
        const details = await response.json();

        if (details.upc) {
          const upcResponse = await fetch(`/api/upc?upc=${details.upc}`);
          if (!upcResponse.ok) {
            throw new Error("Failed to get UPC details");
          }
          const data = await upcResponse.json();
          onFoodFound({ ...data, spoonImage: details.image });
        } else {
          await handleAnalyzeFood(result.title);
        }
      }
    } catch (error) {
      console.error(error);
      onError("Failed to get product details");
    } finally {
      setIsLoading(false);
      setSearchResults([]);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Enter UPC or search text"
          disabled={isLoading}
        />
        <Button onClick={handleSearch} disabled={isLoading || !searchTerm}>
          {isLoading ? "Searching..." : "Search"}
        </Button>
      </div>

      {searchResults.length > 0 && (
        <DropdownMenu open={true}>
          <DropdownMenuContent>
            <DropdownMenuItem
              onSelect={() =>
                handleSelectProduct({ title: searchTerm, isGeneric: true })
              }
              className="cursor-pointer"
            >
              <div className="text-muted-foreground">Generic - No Brand</div>
            </DropdownMenuItem>

            {searchResults.map((result, i) => (
              <DropdownMenuItem
                key={i}
                onSelect={() => handleSelectProduct(result)}
                className="flex items-center gap-2 cursor-pointer"
              >
                <img
                  src={result.image}
                  alt={result.title}
                  className="w-8 h-8 object-cover rounded"
                />
                <span>{result.title}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
