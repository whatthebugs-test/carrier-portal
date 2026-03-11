import { describe, expect, it } from "vitest";
import {
  formatCurrency,
  formatDate,
  formatLane,
  formatPercent,
  formatProNumber,
  formatStop,
  formatWeight,
  statusLabel,
} from "./format";

describe("formatWeight", () => {
  it("groups thousands and appends the unit", () => {
    expect(formatWeight(12400)).toBe("12,400 lb");
  });

  it("rounds fractional pounds", () => {
    expect(formatWeight(1999.6)).toBe("2,000 lb");
  });

  it("renders a dash for missing values", () => {
    expect(formatWeight(null)).toBe("—");
    expect(formatWeight(Number.NaN)).toBe("—");
  });
});

describe("formatCurrency", () => {
  it("converts cents to dollars", () => {
    expect(formatCurrency(184_250)).toBe("$1,842.50");
    expect(formatCurrency(0)).toBe("$0.00");
  });

  it("renders a dash when the rate is not set yet", () => {
    expect(formatCurrency(null)).toBe("—");
  });
});

describe("formatPercent", () => {
  it("keeps one decimal", () => {
    expect(formatPercent(0.9634)).toBe("96.3%");
    expect(formatPercent(null)).toBe("—");
  });
});

describe("formatProNumber", () => {
  it("formats 10-digit PROs as 3-3-4", () => {
    expect(formatProNumber("4820019375")).toBe("482-001-9375");
  });

  it("normalises spacing and dashes before formatting", () => {
    expect(formatProNumber("482 001-9375")).toBe("482-001-9375");
  });

  it("leaves alphanumeric PROs as issued, uppercased", () => {
    expect(formatProNumber("kfx77120a")).toBe("KFX77120A");
  });
});

describe("stops and lanes", () => {
  const memphis = { city: "Memphis", state: "TN", postal_code: "38118" };
  const columbus = { city: "Columbus", state: "OH", postal_code: "43217" };

  it("formats a stop as city, state ZIP", () => {
    expect(formatStop(memphis)).toBe("Memphis, TN 38118");
  });

  it("formats a lane origin to destination", () => {
    expect(formatLane(memphis, columbus)).toBe("Memphis, TN → Columbus, OH");
  });
});

describe("formatDate", () => {
  it("formats ISO dates without shifting the day", () => {
    expect(formatDate("2026-11-18")).toBe("Nov 18, 2026");
  });

  it("renders a dash for empty or invalid input", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate("not-a-date")).toBe("—");
  });
});

describe("statusLabel", () => {
  it("has a human label for every status", () => {
    expect(statusLabel("out_for_delivery")).toBe("Out for delivery");
    expect(statusLabel("picked_up")).toBe("Picked up");
  });
});
