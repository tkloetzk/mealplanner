import {
  SpoonacularProductResponse,
  SpoonacularSearchResponse,
} from "@/types/spoonacular";

// src/services/spoonacular/spoonacularService.ts
const SPOONACULAR_API_BASE =
  "https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com";

export async function searchFoodProducts(
  searchTerm: string
): Promise<SpoonacularSearchResponse> {
  // Validate API key first
  if (!process.env.SPOONACULAR_API_KEY) {
    throw new Error("Spoonacular API key is not configured");
  }

  const params = new URLSearchParams({
    maxCalories: "5000",
    minProtein: "0",
    maxProtein: "100",
    minFat: "0",
    maxFat: "100",
    minCarbs: "0",
    maxCarbs: "100",
    minCalories: "0",
    query: searchTerm,
    offset: "0",
    number: "10",
  });

  const headers = {
    "X-RapidAPI-Key": process.env.SPOONACULAR_API_KEY,
    "X-RapidAPI-Host": "spoonacular-recipe-food-nutrition-v1.p.rapidapi.com",
  };

  const response = await fetch(
    `${SPOONACULAR_API_BASE}/food/products/search?${params}`,
    { headers }
  );

  if (!response.ok) {
    throw new Error("Failed to search food products");
  }

  return response.json();
}

export async function getProductDetails(
  id: number
): Promise<SpoonacularProductResponse> {
  // Validate API key first
  if (!process.env.SPOONACULAR_API_KEY) {
    throw new Error("Spoonacular API key is not configured");
  }

  const headers = {
    "X-RapidAPI-Key": process.env.SPOONACULAR_API_KEY,
    "X-RapidAPI-Host": "spoonacular-recipe-food-nutrition-v1.p.rapidapi.com",
  };

  const response = await fetch(`${SPOONACULAR_API_BASE}/food/products/${id}`, {
    headers,
  });

  if (!response.ok) {
    throw new Error("Failed to get product details");
  }

  return response.json();
}
