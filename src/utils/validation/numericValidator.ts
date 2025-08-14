// src/utils/numericValidator.ts

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface ValidateNumericOptions {
  min?: number;
  max?: number;
  integer?: boolean;
  required?: boolean;
  decimalPlaces?: number;
}

/**
 * Validates a numeric value with various constraints
 * @param value - The value to validate
 * @param options - Validation options
 * @returns Validation result
 */
export function validateNumeric(
  value: unknown,
  options: ValidateNumericOptions = {}
): ValidationResult {
  const {
    min,
    max,
    integer = false,
    required = true,
    decimalPlaces
  } = options;

  // Handle null/undefined values
  if (value === null || value === undefined) {
    if (required) {
      return { isValid: false, error: 'Value is required' };
    }
    return { isValid: true };
  }

  // Convert to number
  const numValue = Number(value);

  // Check if it's a valid number
  if (isNaN(numValue) || !isFinite(numValue)) {
    return { isValid: false, error: 'Value must be a valid number' };
  }

  // Check if it should be positive (default behavior)
  if (min === undefined && numValue < 0) {
    return { isValid: false, error: 'Value must be positive' };
  }

  // Check minimum constraint
  if (min !== undefined && numValue < min) {
    if (max !== undefined) {
      return { isValid: false, error: `Value must be between ${min} and ${max}` };
    }
    return { isValid: false, error: `Value must be at least ${min}` };
  }

  // Check maximum constraint
  if (max !== undefined && numValue > max) {
    if (min !== undefined) {
      return { isValid: false, error: `Value must be between ${min} and ${max}` };
    }
    return { isValid: false, error: `Value must be at most ${max}` };
  }

  // Check integer constraint
  if (integer && !Number.isInteger(numValue)) {
    return { isValid: false, error: 'Value must be a whole number' };
  }

  // Check decimal places constraint
  if (decimalPlaces !== undefined) {
    const decimalString = numValue.toString();
    const decimalIndex = decimalString.indexOf('.');
    if (decimalIndex !== -1) {
      const actualDecimalPlaces = decimalString.length - decimalIndex - 1;
      if (actualDecimalPlaces > decimalPlaces) {
        return { isValid: false, error: `Value must have at most ${decimalPlaces} decimal places` };
      }
    }
  }

  return { isValid: true };
}

// Fields that should always be numeric
export const NUMERIC_FIELDS = [
  "calories",
  "protein",
  "carbs",
  "fat",
  "adjustedCalories",
  "adjustedProtein",
  "adjustedCarbs",
  "adjustedFat",
] as const;

type NumericField = (typeof NUMERIC_FIELDS)[number];

/**
 * Ensures all numeric fields in an object are actually numbers
 * @param obj Object to validate
 * @returns Same object with numeric fields converted to numbers
 */
export function ensureNumericFields<T extends Record<string, unknown>>(
  obj: T
): T {
  const result = { ...obj };

  NUMERIC_FIELDS.forEach((field) => {
    if (field in result) {
      const value = result[field];
      if (value !== undefined && value !== null) {
        result[field] = Number(value);
      }
    }
  });

  return result;
}

/**
 * Recursively ensures all numeric fields in an object and its nested objects are numbers
 * @param obj Object to validate
 * @returns Same object with all numeric fields converted to numbers
 */
export function ensureNestedNumericFields<T extends Record<string, unknown>>(
  obj: T
): T {
  const result = { ...obj };

  Object.entries(result).forEach(([key, value]) => {
    if (value && typeof value === "object") {
      // Handle arrays
      if (Array.isArray(value)) {
        result[key] = value.map((item) =>
          typeof item === "object" && item !== null
            ? ensureNestedNumericFields(item as Record<string, unknown>)
            : item
        );
      }
      // Handle nested objects
      else {
        result[key] = ensureNestedNumericFields(
          value as Record<string, unknown>
        );
      }
    }
    // Handle numeric fields at current level
    else if (NUMERIC_FIELDS.includes(key as NumericField)) {
      if (value !== undefined && value !== null) {
        result[key] = Number(value);
      }
    }
  });

  return result;
}

/**
 * Validates if a field that should be numeric actually contains a valid number
 * @param value Value to check
 * @param fieldName Name of the field being checked
 * @returns True if the field is a valid number
 */
export function isValidNumericField(
  value: unknown,
  fieldName: string
): boolean {
  if (!NUMERIC_FIELDS.includes(fieldName as NumericField)) {
    return true; // Not a numeric field, so validation passes
  }

  if (value === undefined || value === null) {
    return true; // Allow null/undefined values
  }

  const num = Number(value);
  return !isNaN(num) && isFinite(num);
}

/**
 * Type guard to check if an object has all required numeric fields as numbers
 * @param obj Object to check
 * @returns True if all numeric fields are valid numbers
 */
export function hasValidNumericFields(obj: Record<string, unknown>): boolean {
  return NUMERIC_FIELDS.every((field) => {
    if (field in obj) {
      return isValidNumericField(obj[field], field);
    }
    return true;
  });
}
