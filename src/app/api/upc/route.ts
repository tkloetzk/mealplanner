// app/api/upc/route.ts
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const upc = searchParams.get("upc");

  console.log("in");
  if (!upc) {
    return NextResponse.json({ error: "UPC required" }, { status: 400 });
  }

  try {
    // Using Open Food Facts API (free)
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${upc}.json`
    );
    const data = await response.json();

    if (data.status === 1) {
      const product = data.product;
      return NextResponse.json({
        name: product.product_name,
        calories: product.nutriments["energy-kcal"],
        protein: product.nutriments.proteins,
        carbs: product.nutriments.carbohydrates,
        fat: product.nutriments.fat,
        servingSize: product.serving_quantity,
        servingSizeUnit: product.serving_quantity_unit,
        imageUrl: product.image_front_thumb_url,
        // Add any additional fields you need
      });
    } else {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Failed to fetch product data. " + error },
      { status: 500 }
    );
  }
}
