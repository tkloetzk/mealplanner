import {
  getAgeGroup,
  getPediatricGuidelines,
  AgeGroup,
  PediatricNutritionGuidelines,
} from "../pediatric-nutrition-guidelines";

describe("Pediatric Nutrition Guidelines", () => {
  describe("getAgeGroup", () => {
    test("returns correct age group for 1-3 year olds", () => {
      expect(getAgeGroup(1)).toBe("1-3");
      expect(getAgeGroup(2)).toBe("1-3");
      expect(getAgeGroup(3)).toBe("1-3");
    });

    test("returns correct age group for 4-8 year olds", () => {
      expect(getAgeGroup(4)).toBe("4-8");
      expect(getAgeGroup(6)).toBe("4-8");
      expect(getAgeGroup(8)).toBe("4-8");
    });

    test("returns correct age group for 9-13 year olds", () => {
      expect(getAgeGroup(9)).toBe("9-13");
      expect(getAgeGroup(11)).toBe("9-13");
      expect(getAgeGroup(13)).toBe("9-13");
    });

    test("returns correct age group for 14-18 year olds", () => {
      expect(getAgeGroup(14)).toBe("14-18");
      expect(getAgeGroup(16)).toBe("14-18");
      expect(getAgeGroup(18)).toBe("14-18");
    });

    test("throws error for ages less than 1", () => {
      expect(() => getAgeGroup(0)).toThrow(
        "Age must be at least 1 year, got: 0",
      );
      expect(() => getAgeGroup(-1)).toThrow(
        "Age must be at least 1 year, got: -1",
      );
      expect(() => getAgeGroup(0.5)).toThrow(
        "Age must be at least 1 year, got: 0.5",
      );
    });

    test("throws error for ages greater than 18", () => {
      expect(() => getAgeGroup(19)).toThrow(
        "Age must be no more than 18 years, got: 19",
      );
      expect(() => getAgeGroup(25)).toThrow(
        "Age must be no more than 18 years, got: 25",
      );
      expect(() => getAgeGroup(100)).toThrow(
        "Age must be no more than 18 years, got: 100",
      );
    });
  });

  describe("getPediatricGuidelines", () => {
    test("returns correct guidelines for 1-3 year olds", () => {
      const guidelines = getPediatricGuidelines(2);
      expect(guidelines.caloriesMin).toBe(1000);
      expect(guidelines.caloriesMax).toBe(1400);
      expect(guidelines.proteinGrams).toBe(13);
      expect(guidelines.fatPercentMin).toBe(30);
      expect(guidelines.fatPercentMax).toBe(40);
      expect(guidelines.carbsPercentMin).toBe(45);
      expect(guidelines.carbsPercentMax).toBe(65);
      expect(guidelines.sodiumMaxMg).toBe(1200);
      expect(guidelines.sugarMaxG).toBe(25);
      expect(guidelines.saturatedFatMaxG).toBe(10);
    });

    test("returns correct guidelines for 4-8 year olds", () => {
      const guidelines = getPediatricGuidelines(6);
      expect(guidelines.caloriesMin).toBe(1200);
      expect(guidelines.caloriesMax).toBe(1600);
      expect(guidelines.proteinGrams).toBe(19); // IOM RDA (was incorrectly 35)
      expect(guidelines.fatPercentMin).toBe(25);
      expect(guidelines.fatPercentMax).toBe(35);
      expect(guidelines.carbsPercentMin).toBe(45);
      expect(guidelines.carbsPercentMax).toBe(65); // AMDR standard (was incorrectly 55)
      expect(guidelines.sodiumMaxMg).toBe(1500);
      expect(guidelines.sugarMaxG).toBe(25);
      expect(guidelines.saturatedFatMaxG).toBe(12);
    });

    test("returns correct guidelines for 9-13 year olds", () => {
      const guidelines = getPediatricGuidelines(11);
      expect(guidelines.caloriesMin).toBe(1800);
      expect(guidelines.caloriesMax).toBe(2600);
      expect(guidelines.proteinGrams).toBe(34);
      expect(guidelines.fatPercentMin).toBe(25);
      expect(guidelines.fatPercentMax).toBe(35);
      expect(guidelines.carbsPercentMin).toBe(45);
      expect(guidelines.carbsPercentMax).toBe(65);
      expect(guidelines.sodiumMaxMg).toBe(1800);
      expect(guidelines.sugarMaxG).toBe(25);
      expect(guidelines.saturatedFatMaxG).toBe(15);
    });

    test("returns correct guidelines for 14-18 year olds", () => {
      const guidelines = getPediatricGuidelines(16);
      expect(guidelines.caloriesMin).toBe(2000);
      expect(guidelines.caloriesMax).toBe(3200);
      expect(guidelines.proteinGrams).toBe(52);
      expect(guidelines.fatPercentMin).toBe(25);
      expect(guidelines.fatPercentMax).toBe(35);
      expect(guidelines.carbsPercentMin).toBe(45);
      expect(guidelines.carbsPercentMax).toBe(65);
      expect(guidelines.sodiumMaxMg).toBe(2300);
      expect(guidelines.sugarMaxG).toBe(25); // AHA uniform limit (was incorrectly 36)
      expect(guidelines.saturatedFatMaxG).toBe(20);
    });

    test("sugar limit is uniform 25g across all age groups per AHA", () => {
      const ageGroups: [number, string][] = [
        [2, "1-3"],
        [6, "4-8"],
        [11, "9-13"],
        [16, "14-18"],
      ];
      for (const [age] of ageGroups) {
        const guidelines = getPediatricGuidelines(age);
        expect(guidelines.sugarMaxG).toBe(25);
      }
    });

    test("protein RDAs match IOM DRI values", () => {
      expect(getPediatricGuidelines(2).proteinGrams).toBe(13); // 1-3
      expect(getPediatricGuidelines(6).proteinGrams).toBe(19); // 4-8
      expect(getPediatricGuidelines(11).proteinGrams).toBe(34); // 9-13
      expect(getPediatricGuidelines(16).proteinGrams).toBe(52); // 14-18
    });

    test("carbs AMDR upper bound is 65% for all age groups", () => {
      // Ages 1-3 have wider fat range (30-40%) but same carbs AMDR
      expect(getPediatricGuidelines(2).carbsPercentMax).toBe(65);
      expect(getPediatricGuidelines(6).carbsPercentMax).toBe(65);
      expect(getPediatricGuidelines(11).carbsPercentMax).toBe(65);
      expect(getPediatricGuidelines(16).carbsPercentMax).toBe(65);
    });

    test("sodium limits follow NASEM 2019 CDRR progression", () => {
      expect(getPediatricGuidelines(2).sodiumMaxMg).toBe(1200); // 1-3
      expect(getPediatricGuidelines(6).sodiumMaxMg).toBe(1500); // 4-8
      expect(getPediatricGuidelines(11).sodiumMaxMg).toBe(1800); // 9-13
      expect(getPediatricGuidelines(16).sodiumMaxMg).toBe(2300); // 14-18
    });
  });
});
