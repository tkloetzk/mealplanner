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

    console.log(response);
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

      let score = product?.nutriscore_grade;
      if (score === "unknown") {
        score = calculateNutriScore(product?.nutriscore);
      }

      console.log(product);

      const ingredientText =
        product?.ingredients_percent_analysis === -1
          ? product?.ingredients_hierarchy?.map((ingredient) =>
              ingredient.replace("en:", "").replace(/-/g, " ")
            )
          : product?.ingredients?.map((ingredient) => {
              return ingredient.percent_estimate + "% of " + ingredient.text;
            });
      console.log(ingredientText);
      const { nutriments } = product;
      return NextResponse.json({
        name: product?.product_name,
        calories: (
          nutriments["energy-kcal_serving"] || nutriments["energy-kcal_value"]
        ).toFixed(0),
        protein: (
          nutriments.proteins_serving || nutriments.proteins_value
        ).toFixed(0),
        carbs: (
          nutriments.carbohydrates_serving || nutriments.carbohydrates_value
        ).toFixed(0),
        fat: (nutriments.fat_serving || nutriments.fat_value).toFixed(0),
        servingSize: product?.serving_quantity,
        servingSizeUnit: product?.serving_quantity_unit,
        servingSizeImported: product?.serving_size_imported,
        upc: data.code,
        imageUrl: product?.image_front_thumb_url,
        ingredients: product?.ingredients_text,
        novaGroup: product?.nova_group,
        nutrientLevels: product?.nutrient_levels,
        additives: product?.additives_tags || [],
        saturatedFat: nutriments["saturated-fat_serving"] || 0,
        sugars: nutriments.sugars || 0,
        sodium: nutriments.sodium || 0,
        fiber: nutriments.fiber || 0,
        isOrganic: product?.isOrganic || false,
        ecoscoreGrade: product?.ecoscore_grade,
        ecoscoreScore: product?.ecoscore_score,
        transFat: nutriments["trans-fat_serving"] || 0,
        polyUnsaturatedFat: nutriments["polyunsaturated-fat_serving"] || 0,
        ingredientText,
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
