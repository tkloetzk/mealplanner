import { NextResponse } from "next/server";

const SPOONACULAR_API_BASE =
  "https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com";

const headers = {
  "X-RapidAPI-Key": process.env.SPOONACULAR_API_KEY!,
  "X-RapidAPI-Host": "spoonacular-recipe-food-nutrition-v1.p.rapidapi.com",
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");
  const id = searchParams.get("id");

  if (!process.env.SPOONACULAR_API_KEY) {
    return NextResponse.json(
      { error: "API key not configured" },
      { status: 500 }
    );
  }

  try {
    // If ID is provided, get product details
    if (id) {
      const response = await fetch(
        `${SPOONACULAR_API_BASE}/food/products/${id}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error("Failed to get product details");
      }

      const data = await response.json();
      return NextResponse.json(data);
    }

    // Otherwise, perform search
    if (!query) {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 }
      );
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
      query,
      offset: "0",
      number: "10",
    });

    const response = await fetch(
      `${SPOONACULAR_API_BASE}/food/products/search?${params}`,
      { headers }
    );

    if (!response.ok) {
      throw new Error("Failed to search food products");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Spoonacular API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
