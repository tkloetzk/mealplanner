// src/__mocks__/testSetup/mocks.ts
import { RANCH_OPTION } from "@/constants/meal-goals";
import { MOCK_FOODS } from "../testConstants";

export const mockHistoryData = {
  "1": [
    {
      _id: "123",
      kidId: "1",
      date: new Date().toISOString(),
      meal: "breakfast",
      selections: {
        proteins: MOCK_FOODS.proteins[0],
        fruits: null,
        vegetables: null,
        grains: null,
        milk: null,
        ranch: null,
      },
    },
  ],
};

export const setupFetchMock = () => {
  const mockFetch = jest.fn().mockImplementation((url) => {
    if (typeof url === "string") {
      if (url.includes("/api/foods")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(MOCK_FOODS),
        });
      }
      if (url.includes("/api/meal-history")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockHistoryData["1"]),
        });
      }
      // Default food data response
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            proteins: MOCK_FOODS.proteins,
            fruits: MOCK_FOODS.fruits,
            vegetables: MOCK_FOODS.vegetables,
            condiments: [RANCH_OPTION],
            other: MOCK_FOODS.other,
          }),
      });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
  }) as jest.Mock;

  global.fetch = mockFetch;
  return mockFetch;
};
