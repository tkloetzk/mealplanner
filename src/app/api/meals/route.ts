import { NextResponse } from "next/server";
import { MealService } from "@/lib/meal-service";

export async function GET() {
  // For now, using a mock user ID until we implement authentication
  const userId = "default-user";

  try {
    const mealPlan = await MealService.getUserMealPlan(userId);
    return NextResponse.json(mealPlan);
  } catch (error) {
    console.error("Error fetching meal plan:", error);
    return NextResponse.json(
      { error: "Failed to fetch meal plan" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const userId = "default-user";

  try {
    const selections = await request.json();
    await MealService.saveMealPlan(userId, selections);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving meal plan:", error);
    return NextResponse.json(
      { error: "Failed to save meal plan" },
      { status: 500 }
    );
  }
}
