// src/services/spoonacular/__tests__/spoonacularService.test.ts
import { searchFoodProducts, getProductDetails } from "../spoonacularService";

describe("Spoonacular Service", () => {
  const MOCK_API_KEY = "test-api-key";

  beforeEach(() => {
    global.fetch = jest.fn();
    process.env.SPOONACULAR_API_KEY = MOCK_API_KEY;
  });

  afterEach(() => {
    jest.resetAllMocks();
    delete process.env.SPOONACULAR_API_KEY;
  });

  it("searches food products with correct parameters", async () => {
    const mockResponse = {
      products: [
        { id: 1, title: "Test Food", image: "test.jpg", imageType: "jpg" },
      ],
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await searchFoodProducts("test");

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/food/products/search"),
      expect.objectContaining({
        headers: expect.objectContaining({
          "X-RapidAPI-Key": MOCK_API_KEY,
          "X-RapidAPI-Host":
            "spoonacular-recipe-food-nutrition-v1.p.rapidapi.com",
        }),
      })
    );
    expect(result).toEqual(mockResponse);
  });

  it("throws error when API key is not configured", async () => {
    delete process.env.SPOONACULAR_API_KEY;

    await expect(searchFoodProducts("test")).rejects.toThrow(
      "Spoonacular API key is not configured"
    );
  });

  it("gets product details with correct ID", async () => {
    const mockResponse = {
      id: 1,
      title: "Test Food",
      upc: "123456789",
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await getProductDetails(1);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/food/products/1"),
      expect.objectContaining({
        headers: expect.objectContaining({
          "X-RapidAPI-Key": MOCK_API_KEY,
          "X-RapidAPI-Host":
            "spoonacular-recipe-food-nutrition-v1.p.rapidapi.com",
        }),
      })
    );
    expect(result).toEqual(mockResponse);
  });

  it("handles API errors appropriately", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
    });

    await expect(searchFoodProducts("test")).rejects.toThrow(
      "Failed to search food products"
    );
  });
});
