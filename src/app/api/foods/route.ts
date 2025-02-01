// src/app/api/foods/route.ts
import { NextResponse } from "next/server";
import { CategoryType, Food } from "@/types/food";
import { DatabaseService } from "@/app/utils/DatabaseService";
import { ObjectId } from "mongodb";
import { FoodCache } from "@/app/utils/FoodCache";
import {
  ensureNumericFields,
  ensureNestedNumericFields,
} from "@/utils/validation/numericValidator"; // Fixed path

type FoodDocument = Omit<Food, "id"> & { _id: ObjectId };
type GroupedFoods = Record<CategoryType, Food[]>;

export async function GET() {
  const foodCache = FoodCache.getInstance();
  const cachedFoods = foodCache.get();
  if (cachedFoods) {
    return NextResponse.json(cachedFoods);
  }

  try {
    const service = DatabaseService.getInstance();
    const foodsCollection = await service.getCollection<FoodDocument>("foods");
    const foods = await foodsCollection.find({}).toArray();

    const transformedFoods = foods.reduce<GroupedFoods>((acc, food) => {
      if (!food.category) {
        console.warn(`Food item ${food._id} has no category`);
        return acc;
      }

      if (!acc[food.category]) {
        acc[food.category] = [];
      }

      const { _id, ...foodWithoutId } = food;
      // Ensure numeric fields are numbers
      const transformedFood: Food = ensureNumericFields({
        ...foodWithoutId,
        id: _id.toString(),
      });

      acc[food.category].push(transformedFood);
      return acc;
    }, {} as GroupedFoods);

    foodCache.set(transformedFoods);
    return NextResponse.json(transformedFoods);
  } catch (error) {
    console.error("Error fetching foods:", error);
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
    // Ensure all numeric fields are actually numbers before saving
    const validatedFoodData = ensureNestedNumericFields(foodData);

    const service = DatabaseService.getInstance();
    const foodsCollection = await service.getCollection("foods");
    const food = await foodsCollection.insertOne(validatedFoodData);
    return NextResponse.json(food, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/foods:", error);
    return NextResponse.json({ error: "Failed to add food" }, { status: 500 });
  }
}
