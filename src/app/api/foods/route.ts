import { NextResponse } from "next/server";
import { FoodsService } from "@/lib/foods-service";
import { Food } from "@/types/food";

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
    }, {} as Record<string, Food[]>);

    return NextResponse.json(groupedFoods);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch foods" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const foodData = await request.json();
    console.log("Received food data:", foodData); // Debug log

    const food = await FoodsService.addFood(foodData);
    console.log("Saved food:", food); // Debug log

    return NextResponse.json(food, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/foods:", error);
    return NextResponse.json({ error: "Failed to add food" }, { status: 500 });
  }
}
