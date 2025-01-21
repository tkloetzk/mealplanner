import { NextResponse } from "next/server";
import { CategoryType, Food } from "@/types/food";
import { DatabaseService } from "@/app/utils/DatabaseService";
import { ObjectId } from "mongodb";
import { FoodCache } from "@/app/utils/FoodCache";

type FoodDocument = Omit<Food, "id"> & { _id: ObjectId };
type GroupedFoods = Record<CategoryType, Food[]>;

export async function GET() {
  const foodCache = FoodCache.getInstance();

  // Check cache first
  const cachedFoods = foodCache.get();
  if (cachedFoods) {
    return NextResponse.json(cachedFoods);
  }
  try {
    const service = DatabaseService.getInstance();
    // @ts-expect-error Idk what to do
    const foodsCollection = await service.getCollection<FoodDocument>("foods");

    // Use more explicit typing and error handling
    const foods = await foodsCollection.find({}).toArray();

    // More robust transformation with type guard
    const transformedFoods = foods.reduce<GroupedFoods>((acc, food) => {
      if (!food.category) {
        console.warn(`Food item ${food._id} has no category`);
        return acc;
      }

      if (!acc[food.category]) {
        acc[food.category] = [];
      }

      const { _id, ...foodWithoutId } = food;
      const transformedFood: Food = {
        ...foodWithoutId,
        id: _id.toString(),
      };

      acc[food.category].push(transformedFood);
      return acc;
    }, {} as GroupedFoods);

    // Cache the results
    foodCache.set(transformedFoods);

    return NextResponse.json(transformedFoods);
  } catch (error) {
    console.error("Error fetching foods:", error);

    // More informative error response
    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred while fetching foods";

    return NextResponse.json(
      {
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined,
      },
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
