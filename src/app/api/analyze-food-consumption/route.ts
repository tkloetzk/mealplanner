// app/api/analyze-food-consumption/route.ts
import { NextResponse } from "next/server";
import { isValidBase64Image, generateTextWithImageFallback } from "@/services/ai/geminiService";
import {
  safeParseAiJson,
  validateConsumptionAnalysis,
} from "@/utils/parseAiJson";

export async function POST(request: Request) {
  try {
    const { image, originalMeal } = await request.json();

    if (!isValidBase64Image(image)) {
      return NextResponse.json(
        { error: "Invalid image format" },
        { status: 400 }
      );
    }

    const prompt = `This is a picture of a plate of food. Originally this plate consisted of ${originalMeal}. Analyze the photo and tell me how much was eaten of each food.
        Respond in percentage. For example if there were originally 5 large strawberries, and only 1 in the picture, that means 4 strawberries were eaten, so return 0.8 as 80% were eaten, or if there is 1 cup of cereal and only a small amount is visible in the picture, return your best guess of the percentage that is missing`;

    const output = await generateTextWithImageFallback(image, prompt);
    console.log(output);

    const { data, error } = safeParseAiJson(output);
    if (error || !validateConsumptionAnalysis(data)) {
      console.error(
        "analyze-food-consumption: bad AI response",
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
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to analyze consumption",
      },
      { status: 500 }
    );
  }
}
