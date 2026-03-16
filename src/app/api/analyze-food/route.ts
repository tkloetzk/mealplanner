// app/api/analyze-food/route.ts
import { NextResponse } from "next/server";
import { generateTextWithFallback } from "@/services/ai/geminiService";
import { safeParseAiJson } from "@/utils/parseAiJson";

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    let output: string;
    try {
      output = await generateTextWithFallback(prompt, {
        temperature: 1,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
      });
    } catch (e) {
      if (
        e instanceof Error &&
        (e as Error & { quotaExceeded?: boolean }).quotaExceeded
      ) {
        return NextResponse.json({ error: "quota_exceeded" }, { status: 429 });
      }
      throw e;
    }

    const { data, error } = safeParseAiJson(output);
    if (error) {
      console.error(
        "analyze-food: bad AI response",
        error,
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
