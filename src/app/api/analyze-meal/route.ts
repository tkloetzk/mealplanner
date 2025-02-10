// app/api/analyze-meal/route.ts
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-pro",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    });

    const result = await model.generateContent([
      `${prompt} Please analyze this and return a JSON object with the following structure:
      {
        "name": string,
        "servingSize": string,
        "servingSizeUnit": string,
        "nutrition": {
          "calories": number,
          "protein": number,
          "carbs": number,
          "fat": number
        },
        "ingredients": Array<{
          "name": string,
          "amount": number,
          "unit": string
        }>,
        "category": string
      }`,
    ]);

    const response = await result.response;
    const output = await response.text();

    return NextResponse.json(JSON.parse(output));
  } catch (error) {
    console.error("Error analyzing meal:", error);
    return NextResponse.json(
      { error: "Failed to analyze meal" },
      { status: 500 }
    );
  }
}
