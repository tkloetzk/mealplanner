import { NextResponse } from "next/server";
import { Food } from "@/types/food";
import { DatabaseService } from "@/app/utils/DatabaseService";

export async function GET() {
  try {
    const service = DatabaseService.getInstance();
    const foodsCollection = await service.getCollection("foods");
    const foods = await foodsCollection.find().toArray();

    // Transform _id to id in the response
    const transformedFoods = foods.map((food) => {
      const { _id, ...foodWithoutId } = food;
      return {
        ...foodWithoutId,
        id: _id.toString(),
      } as Food;
    });

    // Group foods by category
    const groupedFoods = transformedFoods.reduce((acc, food) => {
      if (!acc[food.category]) {
        acc[food.category] = [];
      }
      acc[food.category].push(food);
      return acc;
    }, {} as Record<string, Food[]>);

    return NextResponse.json(groupedFoods);
  } catch (error) {
    console.error("Error fetching foods:", error);
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

    const service = DatabaseService.getInstance();
    const foodsCollection = await service.getCollection("foods");
    const food = await foodsCollection.insertOne(foodData);
    console.log("Saved food:", food); // Debug log

    return NextResponse.json(food, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/foods:", error);
    return NextResponse.json({ error: "Failed to add food" }, { status: 500 });
  }
}
