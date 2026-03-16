// app/api/analyze-food-image/route.ts
import { NextResponse } from "next/server";
import { isValidBase64Image, generateTextWithImageFallback } from "@/services/ai/geminiService";
import {
  safeParseAiJson,
  validateFoodImageAnalysis,
} from "@/utils/parseAiJson";

const PROMPT =
  "Describe this food image in detail, focusing on identifying what all the food items are, the ingredients, portion sizes, and visual characteristics relevant for nutritional analysis. Then provide suggestions for making the meal healthier and any concerns for children's consumption. The response structure should be an object with these fields: {foods: [{name: string, description: string, portionSize: string, visualCharacteristics: string, nutritionalAnalysis: string, suggestions: string, concerns: string}], summary: string}";

export async function POST(request: Request) {
  try {
    const { image } = await request.json();

    if (!image || !isValidBase64Image(image)) {
      return NextResponse.json(
        {
          error:
            "Invalid image format. Please provide a valid base64 encoded image.",
        },
        { status: 400 }
      );
    }

    const output = await generateTextWithImageFallback(image, PROMPT);

    const { data, error } = safeParseAiJson(output);
    if (error || !validateFoodImageAnalysis(data)) {
      console.error(
        "analyze-food-image: bad AI response",
        error ?? "schema mismatch",
        output.slice(0, 300)
      );
      return NextResponse.json(
        { error: "AI returned an unexpected response format" },
        { status: 502 }
      );
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in food image analysis:", error);
    return NextResponse.json(
      { error: "Failed to analyze food image" },
      { status: 500 }
    );
  }
}
