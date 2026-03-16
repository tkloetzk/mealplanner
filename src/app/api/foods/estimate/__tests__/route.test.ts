// src/app/api/foods/estimate/__tests__/route.test.ts
import { POST } from "../route";

// Mock GoogleGenerativeAI
jest.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: () =>
            JSON.stringify({
              name: "Grilled Chicken Breast",
              calories: 200,
              protein: 31,
              carbs: 0,
              fat: 8,
              fiber: 0,
              sugar: 0,
              sodium: 70,
              saturatedFat: 2,
              servingSize: "170",
              servingSizeUnit: "g",
              category: "proteins",
            }),
        },
      }),
    }),
  })),
}));

describe("POST /api/foods/estimate", () => {
  beforeEach(() => {
    process.env.GEMINI_API_KEY = "test-key";
  });

  afterEach(() => {
    delete process.env.GEMINI_API_KEY;
  });

  it("returns a normalized AI estimate for a valid food name", async () => {
    const request = new Request("http://localhost/api/foods/estimate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "grilled chicken breast" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.source).toBe("ai");
    expect(data.confidence).toBe("estimated");
    expect(data.name).toBe("Grilled Chicken Breast");
    expect(data.nutrition).toEqual(
      expect.objectContaining({
        calories: 200,
        protein: 31,
        fat: 8,
      })
    );
    expect(data.category).toBe("proteins");
    expect(data.servingSizeUnit).toBe("g");
  });

  it("returns 400 for empty food name", async () => {
    const request = new Request("http://localhost/api/foods/estimate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("returns 400 for missing food name", async () => {
    const request = new Request("http://localhost/api/foods/estimate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("returns 503 when GEMINI_API_KEY is not set", async () => {
    delete process.env.GEMINI_API_KEY;

    const request = new Request("http://localhost/api/foods/estimate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "banana" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(503);
  });
});
