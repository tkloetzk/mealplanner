// app/api/analyze-meal/route.ts
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

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
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("API request failed");
    }

    const data = await response.json();
    const output =
      data.choices[0]?.message?.content || "No analysis available.";

    return NextResponse.json({ output });
  } catch (error) {
    console.error("Error in meal analysis:", error);
    return NextResponse.json(
      { error: "Failed to analyze meal" },
      { status: 500 }
    );
  }
}
