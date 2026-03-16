// src/app/api/foods/estimate/route.ts
//
// AI-powered nutrition estimation using Gemini.
// Called explicitly by the user when database + Open Food Facts search
// doesn't find what they need.

import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { normalizeAIEstimate, type AIEstimateResponse } from "@/services/food/normalizers";
import type { FoodEstimateRequest, FoodEstimateResponse } from "@/types/foodSearch";

const GEMINI_MODELS = ["gemini-3.1-flash-lite-preview"] as const;

async function tryGenerate(apiKey: string, modelName: string, prompt: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.3, // Lower temp for more consistent nutrition estimates
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 1024,
      responseMimeType: "application/json",
    },
  });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

function buildPrompt(name: string, servingDescription?: string): string {
  const servingContext = servingDescription
    ? `The user describes the serving as: "${servingDescription}".`
    : "Use a standard single serving size.";

  return `You are a registered dietitian. Estimate the nutritional content of one serving of: "${name}".
${servingContext}

Return a JSON object with exactly these fields (all numbers, no strings for numeric values):
{
  "name": string,            // cleaned/canonical food name
  "calories": number,        // kcal per serving
  "protein": number,         // grams
  "carbs": number,           // grams
  "fat": number,             // grams
  "fiber": number,           // grams
  "sugar": number,           // grams
  "sodium": number,          // milligrams
  "saturatedFat": number,    // grams
  "servingSize": string,     // numeric amount as string, e.g. "170"
  "servingSizeUnit": string, // one of: g, ml, piece, cup, tbsp, oz, tsp
  "category": string         // one of: proteins, grains, fruits, vegetables, milk, other
}

Be precise with standard USDA-style values. If unsure, use reasonable median estimates.
Do not include any explanation — return ONLY the JSON object.`;
}

export async function POST(request: Request) {
  try {
    const body: FoodEstimateRequest = await request.json();

    if (!body.name || body.name.trim().length === 0) {
      return NextResponse.json(
        { error: "Food name is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "AI estimation is not configured" },
        { status: 503 }
      );
    }

    const prompt = buildPrompt(body.name.trim(), body.servingDescription);

    // Try models in order, falling back on quota errors
    let output: string | undefined;
    for (const modelName of GEMINI_MODELS) {
      try {
        output = await tryGenerate(apiKey, modelName, prompt);
        break; // Success — stop trying
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const isQuotaError = msg.includes("429") || msg.toLowerCase().includes("quota");

        if (!isQuotaError) {
          throw err; // Not a quota issue — don't retry
        }

        // If this was the last model, return 429
        if (modelName === GEMINI_MODELS[GEMINI_MODELS.length - 1]) {
          return NextResponse.json(
            { error: "AI estimation quota exceeded. Please try again later." },
            { status: 429 }
          );
        }
        // Otherwise try next model
        console.warn(`Quota exceeded for ${modelName}, trying next model...`);
      }
    }

    if (!output) {
      return NextResponse.json(
        { error: "Failed to generate estimate" },
        { status: 500 }
      );
    }

    const parsed: AIEstimateResponse = JSON.parse(output);
    const normalized = normalizeAIEstimate(parsed);

    const response: FoodEstimateResponse = {
      ...normalized,
      source: "ai",
      confidence: "estimated",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("AI estimate error:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "AI returned invalid data. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error
          ? error.message
          : "Failed to estimate nutrition",
      },
      { status: 500 }
    );
  }
}
