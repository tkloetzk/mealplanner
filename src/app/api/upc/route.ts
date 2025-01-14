import { calculateNutriScore } from "@/app/utils/nutriscoreCalculator";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const upc = searchParams.get("upc"); // Avoid JSON.stringify here

  console.log("Received UPC:", upc);

  if (!upc) {
    return NextResponse.json({ error: "UPC is required" }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${upc}.json`
    );

    if (!response.ok) {
      console.error(
        "Open Food Facts API error:",
        response.status,
        response.statusText
      );
      return NextResponse.json(
        { error: `Failed to fetch product data. Status: ${response.status}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.error("Invalid content type:", contentType);
      return NextResponse.json(
        { error: "Invalid content type received from API" },
        { status: 500 }
      );
    }

    const data = await response.json();

    if (data.status === 1) {
      const product = data.product;

      let score = product.nutriscore_grade;
      if (score === "unknown") {
        score = calculateNutriScore(product.nutriscore);
      }

      return NextResponse.json({
        name: product.product_name,
        calories: product.nutriments["energy-kcal"],
        protein: product.nutriments.proteins,
        carbs: product.nutriments.carbohydrates,
        fat: product.nutriments.fat,
        servingSize: product.serving_quantity,
        servingSizeUnit: product.serving_quantity_unit,
        upc: data.code,
        imageUrl: product.image_front_thumb_url,
        ingredients: product.ingredients_text,
        novaGroup: product.nova_group,
        nutrientLevels: product.nutrient_levels,
        score,
        additives: product.additives_tags,
      });
    } else {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: `Failed to fetch product data: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
