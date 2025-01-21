// app/api/analyze-food-image/route.ts
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

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
    const { image } = await request.json();

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

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined in the environment");
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const result = await model.generateContent([
      {
        inlineData: {
          data: imageContent, //Buffer.from(imageContent).toString("base64"),
          mimeType: "image/jpeg",
        },
      },
      "Describe this food image in detail, focusing on identifying what all the food items are, the ingredients, portion sizes, and visual characteristics relevant for nutritional analysis. Then provide suggestions for making the meal healthier and any concerns for children's consumption. The response structure should be an object with these fields: {foods: [{name: string, description: string, portionSize: string, visualCharacteristics: string, nutritionalAnalysis: string, suggestions: string, concerns: string}], summary: string}",
      // `Analyze this plate photo and determine how much of each food item was eaten compared to the original meal which contained: ${originalMeal}. Respond with ONLY a JSON object in this format: {"foods":[{"name":"food name","percentageEaten":number,"notes":"string"}],"summary":"string"}`,
    ]);

    const response = await result.response;
    //console.log(result.response.text());

    const output = await response.text();
    return NextResponse.json(JSON.parse(output));

    //     // First, get image description using vision model
    //     const visionResponse = await fetch(
    //       "https://openrouter.ai/api/v1/chat/completions",
    //       {
    //         method: "POST",
    //         headers: {
    //           Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    //           "Content-Type": "application/json",
    //           "HTTP-Referer":
    //             process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    //           "X-Title": "Kid's Meal Planner",
    //         },
    //         body: JSON.stringify({
    //           model: "anthropic/claude-3-haiku",
    //           messages: [
    //             {
    //               role: "user",
    //               content: [
    //                 {
    //                   type: "image",
    //                   image: imageContent,
    //                 },
    //                 {
    //                   type: "text",
    //                   text: "Describe this food image in detail, focusing on identifying ingredients, portion sizes, and visual characteristics relevant for nutritional analysis.",
    //                 },
    //               ],
    //             },
    //           ],
    //           temperature: 0.5,
    //           max_tokens: 300,
    //         }),
    //       }
    //     );

    //     if (!visionResponse.ok) {
    //       throw new Error("Vision API request failed");
    //     }

    //     const visionData = await visionResponse.json();
    //     const imageDescription =
    //       visionData.choices[0]?.message?.content || "Unable to analyze image.";

    //     // Now, get nutritional analysis using the image description
    //     const analysisResponse = await fetch(
    //       "https://openrouter.ai/api/v1/chat/completions",
    //       {
    //         method: "POST",
    //         headers: {
    //           Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    //           "Content-Type": "application/json",
    //           "HTTP-Referer":
    //             process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    //           "X-Title": "Kid's Meal Planner",
    //         },
    //         body: JSON.stringify({
    //           model: "anthropic/claude-3-haiku",
    //           messages: [
    //             {
    //               role: "user",
    //               content: `Based on this food description: "${imageDescription}"

    // ${prompt}

    // Please provide a detailed analysis focusing on children's nutritional needs.`,
    //             },
    //           ],
    //           temperature: 0.7,
    //           max_tokens: 500,
    //         }),
    //       }
    //     );

    //     if (!analysisResponse.ok) {
    //       throw new Error("Analysis API request failed");
    //     }

    //     const analysisData = await analysisResponse.json();
    //     const output =
    //       analysisData.choices[0]?.message?.content || "No analysis available.";

    //     return NextResponse.json({
    //       output,
    //       imageDescription, // Include the description for debugging/display purposes
    //     });
  } catch (error) {
    console.error("Error in food image analysis:", error);
    return NextResponse.json(
      { error: "Failed to analyze food image" },
      { status: 500 }
    );
  }
}
