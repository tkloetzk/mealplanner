import { NextResponse } from "next/server";
import { DatabaseService } from "@/app/utils/DatabaseService";
import { MealSelection } from "@/types/meals";
import { MealType } from "@/types/shared";

interface SavedMeal {
  name: string;
  selections: MealSelection;
  mealType: MealType;
  kidId: string;
  createdAt: Date;
}

export async function POST(request: Request) {
  try {
    const { name, selections, mealType, kidId } = await request.json();

    if (!name || !selections || !mealType || !kidId) {
      return NextResponse.json(
        { error: "name, selections, mealType, and kidId are required" },
        { status: 400 }
      );
    }

    const service = DatabaseService.getInstance();
    const col = await service.getCollection<SavedMeal>("savedMeals");

    const doc: SavedMeal = { name, selections, mealType, kidId, createdAt: new Date() };
    const result = await col.insertOne(doc);

    return NextResponse.json({
      success: true,
      data: { _id: result.insertedId.toString(), ...doc },
    });
  } catch (error) {
    console.error("Error saving meal:", error);
    return NextResponse.json(
      { error: "Failed to save meal", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
