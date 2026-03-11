import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { newShipmentSchema, proNumberSchema, shipmentSchema, type NewShipmentInput } from "./schemas";

function validInput(overrides: Partial<NewShipmentInput> = {}): NewShipmentInput {
  return {
    reference: "PO-88213",
    origin: {
      name: "Delta Cold Storage",
      street1: "4120 Lamar Ave",
      city: "Memphis",
      state: "TN",
      postal_code: "38118",
      country: "US",
    },
    destination: {
      name: "Rickenbacker DC 3",
      street1: "2700 Port Rd",
      city: "Columbus",
      state: "OH",
      postal_code: "43217",
      country: "US",
    },
    pickup_date: "2026-11-24",
    weight_lbs: 8200,
    pieces: 6,
    freight_class: "70",
    hazmat: false,
    special_instructions: "",
    ...overrides,
  };
}

describe("newShipmentSchema", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-20T15:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("accepts a complete LTL tender", () => {
    expect(newShipmentSchema.safeParse(validInput()).success).toBe(true);
  });

  it("uppercases state codes", () => {
    const input = validInput();
    input.origin.state = "tn";
    const parsed = newShipmentSchema.parse(input);
    expect(parsed.origin.state).toBe("TN");
  });

  it("rejects pickup dates in the past", () => {
    const result = newShipmentSchema.safeParse(validInput({ pickup_date: "2026-11-19" }));
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["pickup_date"]);
  });

  it("accepts a same-day pickup", () => {
    expect(newShipmentSchema.safeParse(validInput({ pickup_date: "2026-11-20" })).success).toBe(true);
  });

  it("caps LTL weight at 48,000 lb", () => {
    const result = newShipmentSchema.safeParse(validInput({ weight_lbs: 48_001 }));
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toMatch(/48,000/);
  });

  it("validates ZIP codes for US stops and postal codes for Canadian stops", () => {
    const badZip = validInput();
    badZip.destination.postal_code = "4321";
    const result = newShipmentSchema.safeParse(badZip);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["destination", "postal_code"]);

    const canada = validInput();
    canada.destination = { ...canada.destination, city: "Mississauga", state: "ON", postal_code: "L5T 2N7", country: "CA" };
    expect(newShipmentSchema.safeParse(canada).success).toBe(true);
  });

  it("rejects freight classes outside the NMFC list", () => {
    const result = newShipmentSchema.safeParse({ ...validInput(), freight_class: "80" });
    expect(result.success).toBe(false);
  });
});

describe("proNumberSchema", () => {
  it("strips separators and uppercases", () => {
    expect(proNumberSchema.parse(" 482-001-9375 ")).toBe("4820019375");
    expect(proNumberSchema.parse("kfx77120a")).toBe("KFX77120A");
  });

  it("rejects values that can't be PROs", () => {
    expect(proNumberSchema.safeParse("123").success).toBe(false);
    expect(proNumberSchema.safeParse("../../admin").success).toBe(false);
  });
});

describe("shipmentSchema", () => {
  it("rejects statuses shipment-api doesn't define", () => {
    const result = shipmentSchema.shape.status.safeParse("lost");
    expect(result.success).toBe(false);
  });
});
