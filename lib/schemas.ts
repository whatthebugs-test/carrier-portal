import { z } from "zod";

export const SHIPMENT_STATUSES = [
  "tendered",
  "booked",
  "picked_up",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "exception",
  "cancelled",
] as const;

export const ACTIVE_STATUSES = [
  "tendered",
  "booked",
  "picked_up",
  "in_transit",
  "out_for_delivery",
  "exception",
] as const satisfies readonly ShipmentStatus[];

export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

/** NMFC freight classes accepted by shipment-api for LTL tenders. */
export const FREIGHT_CLASSES = [
  "50", "55", "60", "65", "70", "77.5", "85", "92.5", "100",
  "110", "125", "150", "175", "200", "250", "300", "400", "500",
] as const;

const US_ZIP = /^\d{5}(-\d{4})?$/;
const CA_POSTAL = /^[A-Za-z]\d[A-Za-z] ?\d[A-Za-z]\d$/;
const STATE_CODE = /^[A-Z]{2}$/;

// ---------------------------------------------------------------------------
// Responses from shipment-api
// ---------------------------------------------------------------------------

export const stopSchema = z.object({
  name: z.string(),
  street1: z.string().nullable().optional(),
  city: z.string(),
  state: z.string(),
  postal_code: z.string(),
  country: z.string().default("US"),
});

export const trackingEventSchema = z.object({
  id: z.string(),
  code: z.string(),
  description: z.string(),
  occurred_at: z.string(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
});

export const shipmentSchema = z.object({
  id: z.string(),
  pro_number: z.string(),
  status: z.enum(SHIPMENT_STATUSES),
  carrier_id: z.string(),
  reference: z.string().nullable(),
  origin: stopSchema,
  destination: stopSchema,
  pickup_date: z.string(),
  delivery_date: z.string().nullable(),
  eta: z.string().nullable(),
  weight_lbs: z.number(),
  pieces: z.number().int(),
  freight_class: z.string(),
  hazmat: z.boolean(),
  rate_cents: z.number().int().nullable(),
  last_event: trackingEventSchema.nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const shipmentPageSchema = z.object({
  items: z.array(shipmentSchema),
  total: z.number().int(),
  page: z.number().int(),
  page_size: z.number().int(),
});

export const trackingSchema = z.object({
  pro_number: z.string(),
  status: z.enum(SHIPMENT_STATUSES),
  origin: stopSchema,
  destination: stopSchema,
  eta: z.string().nullable(),
  delivered_at: z.string().nullable(),
  events: z.array(trackingEventSchema),
});

export const DOCUMENT_KINDS = ["bol", "pod", "invoice", "weight_cert", "other"] as const;

export const shipmentDocumentSchema = z.object({
  id: z.string(),
  kind: z.enum(DOCUMENT_KINDS),
  filename: z.string(),
  uploaded_at: z.string(),
});

export const carrierSummarySchema = z.object({
  active_shipments: z.number().int(),
  in_transit: z.number().int(),
  delivered_30d: z.number().int(),
  on_time_rate: z.number().min(0).max(1).nullable(),
  open_exceptions: z.number().int(),
  weekly_volume: z.array(z.object({ week_start: z.string(), shipments: z.number().int() })),
});

export const carrierUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  carrier_id: z.string(),
  carrier_name: z.string(),
  scac: z.string(),
  role: z.enum(["admin", "dispatcher", "viewer"]),
});

export type Stop = z.infer<typeof stopSchema>;
export type TrackingEvent = z.infer<typeof trackingEventSchema>;
export type Shipment = z.infer<typeof shipmentSchema>;
export type ShipmentPage = z.infer<typeof shipmentPageSchema>;
export type ShipmentDocument = z.infer<typeof shipmentDocumentSchema>;
export type Tracking = z.infer<typeof trackingSchema>;
export type CarrierSummary = z.infer<typeof carrierSummarySchema>;
export type CarrierUser = z.infer<typeof carrierUserSchema>;

// ---------------------------------------------------------------------------
// Portal input
// ---------------------------------------------------------------------------

export const stopInputSchema = z
  .object({
    name: z.string().trim().min(2, "Enter a facility name").max(80),
    street1: z.string().trim().min(3, "Enter a street address").max(120),
    city: z.string().trim().min(2, "Enter a city").max(60),
    state: z
      .string()
      .trim()
      .toUpperCase()
      .regex(STATE_CODE, "Use the 2-letter state or province code"),
    postal_code: z.string().trim().min(1, "Enter a postal code"),
    country: z.enum(["US", "CA"]),
  })
  .superRefine((stop, ctx) => {
    const ok = stop.country === "US" ? US_ZIP.test(stop.postal_code) : CA_POSTAL.test(stop.postal_code);
    if (!ok) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["postal_code"],
        message: stop.country === "US" ? "Enter a 5-digit ZIP code" : "Enter a postal code like K1A 0B1",
      });
    }
  });

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export const newShipmentSchema = z.object({
  reference: z.string().trim().max(40, "Keep references under 40 characters").optional().or(z.literal("")),
  origin: stopInputSchema,
  destination: stopInputSchema,
  pickup_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a pickup date")
    .refine((d) => d >= todayIso(), "Pickup date can't be in the past"),
  weight_lbs: z
    .number({ invalid_type_error: "Enter the total weight" })
    .positive("Enter the total weight")
    .max(48_000, "LTL tenders are limited to 48,000 lb"),
  pieces: z
    .number({ invalid_type_error: "Enter the handling unit count" })
    .int()
    .min(1, "At least one handling unit")
    .max(30, "More than 30 handling units needs a volume quote"),
  freight_class: z.enum(FREIGHT_CLASSES, { message: "Choose a freight class" }),
  hazmat: z.boolean(),
  special_instructions: z.string().trim().max(500).optional().or(z.literal("")),
});

export type NewShipmentInput = z.infer<typeof newShipmentSchema>;

export const proNumberSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s-]/g, "").toUpperCase())
  .pipe(z.string().regex(/^[0-9A-Z]{8,12}$/, "PRO numbers are 8 to 12 letters or digits"));
