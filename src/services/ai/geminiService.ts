import { GoogleGenerativeAI } from "@google/generative-ai";

export interface GeminiGenerationConfig {
  temperature?: number;
  topK?: number;
  topP?: number;
  maxOutputTokens?: number;
}

const DEFAULT_TEXT_MODEL = "gemini-3.1-flash-lite-preview";
const FALLBACK_TEXT_MODEL = "gemini-3.1-flash-lite-preview";

function getClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not defined");
  return new GoogleGenerativeAI(apiKey);
}

/** Validate a base64 data-URL image string */
export function isValidBase64Image(base64: string): boolean {
  return /^data:image\/(png|jpeg|jpg);base64,/.test(base64);
}

/** Strip the data-URL prefix, returning raw base64 */
export function extractImageData(base64: string): string {
  return base64.split(",")[1];
}

/** Generate a text response from a text-only prompt */
export async function generateText(
  prompt: string,
  modelName = DEFAULT_TEXT_MODEL,
  config?: GeminiGenerationConfig
): Promise<string> {
  const model = getClient().getGenerativeModel({
    model: modelName,
    generationConfig: { ...config, responseMimeType: "application/json" },
  });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

/** Generate a text response from an image + text prompt */
export async function generateTextWithImage(
  imageBase64: string,
  prompt: string,
  modelName = FALLBACK_TEXT_MODEL
): Promise<string> {
  const mimeType = imageBase64.startsWith("data:image/png")
    ? "image/png"
    : "image/jpeg";
  const model = getClient().getGenerativeModel({
    model: modelName,
    generationConfig: { responseMimeType: "application/json" },
  });
  const result = await model.generateContent([
    { inlineData: { data: extractImageData(imageBase64), mimeType } },
    prompt,
  ]);
  return result.response.text();
}

/** Generate text+image with automatic quota fallback (mirrors generateTextWithFallback) */
export async function generateTextWithImageFallback(
  imageBase64: string,
  prompt: string,
  primaryModel = DEFAULT_TEXT_MODEL,
  fallbackModel = FALLBACK_TEXT_MODEL
): Promise<string> {
  try {
    return await generateTextWithImage(imageBase64, prompt, primaryModel);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (!msg.includes("429") && !msg.toLowerCase().includes("quota")) throw e;
    console.warn(`[gemini] ${primaryModel} quota/rate error:`, msg);
  }
  try {
    return await generateTextWithImage(imageBase64, prompt, fallbackModel);
  } catch (e2) {
    const msg2 = e2 instanceof Error ? e2.message : String(e2);
    if (msg2.includes("429") || msg2.toLowerCase().includes("quota")) {
      console.error(`[gemini] ${fallbackModel} quota/rate error:`, msg2);
      const err = new Error("quota_exceeded") as Error & { quotaExceeded: true };
      (err as unknown as Record<string, unknown>).quotaExceeded = true;
      throw err;
    }
    throw e2;
  }
}

/**
 * Generate text with automatic quota fallback:
 * tries primaryModel first; on 429/quota error falls back to fallbackModel.
 * Throws a structured error with quotaExceeded=true if both are exhausted.
 */
export async function generateTextWithFallback(
  prompt: string,
  config?: GeminiGenerationConfig,
  primaryModel = DEFAULT_TEXT_MODEL,
  fallbackModel = FALLBACK_TEXT_MODEL
): Promise<string> {
  try {
    return await generateText(prompt, primaryModel, config);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (!msg.includes("429") && !msg.toLowerCase().includes("quota")) throw e;
    console.warn(`[gemini] ${primaryModel} quota/rate error:`, msg);
  }
  try {
    return await generateText(prompt, fallbackModel, config);
  } catch (e2) {
    const msg2 = e2 instanceof Error ? e2.message : String(e2);
    if (msg2.includes("429") || msg2.toLowerCase().includes("quota")) {
      console.error(`[gemini] ${fallbackModel} quota/rate error:`, msg2);
      const err = new Error("quota_exceeded") as Error & {
        quotaExceeded: true;
      };
      (err as unknown as Record<string, unknown>).quotaExceeded = true;
      throw err;
    }
    throw e2;
  }
}
