import {
  AppError,
  handleApiResponse,
  handleAsyncError,
  safeAsync,
} from "../errorUtils";

describe("errorUtils", () => {
  describe("AppError", () => {
    it("creates error with message only", () => {
      const error = new AppError("Test error");
      expect(error.message).toBe("Test error");
      expect(error.name).toBe("AppError");
      expect(error.code).toBeUndefined();
      expect(error.details).toBeUndefined();
    });

    it("creates error with message and code", () => {
      const error = new AppError("Test error", "TEST_CODE");
      expect(error.message).toBe("Test error");
      expect(error.code).toBe("TEST_CODE");
      expect(error.details).toBeUndefined();
    });

    it("creates error with message, code, and details", () => {
      const details = { field: "username", value: "invalid" };
      const error = new AppError("Test error", "VALIDATION_ERROR", details);
      expect(error.message).toBe("Test error");
      expect(error.code).toBe("VALIDATION_ERROR");
      expect(error.details).toEqual(details);
    });
  });

  describe("handleApiResponse", () => {
    it("returns parsed JSON for successful response", async () => {
      const mockData = { id: 1, name: "Test" };
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockData),
      } as unknown as Response;

      const result = await handleApiResponse(mockResponse);
      expect(result).toEqual(mockData);
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it("throws AppError for unsuccessful response with JSON error", async () => {
      const mockErrorData = {
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details: { field: "email" },
      };
      const mockResponse = {
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue(mockErrorData),
      } as unknown as Response;

      await expect(handleApiResponse(mockResponse)).rejects.toThrow(AppError);

      try {
        await handleApiResponse(mockResponse);
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        const appError = error as AppError;
        expect(appError.message).toBe("Validation failed");
        expect(appError.code).toBe("VALIDATION_ERROR");
        expect(appError.details).toEqual({ field: "email" });
      }
    });

    it("throws AppError for unsuccessful response without JSON error", async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        json: jest.fn().mockRejectedValue(new Error("Not JSON")),
      } as unknown as Response;

      await expect(handleApiResponse(mockResponse)).rejects.toThrow(AppError);

      try {
        await handleApiResponse(mockResponse);
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        const appError = error as AppError;
        expect(appError.message).toBe("HTTP error! status: 500");
      }
    });

    it("uses message field if error field is not present", async () => {
      const mockErrorData = { message: "Server error" };
      const mockResponse = {
        ok: false,
        status: 500,
        json: jest.fn().mockResolvedValue(mockErrorData),
      } as unknown as Response;

      try {
        await handleApiResponse(mockResponse);
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        const appError = error as AppError;
        expect(appError.message).toBe("Server error");
      }
    });
  });

  describe("handleAsyncError", () => {
    const originalConsoleError = console.error;
    beforeEach(() => {
      console.error = jest.fn();
    });

    afterEach(() => {
      console.error = originalConsoleError;
    });

    it("re-throws AppError with logging", () => {
      const appError = new AppError("Test error", "TEST_CODE");

      expect(() => {
        handleAsyncError(appError, "test operation");
      }).toThrow(appError);

      expect(console.error).toHaveBeenCalledWith(
        "test operation failed:",
        "Test error",
        undefined
      );
    });

    it("wraps regular Error in AppError", () => {
      const regularError = new Error("Regular error");

      expect(() => {
        handleAsyncError(regularError, "test operation");
      }).toThrow(AppError);

      expect(console.error).toHaveBeenCalledWith(
        "test operation failed:",
        "Regular error"
      );
    });

    it("wraps non-Error values in AppError", () => {
      const stringError = "String error";

      expect(() => {
        handleAsyncError(stringError, "test operation");
      }).toThrow(AppError);

      expect(console.error).toHaveBeenCalledWith(
        "test operation failed:",
        "String error"
      );
    });
  });

  describe("safeAsync", () => {
    const originalConsoleError = console.error;
    beforeEach(() => {
      console.error = jest.fn();
    });

    afterEach(() => {
      console.error = originalConsoleError;
    });

    it("returns success result for successful operation", async () => {
      const mockData = { id: 1, name: "Test" };
      const operation = jest.fn().mockResolvedValue(mockData);

      const result = await safeAsync(operation, "test operation");

      expect(result).toEqual({ success: true, data: mockData });
      expect(operation).toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
    });

    it("returns error result for failed operation with AppError", async () => {
      const appError = new AppError("Test error", "TEST_CODE");
      const operation = jest.fn().mockRejectedValue(appError);

      const result = await safeAsync(operation, "test operation");

      expect(result).toEqual({ success: false, error: appError });
      expect(operation).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith(
        "test operation failed:",
        "Test error"
      );
    });

    it("returns error result for failed operation with regular Error", async () => {
      const regularError = new Error("Regular error");
      const operation = jest.fn().mockRejectedValue(regularError);

      const result = await safeAsync(operation, "test operation");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(AppError);
        expect(result.error.message).toBe(
          "test operation failed: Regular error"
        );
      }
      expect(operation).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });

    it("returns error result for failed operation with non-Error value", async () => {
      const stringError = "String error";
      const operation = jest.fn().mockRejectedValue(stringError);

      const result = await safeAsync(operation, "test operation");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(AppError);
        expect(result.error.message).toBe(
          "test operation failed: String error"
        );
      }
      expect(operation).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });
  });
});
