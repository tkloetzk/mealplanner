import {
  getAgeGroup,
  getPediatricGuidelines,
  AgeGroup,
  PediatricNutritionGuidelines
} from '../pediatric-nutrition-guidelines';

describe('Pediatric Nutrition Guidelines', () => {
  describe('getAgeGroup', () => {
    test('returns correct age group for 1-3 year olds', () => {
      expect(getAgeGroup(1)).toBe('1-3');
      expect(getAgeGroup(2)).toBe('1-3');
      expect(getAgeGroup(3)).toBe('1-3');
    });

    test('returns correct age group for 4-8 year olds', () => {
      expect(getAgeGroup(4)).toBe('4-8');
      expect(getAgeGroup(6)).toBe('4-8');
      expect(getAgeGroup(8)).toBe('4-8');
    });

    test('returns correct age group for 9-13 year olds', () => {
      expect(getAgeGroup(9)).toBe('9-13');
      expect(getAgeGroup(11)).toBe('9-13');
      expect(getAgeGroup(13)).toBe('9-13');
    });

    test('returns correct age group for 14-18 year olds', () => {
      expect(getAgeGroup(14)).toBe('14-18');
      expect(getAgeGroup(16)).toBe('14-18');
      expect(getAgeGroup(18)).toBe('14-18');
    });

    test('throws error for ages less than 1', () => {
      expect(() => getAgeGroup(0)).toThrow('Age must be at least 1 year, got: 0');
      expect(() => getAgeGroup(-1)).toThrow('Age must be at least 1 year, got: -1');
      expect(() => getAgeGroup(0.5)).toThrow('Age must be at least 1 year, got: 0.5');
    });

    test('throws error for ages greater than 18', () => {
      expect(() => getAgeGroup(19)).toThrow('Age must be no more than 18 years, got: 19');
      expect(() => getAgeGroup(25)).toThrow('Age must be no more than 18 years, got: 25');
      expect(() => getAgeGroup(100)).toThrow('Age must be no more than 18 years, got: 100');
    });
  });

  describe('getPediatricGuidelines', () => {
    test('returns correct guidelines for 1-3 year olds', () => {
      const guidelines = getPediatricGuidelines(2);
      expect(guidelines.caloriesMin).toBe(1000);
      expect(guidelines.caloriesMax).toBe(1400);
      expect(guidelines.proteinGrams).toBe(13);
      expect(guidelines.fatPercentMin).toBe(30);
      expect(guidelines.fatPercentMax).toBe(40);
      expect(guidelines.carbsPercentMin).toBe(45);
      expect(guidelines.carbsPercentMax).toBe(65);
      expect(guidelines.sodiumMaxMg).toBe(1200);
    });

    test('returns correct guidelines for 4-8 year olds', () => {
      const guidelines = getPediatricGuidelines(6);
      expect(guidelines.caloriesMin).toBe(1200);
      expect(guidelines.caloriesMax).toBe(1600);
      expect(guidelines.proteinGrams).toBe(35);
      expect(guidelines.fatPercentMin).toBe(25);
      expect(guidelines.fatPercentMax).toBe(35);
      expect(guidelines.carbsPercentMin).toBe(45);
      expect(guidelines.carbsPercentMax).toBe(55);
      expect(guidelines.sodiumMaxMg).toBe(1500);
    });

    test('returns correct guidelines for 9-13 year olds', () => {
      const guidelines = getPediatricGuidelines(11);
      expect(guidelines.caloriesMin).toBe(1800);
      expect(guidelines.caloriesMax).toBe(2600);
      expect(guidelines.proteinGrams).toBe(34);
      expect(guidelines.fatPercentMin).toBe(25);
      expect(guidelines.fatPercentMax).toBe(35);
      expect(guidelines.carbsPercentMin).toBe(45);
      expect(guidelines.carbsPercentMax).toBe(65);
      expect(guidelines.sodiumMaxMg).toBe(1800);
    });

    test('returns correct guidelines for 14-18 year olds', () => {
      const guidelines = getPediatricGuidelines(16);
      expect(guidelines.caloriesMin).toBe(2000);
      expect(guidelines.caloriesMax).toBe(3200);
      expect(guidelines.proteinGrams).toBe(52);
      expect(guidelines.fatPercentMin).toBe(25);
      expect(guidelines.fatPercentMax).toBe(35);
      expect(guidelines.carbsPercentMin).toBe(45);
      expect(guidelines.carbsPercentMax).toBe(65);
      expect(guidelines.sodiumMaxMg).toBe(2300);
    });
  });
});