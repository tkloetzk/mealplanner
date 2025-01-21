import { CategoryType, Food } from "@/types/food";

export class FoodCache {
  private static instance: FoodCache;
  private cache: Record<
    string,
    {
      data: Record<CategoryType, Food[]>;
      timestamp: number;
    }
  > = {};
  private CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  public static getInstance(): FoodCache {
    if (!FoodCache.instance) {
      FoodCache.instance = new FoodCache();
    }
    return FoodCache.instance;
  }

  public get(): Record<CategoryType, Food[]> | null {
    const cachedData = this.cache["foods"];
    if (cachedData && Date.now() - cachedData.timestamp < this.CACHE_DURATION) {
      return cachedData.data;
    }
    return null;
  }

  public set(data: Record<CategoryType, Food[]>) {
    this.cache["foods"] = {
      data,
      timestamp: Date.now(),
    };
  }
}
