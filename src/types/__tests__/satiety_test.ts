import { computeSatietyDuration, formatDuration } from "@/types/shared";

describe("computeSatietyDuration", () => {
  it("returns duration in minutes between two valid ISO timestamps", () => {
    const mealTime = "2026-03-15T12:00:00.000Z";
    const hungryAgainAt = "2026-03-15T13:30:00.000Z";
    expect(computeSatietyDuration(mealTime, hungryAgainAt)).toBe(90);
  });

  it("returns undefined when mealTime is missing", () => {
    expect(computeSatietyDuration(undefined, "2026-03-15T13:30:00.000Z")).toBeUndefined();
  });

  it("returns undefined when hungryAgainAt is missing", () => {
    expect(computeSatietyDuration("2026-03-15T12:00:00.000Z", undefined)).toBeUndefined();
  });

  it("returns undefined when hungryAgainAt is before mealTime", () => {
    expect(
      computeSatietyDuration("2026-03-15T14:00:00.000Z", "2026-03-15T13:00:00.000Z"),
    ).toBeUndefined();
  });

  it("returns undefined when hungryAgainAt equals mealTime", () => {
    const same = "2026-03-15T12:00:00.000Z";
    expect(computeSatietyDuration(same, same)).toBeUndefined();
  });

  it("rounds to the nearest minute", () => {
    // 45.5 minutes → rounds to 46
    const mealTime = "2026-03-15T12:00:00.000Z";
    const hungryAgainAt = "2026-03-15T12:45:30.000Z";
    expect(computeSatietyDuration(mealTime, hungryAgainAt)).toBe(46);
  });
});

describe("formatDuration", () => {
  it("formats minutes only when under an hour", () => {
    expect(formatDuration(45)).toBe("45m");
  });

  it("formats hours only when evenly divisible", () => {
    expect(formatDuration(120)).toBe("2h");
  });

  it("formats hours and minutes", () => {
    expect(formatDuration(90)).toBe("1h 30m");
  });

  it("returns empty string for undefined", () => {
    expect(formatDuration(undefined)).toBe("");
  });

  it("returns empty string for zero", () => {
    expect(formatDuration(0)).toBe("");
  });

  it("returns empty string for negative values", () => {
    expect(formatDuration(-10)).toBe("");
  });
});
