import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LiveTracking } from "@/components/live-tracking";
import { formatProNumber } from "@/lib/format";
import { proNumberSchema } from "@/lib/schemas";
import { getTracking, ShipmentApiError } from "@/lib/shipment-api";

type Props = { params: Promise<{ pro: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pro } = await params;
  return { title: `Tracking ${formatProNumber(decodeURIComponent(pro))}` };
}

export default async function TrackingPage({ params }: Props) {
  const parsed = proNumberSchema.safeParse(decodeURIComponent((await params).pro));
  if (!parsed.success) notFound();

  const tracking = await getTracking(parsed.data).catch((err: unknown) => {
    if (err instanceof ShipmentApiError && err.isNotFound) notFound();
    throw err;
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm text-ink-muted">Kestrel Freight shipment tracking</p>
        <h1 className="text-2xl font-semibold tracking-tight">PRO {formatProNumber(tracking.pro_number)}</h1>
      </div>
      <LiveTracking initial={tracking} mapboxToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN} />
    </div>
  );
}
