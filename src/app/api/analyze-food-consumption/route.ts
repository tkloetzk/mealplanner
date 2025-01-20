// app/api/analyze-food-consumption/route.ts
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Helper function to validate base64 image
function isValidBase64Image(base64String: string): boolean {
  const base64Regex = /^data:image\/(png|jpeg|jpg);base64,/;
  return base64Regex.test(base64String);
}
// app/api/analyze-food-consumption/route.ts
export async function POST(request: Request) {
  try {
    const { image, originalMeal } = await request.json();

    if (!isValidBase64Image(image)) {
      return NextResponse.json(
        { error: "Invalid image format" },
        { status: 400 }
      );
    }

    const imageContent = image.split(",")[1];

    // Add timeout to the OpenRouter API call
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      // const response = await fetch(
      //   "https://openrouter.ai/api/v1/chat/completions",
      //   {
      //     method: "POST",
      //     signal: controller.signal,
      //     headers: {
      //       Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      //       "Content-Type": "application/json",
      //       "HTTP-Referer":
      //         process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      //       "X-Title": "Kid's Meal Planner",
      //     },
      //     body: JSON.stringify({
      //       model: "google/gemini-2.0-flash-thinking-exp:free",
      //       messages: [
      //         {
      //           role: "user",
      //           content: [
      //             {
      //               type: "image",
      //               image: imageContent,
      //             },
      //             {
      //               type: "text",
      //               text: `Analyze this plate photo and determine how much of each food item was eaten compared to the original meal which contained: ${originalMeal}. Respond with ONLY a JSON object in this format: {"foods":[{"name":"food name","percentageEaten":number,"notes":"string"}],"summary":"string"}`,
      //             },
      //           ],
      //         },
      //       ],
      //       temperature: 1,
      //       top_p: 0.95,
      //       top_k: 40,
      //       max_tokens: 500,
      //     }),
      //   }
      // );

      //

      // const apiKey = process.env.GEMINI_API_KEY;
      // if (!apiKey) {
      //   throw new Error("GEMINI_API_KEY is not defined in the environment");
      // }
      // const genAI = new GoogleGenerativeAI(apiKey);
      // const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      // Retrieve the data we recieve as part of the request body
      //const data = await req.json();

      // Define a prompt varibale
      //const prompt = data.body;

      // Pass the prompt to the model and retrieve the output
      // const result = await model.generateContent(prompt);
      // const response = await result.response;
      // const output = await response.text();

      //

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
        `This is a picture of a plate of food. Originally this plate consisted of ${originalMeal}. Analyze the photo and tell me how much was eaten of each food.
        Response in percentage. For example if there were originally 5 large strawberries, and only 1 in the picture, that means 4 strawberries were eaten, so return 0.8 as 80% were eaten, or if there is 1 cup of cereal and only a small amount is visible in the picture, return your best guess of the percentage that is missing`,
        // `Analyze this plate photo and determine how much of each food item was eaten compared to the original meal which contained: ${originalMeal}. Respond with ONLY a JSON object in this format: {"foods":[{"name":"food name","percentageEaten":number,"notes":"string"}],"summary":"string"}`,
      ]);
      //const prompt = "Explain how AI works";

      // const result = await model.generateContent(prompt);
      const response = await result.response;
      //console.log(result.response.text());

      const output = await response.text();

      console.log(output);
      clearTimeout(timeout);

      // if (!response.ok) {
      //   const errorText = await response.text();
      //   console.error("6a. OpenRouter API error:", errorText); // Debug point 6a
      //   throw new Error(`API request failed: ${errorText}`);
      // }

      // const data = await response.json();
      // const output =
      //   data.choices[0]?.message?.content || "No analysis available.";
      // console.log("6b. Successfully parsed OpenRouter response", output); // Debug point 6b

      return NextResponse.json(JSON.parse(output));
    } catch (error) {
      console.error("7. OpenRouter request failed:", error); // Debug point 7
      if (error instanceof Error && error.name === "AbortError") {
        return NextResponse.json(
          { error: "Analysis request timed out" },
          { status: 504 }
        );
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    console.error("8. Final error handler:", error); // Debug point 8
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
