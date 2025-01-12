import { NextResponse } from "next/server";
import { FoodsService } from "@/lib/foods-service";

export async function GET() {
  try {
    const foods = await FoodsService.getAllFoods();

    // Group foods by category
    const groupedFoods = foods.reduce((acc, food) => {
      if (!acc[food.category]) {
        acc[food.category] = [];
      }
      acc[food.category].push(food);
      return acc;
    }, {} as Record<string, any[]>);

    return NextResponse.json(groupedFoods);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch foods" },
      { status: 500 }
    );
  }
}
