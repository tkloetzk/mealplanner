// src/__mocks__/testSetup/mocks.ts
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
            //  grains: [],
            //milk: [],
          }),
      });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
  }) as jest.Mock;

  global.fetch = mockFetch;
  return mockFetch;
};

export const setupLocalStorageMock = () => {
  let store: Record<string, string> = {};
  const localStorageMock = {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    length: 0,
    key: jest.fn(() => null),
  };

  Object.defineProperty(window, "localStorage", { value: localStorageMock });
  return localStorageMock;
};
