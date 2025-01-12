import { NextResponse } from "next/server";
import { MealService } from "@/lib/meal-service";
import { DAYS_OF_WEEK, DEFAULT_MEAL_PLAN } from "@/constants/meal-goals";
import { MealPlan } from "@/types/food";

export async function GET() {
  const userId = "default-user";

  try {
    const mealPlan = await MealService.getUserMealPlan(userId);
    if (!mealPlan) {
      return NextResponse.json(DEFAULT_MEAL_PLAN);
    }
    const completeMealPlan = DAYS_OF_WEEK.reduce((plan, day) => {
      plan[day] = mealPlan[day] || DEFAULT_MEAL_PLAN[day];
      return plan;
    }, {} as MealPlan);

    return NextResponse.json(completeMealPlan);
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
    console.log("in post", selections);
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
