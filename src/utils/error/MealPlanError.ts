export class MealPlannerError extends Error {
  public readonly isOperational: boolean;
  public readonly code?: string;

  constructor(
    message: string,
    options: {
      code?: string;
      isOperational?: boolean;
    } = {}
  ) {
    super(message);
    this.name = "MealPlannerError";
    this.isOperational = options.isOperational ?? true;
    this.code = options.code;
  }
}
