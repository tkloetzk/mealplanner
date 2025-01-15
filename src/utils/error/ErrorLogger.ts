import { MealPlannerError } from "./MealPlanError";

export class ErrorLogger {
  private static instance: ErrorLogger;

  private constructor() {}

  public static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  log(error: Error | MealPlannerError) {
    console.error(
      `[${new Date().toISOString()}] ${error.name}: ${error.message}`
    );

    // Optional: Send to error tracking service
    this.reportToErrorTracking(error);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private reportToErrorTracking(error: Error | MealPlannerError) {
    // Implement integration with error tracking service like Sentry
    // This is a placeholder for actual error tracking
    if (process.env.NODE_ENV === "production") {
      // Example: Sentry.captureException(error);
    }
  }
}
