// app/api/analyze-food-consumption/route.ts
import { NextResponse } from "next/server";

// app/api/analyze-food-consumption/route.ts

// Helper function to validate base64 image
function isValidBase64Image(base64String: string): boolean {
  const base64Regex = /^data:image\/(png|jpeg|jpg);base64,/;
  return base64Regex.test(base64String);
}

export async function POST(request: Request) {
  try {
    const { image, originalMeal } = await request.json();

    if (!image || !isValidBase64Image(image)) {
      return NextResponse.json(
        { error: "Invalid image format" },
        { status: 400 }
      );
    }

    const imageContent = image.split(",")[1];

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer":
            process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
          "X-Title": "Kid's Meal Planner",
        },
        body: JSON.stringify({
          model: "anthropic/claude-3-haiku",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image",
                  image: imageContent,
                },
                {
                  type: "text",
                  text: `Analyze this plate photo and determine how much of each food item was eaten. The original meal contained: ${originalMeal}. 

Please provide your response in JSON format with the following structure:
{
  "foods": [
    {
      "name": "food name",
      "percentageEaten": number (0-100),
      "notes": "any relevant notes about consumption"
    }
  ],
  "summary": "brief summary of overall consumption patterns"
}`,
                },
              ],
            },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Analysis API request failed");
    }

    const data = await response.json();
    const analysisData = JSON.parse(data.choices[0]?.message?.content);

    return NextResponse.json(analysisData);
  } catch (error) {
    console.error("Error in consumption analysis:", error);
    return NextResponse.json(
      { error: "Failed to analyze consumption" },
      { status: 500 }
    );
  }
}
