import { calculateNutriScore } from "@/app/utils/nutriscoreCalculator";
import { NextResponse } from "next/server";

function stripMojibake(text: string): string {
  return text
    .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\uD7FF\uE000-\uFFFD]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const upc = searchParams.get("upc"); // Avoid JSON.stringify here

  // Development logging
  if (process.env.NODE_ENV === "development") {
    console.log("Received UPC:", upc);
  }

  if (!upc) {
    return NextResponse.json({ error: "UPC is required" }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${upc}.json`,
    );

    // Debug: console.log(response);
    if (!response.ok) {
      console.error(
        "Open Food Facts API error:",
        response.status,
        response.statusText,
      );
      return NextResponse.json(
        { error: `Failed to fetch product data. Status: ${response.status}` },
        { status: response.status },
      );
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.error("Invalid content type:", contentType);
      return NextResponse.json(
        { error: "Invalid content type received from API" },
        { status: 500 },
      );
    }

    const data = await response.json();

    if (data.status === 1) {
      const product = data.product;

      let score = product?.nutriscore_grade;
      if (score === "unknown") {
        score = calculateNutriScore(product?.nutriscore);
      }

      // Debug: console.log(product);

      interface Ingredient {
        percent_estimate: number;
        text: string;
      }

      const ingredientText: string[] | undefined =
        product?.ingredients_percent_analysis === -1
          ? product?.ingredients_hierarchy?.map((ingredient: string) =>
              stripMojibake(ingredient.replace("en:", "").replace(/-/g, " ")),
            )
          : product?.ingredients?.map((ingredient: Ingredient) => {
              return stripMojibake(ingredient.percent_estimate + "% of " + ingredient.text);
            });
      // Debug: console.log(ingredientText);
      const nutriments = product?.nutriments ?? {};

      const unitMap: Record<string, string> = {
        g: "g",
        ml: "ml",
        oz: "oz",
        cup: "cup",
        tbsp: "tbsp",
        tablespoon: "tbsp",
        tsp: "tsp",
        teaspoon: "tsp",
      };
      const gramConversions: Record<string, number> = {
        g: 1,
        ml: 1,
        oz: 28.35,
        cup: 240,
        tbsp: 15,
        tsp: 5,
        piece: 50,
      };
      const rawUnit = (product?.serving_quantity_unit || "g").toLowerCase();
      const servingUnit = unitMap[rawUnit] || "g";
      const servingAmount = parseFloat(product?.serving_quantity || "1") || 1;
      const gramsEquivalent =
        servingAmount * (gramConversions[servingUnit] || 1);
      const servingSizes = [
        {
          id: `${servingAmount}-${servingUnit}`,
          label: `${servingAmount} ${servingUnit}`,
          amount: servingAmount,
          unit: servingUnit,
          gramsEquivalent,
        },
      ];

      const calories =
        nutriments["energy-kcal_serving"] ?? nutriments["energy-kcal_value"] ?? 0;
      const protein =
        nutriments.proteins_serving ?? nutriments.proteins_value ?? 0;
      const carbs =
        nutriments.carbohydrates_serving ?? nutriments.carbohydrates_value ?? 0;
      const fat = nutriments.fat_serving ?? nutriments.fat_value ?? 0;

      return NextResponse.json({
        name: product?.product_name,
        calories: Math.round(Number(calories)),
        protein: Math.round(Number(protein)),
        carbs: Math.round(Number(carbs)),
        fat: Math.round(Number(fat)),
        servingSize: product?.serving_quantity,
        servingSizeUnit: servingUnit,
        servingSizeImported: product?.serving_size_imported,
        upc: data.code,
        imageUrl: product?.image_front_thumb_url,
        ingredients: product?.ingredients_text ? stripMojibake(product.ingredients_text) : undefined,
        novaGroup: product?.nova_group,
        nutrientLevels: product?.nutrient_levels,
        additives: product?.additives_tags || [],
        saturatedFat: nutriments["saturated-fat_serving"] || 0,
        sugars: nutriments["sugars_serving"] || 0,
        sodium: Math.round((nutriments["sodium_serving"] || 0) * 1000),
        fiber: nutriments["fiber_serving"] || 0,
        isOrganic: product?.isOrganic || false,
        ecoscoreGrade: product?.ecoscore_grade,
        ecoscoreScore: product?.ecoscore_score,
        transFat: nutriments["trans-fat_serving"] || 0,
        cholesterol: Math.round((nutriments["cholesterol_serving"] || 0) * 1000),
        polyUnsaturatedFat: nutriments["polyunsaturated-fat_serving"] || 0,
        ingredientText,
        servingSizes,
        baseNutritionPer100g: {
          calories: nutriments["energy-kcal_100g"]
            ? parseFloat(nutriments["energy-kcal_100g"].toFixed(0))
            : 0,
          protein: nutriments.proteins_100g
            ? parseFloat(nutriments.proteins_100g.toFixed(1))
            : 0,
          carbs: nutriments.carbohydrates_100g
            ? parseFloat(nutriments.carbohydrates_100g.toFixed(1))
            : 0,
          fat: nutriments.fat_100g
            ? parseFloat(nutriments.fat_100g.toFixed(1))
            : 0,
          sodium: nutriments.sodium_100g
            ? Math.round(nutriments.sodium_100g * 1000)
            : undefined,
          sugar: nutriments.sugars_100g
            ? parseFloat(nutriments.sugars_100g.toFixed(1))
            : undefined,
          saturatedFat: nutriments["saturated-fat_100g"]
            ? parseFloat(nutriments["saturated-fat_100g"].toFixed(1))
            : undefined,
          fiber: nutriments.fiber_100g
            ? parseFloat(nutriments.fiber_100g.toFixed(1))
            : undefined,
          transFat: nutriments["trans-fat_100g"]
            ? parseFloat(nutriments["trans-fat_100g"].toFixed(1))
            : undefined,
          cholesterol: nutriments.cholesterol_100g
            ? Math.round(nutriments.cholesterol_100g * 1000)
            : undefined,
        },
      });
    } else {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: `Failed to fetch product data: ${(error as Error).message}` },
      { status: 500 },
    );
  }
}
