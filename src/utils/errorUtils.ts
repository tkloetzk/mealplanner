// utils/errorUtils.ts
export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

export class AppError extends Error {
  public readonly code?: string;
  public readonly details?: unknown;

  constructor(message: string, code?: string, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.details = details;
  }
}

/**
 * Standardized error handler for API responses
 */
export async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    try {
      const errorData = await response.json();
      throw new AppError(
        errorData.error || errorData.message || `HTTP error! status: ${response.status}`,
        errorData.code || response.status.toString(),
        errorData.details
      );
    } catch (parseError) {
      if (parseError instanceof AppError) {
        throw parseError;
      }
      throw new AppError(`HTTP error! status: ${response.status}`);
    }
  }

  return response.json();
}

/**
 * Standardized error handler for async operations
 */
export function handleAsyncError(error: unknown, operation: string): never {
  if (error instanceof AppError) {
    console.error(`${operation} failed:`, error.message, error.details);
    throw error;
  }
  
  const message = error instanceof Error ? error.message : String(error);
  const appError = new AppError(`${operation} failed: ${message}`);
  console.error(`${operation} failed:`, message);
  throw appError;
}

/**
 * Safe async wrapper that handles errors consistently
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<{ success: true; data: T } | { success: false; error: AppError }> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    const appError = error instanceof AppError 
      ? error 
      : new AppError(`${operationName} failed: ${error instanceof Error ? error.message : String(error)}`);
    
    console.error(`${operationName} failed:`, appError.message);
    return { success: false, error: appError };
  }
}