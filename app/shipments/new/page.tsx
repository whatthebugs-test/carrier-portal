import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { canBook, requireCarrierSession } from "@/lib/session";
import { NewShipmentForm } from "./new-shipment-form";

export const metadata: Metadata = { title: "Tender shipment" };

export default async function NewShipmentPage() {
  const session = await requireCarrierSession();
  if (!canBook(session)) redirect("/shipments");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tender shipment</h1>
        <p className="mt-1 text-sm text-ink-muted">
          LTL tenders up to 48,000 lb. Tenders received before 2pm local time are eligible for next-day pickup.
        </p>
      </div>
      <NewShipmentForm />
    </div>
  );
}
