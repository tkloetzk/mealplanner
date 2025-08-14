import { validateNumeric } from '../validation/numericValidator';

describe('numericValidator', () => {
  describe('validateNumeric', () => {
    it('validates positive numbers', () => {
      expect(validateNumeric(5)).toEqual({ isValid: true });
      expect(validateNumeric(100.5)).toEqual({ isValid: true });
      expect(validateNumeric(0.1)).toEqual({ isValid: true });
    });

    it('validates zero when allowed', () => {
      expect(validateNumeric(0, { min: 0 })).toEqual({ isValid: true });
    });

    it('rejects negative numbers by default', () => {
      const result = validateNumeric(-5);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('must be positive');
    });

    it('validates with minimum constraint', () => {
      expect(validateNumeric(10, { min: 5 })).toEqual({ isValid: true });
      
      const result = validateNumeric(3, { min: 5 });
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('must be at least 5');
    });

    it('validates with maximum constraint', () => {
      expect(validateNumeric(8, { max: 10 })).toEqual({ isValid: true });
      
      const result = validateNumeric(15, { max: 10 });
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('must be at most 10');
    });

    it('validates with both min and max constraints', () => {
      expect(validateNumeric(7, { min: 5, max: 10 })).toEqual({ isValid: true });
      
      const lowResult = validateNumeric(3, { min: 5, max: 10 });
      expect(lowResult.isValid).toBe(false);
      expect(lowResult.error).toContain('must be between 5 and 10');
      
      const highResult = validateNumeric(15, { min: 5, max: 10 });
      expect(highResult.isValid).toBe(false);
      expect(highResult.error).toContain('must be between 5 and 10');
    });

    it('validates integer constraint', () => {
      expect(validateNumeric(5, { integer: true })).toEqual({ isValid: true });
      
      const result = validateNumeric(5.5, { integer: true });
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('must be a whole number');
    });

    it('handles string inputs', () => {
      expect(validateNumeric('5')).toEqual({ isValid: true });
      expect(validateNumeric('10.5')).toEqual({ isValid: true });
      
      const result = validateNumeric('not-a-number');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('must be a valid number');
    });

    it('handles null and undefined', () => {
      const nullResult = validateNumeric(null);
      expect(nullResult.isValid).toBe(false);
      expect(nullResult.error).toContain('is required');
      
      const undefinedResult = validateNumeric(undefined);
      expect(undefinedResult.isValid).toBe(false);
      expect(undefinedResult.error).toContain('is required');
    });

    it('allows null when not required', () => {
      expect(validateNumeric(null, { required: false })).toEqual({ isValid: true });
      expect(validateNumeric(undefined, { required: false })).toEqual({ isValid: true });
    });

    it('validates decimal places', () => {
      expect(validateNumeric(5.12, { decimalPlaces: 2 })).toEqual({ isValid: true });
      expect(validateNumeric(5.1, { decimalPlaces: 2 })).toEqual({ isValid: true });
      
      const result = validateNumeric(5.123, { decimalPlaces: 2 });
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('must have at most 2 decimal places');
    });

    it('combines multiple constraints', () => {
      const options = {
        min: 1,
        max: 100,
        integer: true,
        required: true
      };
      
      expect(validateNumeric(50, options)).toEqual({ isValid: true });
      
      const floatResult = validateNumeric(50.5, options);
      expect(floatResult.isValid).toBe(false);
      
      const lowResult = validateNumeric(0, options);
      expect(lowResult.isValid).toBe(false);
      
      const highResult = validateNumeric(101, options);
      expect(highResult.isValid).toBe(false);
    });
  });
});