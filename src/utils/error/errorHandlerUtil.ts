import { ErrorLogger } from "./ErrorLogger";
import { MealPlannerError } from "./MealPlanError";

// Error handling utilities
export function handleApiError(error: unknown): MealPlannerError {
  const logger = ErrorLogger.getInstance();

  if (error instanceof MealPlannerError) {
    logger.log(error);
    return error;
  }

  if (error instanceof Error) {
    const apiError = new MealPlannerError(error.message, {
      code: "API_ERROR",
      isOperational: false,
    });
    logger.log(apiError);
    return apiError;
  }

  const unknownError = new MealPlannerError("An unexpected error occurred", {
    code: "UNKNOWN_ERROR",
    isOperational: false,
  });
  logger.log(unknownError);
  return unknownError;
}
