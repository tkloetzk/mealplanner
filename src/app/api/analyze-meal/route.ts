// app/api/analyze-meal/route.ts
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();
    console.log("Received prompt:", prompt);

    // Check if API key is present
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY is not configured");
    }

    console.log("Making request to OpenRouter API...");
    const requestBody = {
      model: "anthropic/claude-3-haiku",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    };

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
        body: JSON.stringify(requestBody),
      }
    );

    console.log("OpenRouter API Response Status:", response.status);
    console.log("OpenRouter API Response Status Text:", response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter API error details:", {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        error: errorText,
      });
      throw new Error(`API request failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log("OpenRouter API Response Data:", data);

    const output = data.choices?.[0]?.message?.content;
    if (!output) {
      console.error("No content in API response:", data);
      throw new Error("No analysis content in API response");
    }

    return NextResponse.json({ output });
  } catch (error) {
    console.error("Error in meal analysis:", error);
    const errorDetails =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error details:", errorDetails);
    return NextResponse.json(
      {
        error: "Failed to analyze meal",
        details: errorDetails,
      },
      { status: 500 }
    );
  }
}
