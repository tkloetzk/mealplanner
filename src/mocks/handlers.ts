import { http, HttpResponse } from "msw";
import { MealHistoryRecord } from "@/types/meals";

export const handlers = [
  http.get("/api/meal-history", async ({ request }) => {
    const url = new URL(request.url);
    const kidId = url.searchParams.get("kidId");

    if (!kidId) {
      return HttpResponse.json(
        { error: "Kid ID is required" },
        { status: 400 }
      );
    }

    // Mock successful response
    const mockData: MealHistoryRecord[] = [
      // Add your mock data here as needed for different test scenarios
    ];

    return HttpResponse.json(mockData);
  }),

  // Add more handlers for other API endpoints as needed
];
