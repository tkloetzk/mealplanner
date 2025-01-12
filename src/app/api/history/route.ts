import { NextResponse } from "next/server";
import { MealService } from "@/lib/meal-service";

export async function GET() {
  const userId = "default-user";

  try {
    const history = await MealService.getMealHistory(userId);
    return NextResponse.json(history);
  } catch (error) {
    console.error("Error fetching meal history:", error);
    return NextResponse.json(
      { error: "Failed to fetch meal history" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const userId = "default-user";

  try {
    const mealEntry = await request.json();
    await MealService.addToHistory(userId, mealEntry);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving to history:", error);
    return NextResponse.json(
      { error: "Failed to save to history" },
      { status: 500 }
    );
  }
}
