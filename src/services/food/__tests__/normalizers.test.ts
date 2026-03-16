// src/services/food/__tests__/normalizers.test.ts
import { ObjectId } from "mongodb";
import {
  normalizeLocalFood,
  normalizeOFFProduct,
  normalizeSpoonacularResult,
  normalizeAIEstimate,
  searchResultToPartialFood,
} from "../normalizers";
import type { OFFSearchProduct } from "../normalizers";

describe("normalizers", () => {
  describe("normalizeLocalFood", () => {
    it("maps a MongoDB food document to FoodSearchResult", () => {
      const objectId = new ObjectId();
      const doc = {
        _id: objectId,
        name: "Grilled Chicken",
        calories: 200,
        protein: 30,
        carbs: 0,
        fat: 8,
        category: "proteins" as const,
        meal: ["lunch" as const, "dinner" as const],
        servings: 1,
        servingSize: "170",
        servingSizeUnit: "g" as const,
        cloudinaryUrl: "https://cdn.example.com/chicken.jpg",
        upc: "123456789",
        sodium: 400,
        fiber: 0,
      };

      const result = normalizeLocalFood(doc);

      expect(result.id).toBe(objectId.toString());
      expect(result.source).toBe("local");
      expect(result.name).toBe("Grilled Chicken");
      expect(result.confidence).toBe("exact");
      expect(result.nutrition).toEqual(
        expect.objectContaining({
          calories: 200,
          protein: 30,
          carbs: 0,
          fat: 8,
          sodium: 400,
          fiber: 0,
        })
      );
      expect(result.image).toBe("https://cdn.example.com/chicken.jpg");
      expect(result.upc).toBe("123456789");
    });

    it("falls back to imageUrl when cloudinaryUrl is missing", () => {
      const objectId = new ObjectId();
      const doc = {
        _id: objectId,
        name: "Rice",
        calories: 200,
        protein: 4,
        carbs: 45,
        fat: 1,
        category: "grains" as const,
        meal: ["lunch" as const],
        servings: 1,
        imageUrl: "https://example.com/rice.jpg",
      };

      const result = normalizeLocalFood(doc);
      expect(result.image).toBe("https://example.com/rice.jpg");
    });
  });

  describe("normalizeOFFProduct", () => {
    const baseProduct: OFFSearchProduct = {
      code: "3017624010701",
      product_name: "Nutella",
      image_front_thumb_url: "https://off.example.com/thumb.jpg",
      nutriments: {
        "energy-kcal_serving": 200,
        proteins_serving: 2,
        carbohydrates_serving: 22,
        fat_serving: 11,
        "saturated-fat_serving": 4,
        sugars_serving: 21,
        sodium_serving: 0.01,
        fiber_serving: 1,
        "energy-kcal_100g": 539,
        proteins_100g: 6.3,
        carbohydrates_100g: 57.5,
        fat_100g: 30.9,
      },
      serving_quantity: "37",
      serving_quantity_unit: "g",
      ingredients_text: "Sugar, palm oil, hazelnuts",
      additives_tags: ["en:e322"],
      nova_group: 4,
    };

    it("normalizes a product with serving-level nutrition", () => {
      const result = normalizeOFFProduct(baseProduct);

      expect(result.id).toBe("3017624010701");
      expect(result.source).toBe("openfoodfacts");
      expect(result.name).toBe("Nutella");
      expect(result.confidence).toBe("exact");
      expect(result.nutrition).toEqual(
        expect.objectContaining({
          calories: 200,
          protein: 2,
          carbs: 22,
          fat: 11,
        })
      );
      expect(result.upc).toBe("3017624010701");
      expect(result.ingredients).toBe("Sugar, palm oil, hazelnuts");
    });

    it("builds servingSizes with correct gram conversion", () => {
      const result = normalizeOFFProduct(baseProduct);

      expect(result.servingSizes).toHaveLength(1);
      expect(result.servingSizes![0]).toEqual({
        id: "37-g",
        label: "37 g",
        amount: 37,
        unit: "g",
        gramsEquivalent: 37,
      });
    });

    it("builds per-100g base nutrition", () => {
      const result = normalizeOFFProduct(baseProduct);

      expect(result.baseNutritionPer100g).toEqual(
        expect.objectContaining({
          calories: 539,
          protein: 6.3,
          carbs: 57.5,
          fat: 30.9,
        })
      );
    });

    it("handles missing nutriments gracefully", () => {
      const noNutrition: OFFSearchProduct = {
        code: "000",
        product_name: "Mystery Food",
      };

      const result = normalizeOFFProduct(noNutrition);

      expect(result.nutrition).toBeNull();
      expect(result.confidence).toBe("estimated");
      expect(result.name).toBe("Mystery Food");
    });

    it("handles missing product_name", () => {
      const noName: OFFSearchProduct = { code: "111" };
      const result = normalizeOFFProduct(noName);
      expect(result.name).toBe("Unknown Product");
    });

    it("parses ingredients with percent estimates", () => {
      const product: OFFSearchProduct = {
        code: "222",
        product_name: "Bread",
        ingredients: [
          { percent_estimate: 60, text: "wheat flour" },
          { percent_estimate: 30, text: "water" },
        ],
        ingredients_percent_analysis: 0,
      };

      const result = normalizeOFFProduct(product);
      expect(result.ingredientText).toEqual([
        "60% of wheat flour",
        "30% of water",
      ]);
    });

    it("falls back to ingredients_hierarchy when percent_analysis is -1", () => {
      const product: OFFSearchProduct = {
        code: "333",
        product_name: "Juice",
        ingredients_percent_analysis: -1,
        ingredients_hierarchy: ["en:orange-juice", "en:citric-acid"],
      };

      const result = normalizeOFFProduct(product);
      expect(result.ingredientText).toEqual(["orange juice", "citric acid"]);
    });
  });

  describe("normalizeSpoonacularResult", () => {
    it("creates a lightweight result with null nutrition", () => {
      const result = normalizeSpoonacularResult({
        id: 4421,
        title: "Tyson Chicken Breast",
        image: "https://spoon.example.com/chicken.jpg",
      });

      expect(result.id).toBe("sp-4421");
      expect(result.source).toBe("spoonacular");
      expect(result.name).toBe("Tyson Chicken Breast");
      expect(result.nutrition).toBeNull();
      expect(result.confidence).toBe("exact");
    });
  });

  describe("normalizeAIEstimate", () => {
    it("normalizes a valid AI response", () => {
      const result = normalizeAIEstimate({
        name: "Grilled Salmon",
        calories: 350,
        protein: 34,
        carbs: 0,
        fat: 22,
        fiber: 0,
        sodium: 60,
        servingSize: "170",
        servingSizeUnit: "g",
        category: "proteins",
      });

      expect(result.source).toBe("ai");
      expect(result.confidence).toBe("estimated");
      expect(result.name).toBe("Grilled Salmon");
      expect(result.category).toBe("proteins");
      expect(result.nutrition).toEqual(
        expect.objectContaining({
          calories: 350,
          protein: 34,
          carbs: 0,
          fat: 22,
        })
      );
    });

    it("defaults unknown categories to 'other'", () => {
      const result = normalizeAIEstimate({
        name: "Smoothie",
        calories: 150,
        protein: 5,
        carbs: 30,
        fat: 2,
        servingSize: "1",
        servingSizeUnit: "cup",
        category: "beverages", // not in our CategoryType
      });

      expect(result.category).toBe("other");
    });

    it("defaults unknown serving units to 'g'", () => {
      const result = normalizeAIEstimate({
        name: "Steak",
        calories: 400,
        protein: 40,
        carbs: 0,
        fat: 25,
        servingSize: "8",
        servingSizeUnit: "ounces", // not in our valid set
        category: "proteins",
      });

      expect(result.servingSizeUnit).toBe("g");
    });
  });

  describe("searchResultToPartialFood", () => {
    it("converts a FoodSearchResult to a Partial<Food> for FoodEditor", () => {
      const result = normalizeAIEstimate({
        name: "Banana",
        calories: 105,
        protein: 1,
        carbs: 27,
        fat: 0,
        fiber: 3,
        servingSize: "1",
        servingSizeUnit: "piece",
        category: "fruits",
      });

      const food = searchResultToPartialFood(result);

      expect(food.name).toBe("Banana");
      expect(food.calories).toBe(105);
      expect(food.protein).toBe(1);
      expect(food.carbs).toBe(27);
      expect(food.fat).toBe(0);
      expect(food.fiber).toBe(3);
      expect(food.category).toBe("fruits");
      expect(food.servingSizeUnit).toBe("piece");
      expect(food.meal).toEqual(["breakfast", "lunch", "dinner"]);
    });

    it("defaults to zero/other when nutrition or category is missing", () => {
      const food = searchResultToPartialFood({
        id: "sp-1",
        source: "spoonacular",
        name: "Something",
        nutrition: null,
        confidence: "exact",
      });

      expect(food.calories).toBe(0);
      expect(food.protein).toBe(0);
      expect(food.category).toBe("other");
      expect(food.servingSizeUnit).toBe("g");
    });
  });
});
