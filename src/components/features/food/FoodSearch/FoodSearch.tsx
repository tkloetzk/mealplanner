import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Food } from "@/types/food";
import { Camera } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FoodSearchProps {
  onFoodFound: (food: Food) => void;
  onError: (error: string) => void;
  onScanRequest?: () => void;
}

interface SearchResult {
  id?: string;
  title: string;
  image?: string;
  isGeneric?: boolean;
}

export function FoodSearch({
  onFoodFound,
  onError,
  onScanRequest,
}: FoodSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      if (/^\d+$/.test(searchTerm)) {
        // UPC search
        console.log("searchTermupc", searchTerm);

        const response = await fetch(`/api/upc?upc=${searchTerm}`);
        if (!response.ok) {
          throw new Error("Product not found");
        }
        const data = await response.json();
        onFoodFound(data);
      } else {
        console.log("searchTerm", searchTerm);
        // Text search
        const response = await fetch(
          `/api/foods/search?query=${encodeURIComponent(searchTerm)}`
        );
        if (!response.ok) {
          throw new Error("Search failed");
        }
        const data = await response.json();
        setSearchResults(data.products || []);
        setShowDropdown(true);
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

  const handleAnalyzeFood = async (searchText: string) => {
    try {
      const response = await fetch("/api/analyze-food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Can you give me nutritional information on one serving of ${searchText}? 
          Reply in a JSON object with properties of 
          note, calories, protein (in grams), carbs (in grams), fat (in grams), servingSize, servingSizeUnit (grams, millileters, ounces, tsp, tbsp, cups, pieces), category (if its a protein, vegetable, grain, fruit, or other) in reference to one serving`,
        }),
      });

      if (!response.ok) throw new Error("Analysis failed");
      const data = await response.json();

      console.log("Raw analysis response:", data);
      // Create a properly structured food object from the analysis
      const analyzedFood: Partial<Food> = {
        name: searchText,
        calories: parseFloat(data.calories || 0),
        protein: parseFloat(data.protein || 0),
        carbs: parseFloat(data.carbs || 0),
        fat: parseFloat(data.fat || 0),
        servingSize: data.servingSize || "1",
        servingSizeUnit: data.servingSizeUnit || "piece",
        category: data.category || "other",
        meal: data.meal || ["breakfast", "lunch", "dinner"],
        analysis: data.analysis || null,
        cloudinaryUrl: data.imageUrl || null,
      };
      // const analyzedFood: Partial<Food> = {
      //   name: searchText,
      //   calories: parseFloat(data.output.calories || 0),
      //   protein: parseFloat(data.output.protein || 0),
      //   carbs: parseFloat(data.output.carbs || 0),
      //   fat: parseFloat(data.output.fat || 0),
      //   servingSize: data.output.servingSize || "1",
      //   servingSizeUnit: data.output.servingSizeUnit || "piece",
      //   category: data.output.category || "other",
      //   meal: data.output.meal || ["breakfast", "lunch", "dinner"],
      //   analysis: data.output.analysis || null,
      //   cloudinaryUrl: data.output.imageUrl || null,
      // };
      console.log("Structured food object:", analyzedFood);

      onFoodFound(analyzedFood as Food);
      setShowDropdown(false);
      return analyzedFood;
    } catch (error) {
      onError("Could not find nutritional information");
      throw error;
    }
  };

  const handleSelectProduct = async (result: SearchResult) => {
    setIsLoading(true);
    try {
      if (result.isGeneric) {
        await handleAnalyzeFood(searchTerm);
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
      setShowDropdown(false);
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
        {onScanRequest && (
          <Button
            variant="outline"
            onClick={onScanRequest}
            data-testid="barcode-scanner"
          >
            <Camera className="h-4 w-4" />
          </Button>
        )}
      </div>

      {searchResults.length > 0 && showDropdown && (
        <DropdownMenu open={true} onOpenChange={setShowDropdown}>
          <DropdownMenuTrigger asChild>
            <div />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-full" align="start">
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
                {result.image && (
                  <img
                    src={result.image}
                    alt={result.title}
                    className="w-8 h-8 object-cover rounded"
                  />
                )}
                <span>{result.title}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
