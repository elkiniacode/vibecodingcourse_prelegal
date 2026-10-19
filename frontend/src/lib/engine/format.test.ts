import { describe, expect, it } from "vitest";
import { formatCount, formatLongDate, toIsoDate } from "./format";

describe("formatLongDate", () => {
  it("formats an ISO date in long US form", () => {
    expect(formatLongDate("2026-10-18")).toBe("October 18, 2026");
    expect(formatLongDate("2027-01-01")).toBe("January 1, 2027");
  });

  it.each(["", "2026-2-1", "2026-02-30", "2026-13-01", "0099-01-01", "not a date"])(
    "rejects %j",
    (value) => {
      expect(formatLongDate(value)).toBeNull();
    },
  );
});

describe("toIsoDate", () => {
  it("uses the local calendar date, even late in the evening", () => {
    expect(toIsoDate(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });
});

describe("formatCount", () => {
  const years = { singular: "year", plural: "years" };

  it("pairs a whole number with the right form of its unit", () => {
    expect(formatCount("1", years)).toBe("1 year");
    expect(formatCount("3", years)).toBe("3 years");
    expect(formatCount("3")).toBe("3");
  });

  it.each(["0", "-1", "1.5", "01", "abc", ""])("rejects %j", (value) => {
    expect(formatCount(value, years)).toBeNull();
  });
});
