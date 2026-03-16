// app/api/analyze-meal/route.ts
import { NextResponse } from "next/server";
import { generateTextWithFallback } from "@/services/ai/geminiService";
import { safeParseAiJson } from "@/utils/parseAiJson";
import type { MealSelection, SelectedFood, Food } from "@/types/food";
import type { MealType } from "@/types/meals";

interface KidProfile {
  name: string;
  age: number;
  activityLevel: "sedentary" | "moderate" | "active";
  restrictions?: string;
}

interface Targets {
  mealCalories: number;
  proteinMin: number;
  proteinMax: number;
  fatMin: number;
  fatMax: number;
}

interface AnalyzeMealRequest {
  mealSelections: MealSelection;
  mealType: MealType;
  kidProfile: KidProfile;
  targets: Targets;
}

function formatFoodDetails(food: SelectedFood | Food | Food[] | null): string {
  if (!food) return "";
  if (Array.isArray(food)) return food.map((f) => formatFoodDetails(f)).join(", ");
  const cal = (food as SelectedFood).adjustedCalories ?? food.calories;
  const pro = (food as SelectedFood).adjustedProtein ?? food.protein;
  const carb = (food as SelectedFood).adjustedCarbs ?? food.carbs;
  const fat = (food as SelectedFood).adjustedFat ?? food.fat;
  const basic = `${food.name} (${food.servings} serving${food.servings > 1 ? "s" : ""})`;
  const nutrition = `, ${cal} cal, ${pro}g protein, ${carb}g carbs, ${fat}g fat`;
  const ingredients = food.ingredients ? ` - Ingredients: ${food.ingredients}` : "";
  return basic + nutrition + ingredients;
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as AnalyzeMealRequest;
    const { mealSelections, mealType, kidProfile, targets } = body;

    if (!mealSelections || !mealType || !kidProfile || !targets) {
      return NextResponse.json(
        { error: "Missing required fields: mealSelections, mealType, kidProfile, targets" },
        { status: 400 }
      );
    }

    const { name: kidName, age: kidAge, activityLevel: kidActivity, restrictions: kidRestrictions } = kidProfile;
    const { mealCalories, proteinMin, proteinMax, fatMin, fatMax } = targets;

    const mealDescription = Object.entries(mealSelections)
      .map(([category, food]) => {
        if (!food || (Array.isArray(food) && food.length === 0)) return null;
        return `${category}: ${formatFoodDetails(food as SelectedFood | Food[])}`;
      })
      .filter(Boolean)
      .join("\n");

    const prompt = `You are a pediatric nutritionist analyzing a ${mealType} meal for ${kidName}, who is ${kidAge} years old with a ${kidActivity} activity level.${kidRestrictions ? `\n\nIMPORTANT - Dietary restrictions/allergies for ${kidName}: ${kidRestrictions}. Flag any violations as warnings.` : ""}

This is a single meal, not a full day's worth of nutrition. ${kidName} will also have other meals throughout the day.

Meal Contents:
${mealDescription}

Nutritional Targets for this ${mealType}:
- Calories: ${mealCalories} calories
- Protein: ${proteinMin.toFixed(1)}-${proteinMax.toFixed(1)}g per meal
- Fat: ${fatMin.toFixed(1)}-${fatMax.toFixed(1)}g per meal

Please analyze the meal's nutritional balance and suitability for ${kidName} (age ${kidAge}). Consider:
- Age-appropriate portion sizes for a ${kidAge} year old with ${kidActivity} activity level
- Variety and food group balance
- Any foods that might be choking hazards or otherwise inappropriate for this age${kidRestrictions ? `\n- Whether any foods conflict with the stated dietary restrictions: ${kidRestrictions}` : ""}
- Whether the meal supports healthy growth and development

balanceScore should be a number from 1-100, with 100 being the most balanced and healthiest.
Respond with ONLY a JSON object using these exact keys:
{
  "nutrition": {"calories": number, "protein": number, "carbs": number, "fat": number},
  "recommendations": string[],
  "warnings": string[],
  "balanceScore": number,
  "nutritionalGoalsAnalysis": {
    "meetsCalorieGoal": boolean,
    "meetsProteinGoal": boolean,
    "meetsFatGoal": boolean
  }
}`;

    const output = await generateTextWithFallback(prompt, {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024,
    });

    const { data, error } = safeParseAiJson(output);
    if (error) {
      console.error(
        "analyze-meal: bad AI response",
        error,
        output.slice(0, 300)
      );
      return NextResponse.json(
        { error: "AI returned an unexpected response format", details: error },
        { status: 502 }
      );
    }
    return NextResponse.json({ output: data });
  } catch (error) {
    console.error("Error analyzing meal:", error);
    return NextResponse.json(
      {
        error: "Failed to analyze meal",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
