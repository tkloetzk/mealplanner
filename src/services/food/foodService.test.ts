// src/services/food/__tests__/foodService.test.ts
import { FoodsService } from "./foodService";
import { MOCK_FOODS } from "@/__mocks__/testConstants";

describe("FoodsService", () => {
  let foodsService: FoodsService;

  beforeEach(() => {
    foodsService = new FoodsService();
  });

  it("fetches all foods successfully", async () => {
    const foods = await foodsService.getAllFoods();
    expect(foods).toEqual(MOCK_FOODS);
    expect(fetch).toHaveBeenCalledWith("/api/foods");
  });
});
