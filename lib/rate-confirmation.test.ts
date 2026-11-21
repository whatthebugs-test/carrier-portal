import { describe, expect, it } from "vitest";
import { parseRateConfirmation } from "./rate-confirmation";

const sample = `<?xml version="1.0" encoding="UTF-8"?>
<RateConfirmation version="2">
  <Load><Number>KF-240117</Number></Load>
  <Carrier><Name>Blue Ridge Haulers</Name><SCAC>BRHL</SCAC></Carrier>
  <Charges><LineHaul>2450.00</LineHaul><FuelSurcharge>312.75</FuelSurcharge></Charges>
  <Stops><Pickup><Date>2026-11-24</Date></Pickup><Delivery><Date>2026-11-26</Date></Delivery></Stops>
</RateConfirmation>`;

describe("parseRateConfirmation", () => {
  it("reads the load, carrier and charges", () => {
    expect(parseRateConfirmation(sample)).toEqual({
      loadNumber: "KF-240117",
      carrierName: "Blue Ridge Haulers",
      scac: "BRHL",
      lineHaulCents: 245000,
      fuelSurchargeCents: 31275,
      pickupDate: "2026-11-24",
      deliveryDate: "2026-11-26",
    });
  });

  it("rejects other XML documents", () => {
    expect(() => parseRateConfirmation("<Invoice/>")).toThrow("not a rate confirmation document");
  });
});
