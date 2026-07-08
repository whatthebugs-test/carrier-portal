"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { canBook, requireCarrierSession } from "@/lib/session";
import { cancelShipment, ShipmentApiError } from "@/lib/shipment-api";

const cancelSchema = z.object({
  shipmentId: z.string().min(1),
  reason: z.string().trim().min(3, "Tell us why so dispatch can release the truck").max(300),
});

export type CancelShipmentResult = { ok: true } | { ok: false; error: string };

export async function cancelShipmentAction(input: { shipmentId: string; reason: string }): Promise<CancelShipmentResult> {
  const session = await requireCarrierSession();
  if (!canBook(session)) return { ok: false, error: "Your role can't cancel shipments." };

  const parsed = cancelSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid request" };

  try {
    await cancelShipment(session.carrierId, parsed.data.shipmentId, parsed.data.reason);
  } catch (err) {
    if (err instanceof ShipmentApiError && err.status === 409) {
      return { ok: false, error: "This shipment has already been picked up and can't be cancelled here." };
    }
    throw err;
  }

  revalidatePath(`/shipments/${parsed.data.shipmentId}`);
  revalidatePath("/shipments");
  return { ok: true };
}
