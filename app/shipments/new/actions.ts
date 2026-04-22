"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { newShipmentSchema } from "@/lib/schemas";
import { canBook, requireCarrierSession } from "@/lib/session";
import { createShipment, ShipmentApiError } from "@/lib/shipment-api";

export type CreateShipmentState = {
  formError?: string;
  /** Keyed by dotted field path, e.g. `origin.postal_code`. */
  fieldErrors?: Record<string, string>;
};

export async function createShipmentAction(input: unknown): Promise<CreateShipmentState> {
  const session = await requireCarrierSession();
  if (!canBook(session)) {
    return { formError: "Your role can view shipments but not tender them. Ask your carrier admin for dispatcher access." };
  }

  // Never trust the client-side resolver: this action is a public POST endpoint.
  const parsed = newShipmentSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".");
      fieldErrors[key] ??= issue.message;
    }
    return { formError: "Check the highlighted fields.", fieldErrors };
  }

  let shipmentId: string;
  try {
    const shipment = await createShipment(session.carrierId, parsed.data);
    shipmentId = shipment.id;
  } catch (err) {
    if (err instanceof ShipmentApiError && err.code === "lane_not_serviced") {
      return { formError: "Kestrel doesn't service that lane yet. Contact your account rep for a spot quote." };
    }
    if (err instanceof ShipmentApiError && err.status === 422) {
      return {
        formError: Array.isArray(err.detail) ? "shipment-api rejected some fields. Check the stops and freight details." : err.message,
      };
    }
    console.error("createShipment failed", { carrierId: session.carrierId, err });
    return { formError: "We couldn't tender this shipment. Try again in a minute." };
  }

  revalidatePath("/shipments");
  revalidatePath("/");
  redirect(`/shipments/${shipmentId}`);
}
