import { GoogleGenerativeAI } from "@google/generative-ai";

export interface GeminiGenerationConfig {
  temperature?: number;
  topK?: number;
  topP?: number;
  maxOutputTokens?: number;
  responseSchema?: Record<string, unknown>; // JSON Schema object — constrains model output at generation time
}

const DEFAULT_TEXT_MODEL = "gemini-3.1-flash-lite-preview";

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
  modelName = DEFAULT_TEXT_MODEL
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

/** Generate text+image, throwing a structured quotaExceeded error on 429/quota errors */
export async function generateTextWithImageFallback(
  imageBase64: string,
  prompt: string,
  model = DEFAULT_TEXT_MODEL
): Promise<string> {
  try {
    return await generateTextWithImage(imageBase64, prompt, model);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("429") || msg.toLowerCase().includes("quota")) {
      console.error(`[gemini] ${model} quota/rate error:`, msg);
      const err = new Error("quota_exceeded") as Error & { quotaExceeded: true };
      (err as unknown as Record<string, unknown>).quotaExceeded = true;
      throw err;
    }
    throw e;
  }
}

/** Generate text, throwing a structured quotaExceeded error on 429/quota errors */
export async function generateTextWithFallback(
  prompt: string,
  config?: GeminiGenerationConfig,
  model = DEFAULT_TEXT_MODEL
): Promise<string> {
  try {
    return await generateText(prompt, model, config);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("429") || msg.toLowerCase().includes("quota")) {
      console.error(`[gemini] ${model} quota/rate error:`, msg);
      const err = new Error("quota_exceeded") as Error & { quotaExceeded: true };
      (err as unknown as Record<string, unknown>).quotaExceeded = true;
      throw err;
    }
    throw e;
  }
}
