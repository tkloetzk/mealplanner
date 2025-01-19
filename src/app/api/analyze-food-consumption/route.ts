// app/api/analyze-food-consumption/route.ts
import { NextResponse } from "next/server";

// Helper function to validate base64 image
function isValidBase64Image(base64String: string): boolean {
  const base64Regex = /^data:image\/(png|jpeg|jpg);base64,/;
  return base64Regex.test(base64String);
}

// Helper function to extract image content from base64
function extractImageContent(base64String: string): string {
  return base64String.split(",")[1];
}

export async function POST(request: Request) {
  try {
    const { image, originalMeal } = await request.json();

    // Validate image data
    if (!image || !isValidBase64Image(image)) {
      return NextResponse.json(
        {
          error:
            "Invalid image format. Please provide a valid base64 encoded image.",
        },
        { status: 400 }
      );
    }

    // Extract image content
    const imageContent = extractImageContent(image);

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
    const output =
      data.choices[0]?.message?.content || "No analysis available.";

    // Parse the JSON response from the AI
    const analysisData = JSON.parse(output);

    return NextResponse.json(analysisData);
  } catch (error) {
    console.error("Error in consumption analysis:", error);
    return NextResponse.json(
      { error: "Failed to analyze consumption" },
      { status: 500 }
    );
  }
}
