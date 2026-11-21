import { XMLParser } from "fast-xml-parser";
import { z } from "zod";

const rateConfirmationSchema = z.object({
  loadNumber: z.string().min(1),
  carrierName: z.string().min(1),
  scac: z.string().regex(/^[A-Z]{2,4}$/),
  lineHaulCents: z.number().int().nonnegative(),
  fuelSurchargeCents: z.number().int().nonnegative(),
  pickupDate: z.string().date(),
  deliveryDate: z.string().date(),
});

export type RateConfirmation = z.infer<typeof rateConfirmationSchema>;

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "", parseTagValue: false });

const toCents = (amount: string | undefined) => Math.round(Number.parseFloat(amount ?? "0") * 100);

// Carriers email rate confirmations as XML exported from their TMS (McLeod, MercuryGate).
export function parseRateConfirmation(xml: string): RateConfirmation {
  const doc = parser.parse(xml)?.RateConfirmation;
  if (!doc) throw new Error("not a rate confirmation document");
  return rateConfirmationSchema.parse({
    loadNumber: doc.Load?.Number,
    carrierName: doc.Carrier?.Name,
    scac: doc.Carrier?.SCAC,
    lineHaulCents: toCents(doc.Charges?.LineHaul),
    fuelSurchargeCents: toCents(doc.Charges?.FuelSurcharge),
    pickupDate: doc.Stops?.Pickup?.Date,
    deliveryDate: doc.Stops?.Delivery?.Date,
  });
}
