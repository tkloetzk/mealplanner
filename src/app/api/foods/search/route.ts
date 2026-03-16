// src/app/api/foods/search/route.ts
//
// Unified food search cascade:
//   1. Local MongoDB — always searched
//   2. Open Food Facts v1 text search — free, no key needed
//   3. Spoonacular (commented out — re-enable if OFF proves insufficient)
//
// Returns FoodSearchResponse with source-tagged, normalized results.

import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCollection } from "@/app/utils/databaseUtils";
import { ensureNumericFields } from "@/utils/validation/numericValidator";
import type { Food } from "@/types/food";
import type { FoodSearchResponse, FoodSearchResult } from "@/types/foodSearch";
import {
  normalizeLocalFood,
  normalizeOFFProduct,
  // normalizeSpoonacularResult,
  type OFFSearchProduct,
} from "@/services/food/normalizers";

type FoodDocument = Omit<Food, "id"> & { _id: ObjectId };

// Open Food Facts v1 text search endpoint (the only one that supports full-text)
const OFF_SEARCH_URL = "https://world.openfoodfacts.org/cgi/search.pl";

// // Spoonacular — kept for future use
// const SPOONACULAR_API_BASE =
//   "https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");
  const id = searchParams.get("id");

  // ── ID lookup (single product detail) ──────────────────────────────
  if (id) {
    return handleIdLookup(id);
  }

  // ── Text search ────────────────────────────────────────────────────
  if (!query) {
    return NextResponse.json(
      { error: "Search query is required" },
      { status: 400 }
    );
  }

  const results: FoodSearchResult[] = [];

  // 1. Local DB — always search
  const localResults = await searchLocalDB(query);
  results.push(...localResults);

  // 2. Open Food Facts text search
  const offResults = await searchOpenFoodFacts(query);
  results.push(...offResults);

  // // 3. Spoonacular (commented out — re-enable if needed)
  // const spoonResults = await searchSpoonacular(query);
  // results.push(...spoonResults);

  // Signal whether the AI estimation endpoint is available
  const aiAvailable = !!process.env.GEMINI_API_KEY;

  const response: FoodSearchResponse = { results, aiAvailable };
  return NextResponse.json(response);
}

// ── Local DB search ────────────────────────────────────────────────────

async function searchLocalDB(query: string): Promise<FoodSearchResult[]> {
  try {
    const collection = await getCollection<FoodDocument>("foods");
    const docs = await collection
      .find({ name: { $regex: query, $options: "i" } })
      .limit(10)
      .toArray();

    return docs.map((doc) => {
      // Ensure numeric fields are numbers before normalizing
      const cleaned = ensureNumericFields({
        ...doc,
        id: doc._id.toString(),
      }) as unknown as FoodDocument;
      // Restore _id since ensureNumericFields strips the type
      cleaned._id = doc._id;
      return normalizeLocalFood(cleaned);
    });
  } catch (error) {
    console.error("Local DB search error:", error);
    return [];
  }
}

// ── Open Food Facts text search ────────────────────────────────────────

async function searchOpenFoodFacts(
  query: string
): Promise<FoodSearchResult[]> {
  try {
    const params = new URLSearchParams({
      search_terms: query,
      search_simple: "1",
      action: "process",
      json: "1",
      page_size: "10",
      // Request specific fields to keep responses lean
      fields:
        "code,product_name,image_front_thumb_url,nutriments," +
        "serving_quantity,serving_quantity_unit,serving_size_imported," +
        "ingredients_text,ingredients,ingredients_hierarchy," +
        "ingredients_percent_analysis,nova_group,nutrient_levels," +
        "nutriscore_grade,additives_tags",
    });

    const response = await fetch(`${OFF_SEARCH_URL}?${params}`, {
      headers: {
        // OFF requires a custom User-Agent to identify apps
        "User-Agent": "KidsMealPlanner/1.0 (meal-planner-app)",
      },
    });

    if (!response.ok) {
      console.error("OFF search error:", response.status, response.statusText);
      return [];
    }

    const data = await response.json();
    const products: OFFSearchProduct[] = data.products ?? [];

    // Filter out products without a name
    return products
      .filter((p) => p.product_name)
      .map(normalizeOFFProduct);
  } catch (error) {
    console.error("Open Food Facts search error:", error);
    return [];
  }
}

// // ── Spoonacular search (commented out) ────────────────────────────────
//
// async function searchSpoonacular(
//   query: string
// ): Promise<FoodSearchResult[]> {
//   if (!process.env.SPOONACULAR_API_KEY) return [];
//
//   const spoonHeaders = {
//     "X-RapidAPI-Key": process.env.SPOONACULAR_API_KEY,
//     "X-RapidAPI-Host": "spoonacular-recipe-food-nutrition-v1.p.rapidapi.com",
//   };
//
//   try {
//     const params = new URLSearchParams({
//       query,
//       offset: "0",
//       number: "10",
//       maxCalories: "5000",
//       minProtein: "0",
//       maxProtein: "100",
//       minFat: "0",
//       maxFat: "100",
//       minCarbs: "0",
//       maxCarbs: "100",
//       minCalories: "0",
//     });
//
//     const response = await fetch(
//       `${SPOONACULAR_API_BASE}/food/products/search?${params}`,
//       { headers: spoonHeaders }
//     );
//
//     if (!response.ok) return [];
//
//     const data = await response.json();
//     return (data.products ?? []).map(normalizeSpoonacularResult);
//   } catch (error) {
//     console.error("Spoonacular search error:", error);
//     return [];
//   }
// }

// ── ID lookup helper ───────────────────────────────────────────────────

async function handleIdLookup(id: string) {
  // Try local DB first (valid ObjectId)
  if (ObjectId.isValid(id)) {
    try {
      const collection = await getCollection<FoodDocument>("foods");
      const doc = await collection.findOne({ _id: new ObjectId(id) });
      if (doc) {
        const result = normalizeLocalFood(doc);
        return NextResponse.json(result);
      }
    } catch {
      // fall through
    }
  }

  // Try Open Food Facts by barcode if the id looks like one (all digits)
  if (/^\d+$/.test(id)) {
    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${id}.json`,
        {
          headers: {
            "User-Agent": "KidsMealPlanner/1.0 (meal-planner-app)",
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        if (data.status === 1 && data.product) {
          const result = normalizeOFFProduct(data.product as OFFSearchProduct);
          return NextResponse.json(result);
        }
      }
    } catch (error) {
      console.error("OFF barcode lookup error:", error);
    }
  }

  // // Spoonacular detail lookup (commented out)
  // if (process.env.SPOONACULAR_API_KEY) {
  //   try {
  //     const response = await fetch(
  //       `${SPOONACULAR_API_BASE}/food/products/${id}`,
  //       {
  //         headers: {
  //           "X-RapidAPI-Key": process.env.SPOONACULAR_API_KEY,
  //           "X-RapidAPI-Host":
  //             "spoonacular-recipe-food-nutrition-v1.p.rapidapi.com",
  //         },
  //       }
  //     );
  //     if (response.ok) {
  //       const data = await response.json();
  //       return NextResponse.json(data);
  //     }
  //   } catch (error) {
  //     console.error("Spoonacular product lookup error:", error);
  //   }
  // }

  return NextResponse.json({ error: "Product not found" }, { status: 404 });
}
