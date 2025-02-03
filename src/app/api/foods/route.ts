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
import { handleError } from "@/app/utils/apiUtils";
import { getCollection } from "@/app/utils/databaseUtils";

type FoodDocument = Omit<Food, "id"> & { _id: ObjectId };
type GroupedFoods = Record<CategoryType, Food[]>;

export async function GET() {
  const foodCache = FoodCache.getInstance();
  const cachedFoods = foodCache.get();
  if (cachedFoods) {
    return NextResponse.json(cachedFoods);
  }

  try {
    const foodsCollection = await getCollection("foods");
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
    return handleError(error, "Failed to fetch foods");
  }
}

export async function POST(request: Request) {
  try {
    const foodData = await request.json();
    // Ensure all numeric fields are actually numbers before saving
    const validatedFoodData = ensureNestedNumericFields(foodData);

    const service = DatabaseService.getInstance();
    const foodsCollection = await service.getCollection("foods");
    const result = await foodsCollection.insertOne(validatedFoodData);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleError(error, "Failed to add food");
  }
}
