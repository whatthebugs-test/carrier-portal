import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CancelShipmentDialog } from "@/components/cancel-shipment-dialog";
import { StatusBadge } from "@/components/status-badge";
import { TrackingTimeline } from "@/components/tracking-timeline";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatProNumber,
  formatStop,
  formatWeight,
} from "@/lib/format";
import type { Stop } from "@/lib/schemas";
import { canBook, requireCarrierSession } from "@/lib/session";
import { getShipment, getTracking, ShipmentApiError } from "@/lib/shipment-api";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `Shipment ${(await params).id}` };
}

const CANCELLABLE = new Set(["tendered", "booked"]);

export default async function ShipmentDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await requireCarrierSession();

  const shipment = await getShipment(session.carrierId, id).catch((err: unknown) => {
    if (err instanceof ShipmentApiError && err.isNotFound) notFound();
    throw err;
  });
  const tracking = await getTracking(shipment.pro_number).catch(() => null);

  return (
    <div className="space-y-6">
      <nav className="text-sm text-ink-muted">
        <Link href="/shipments" className="hover:underline">
          Shipments
        </Link>{" "}
        / <span className="font-mono">{formatProNumber(shipment.pro_number)}</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-semibold tracking-tight">
            PRO {formatProNumber(shipment.pro_number)}
            <StatusBadge status={shipment.status} />
          </h1>
          {shipment.reference && <p className="mt-1 text-sm text-ink-muted">Ref {shipment.reference}</p>}
        </div>
        <div className="flex gap-2">
          <Link href={`/tracking/${shipment.pro_number}`} className="btn-secondary">
            Public tracking link
          </Link>
          {canBook(session) && CANCELLABLE.has(shipment.status) && (
            <CancelShipmentDialog shipmentId={shipment.id} proNumber={shipment.pro_number} />
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card space-y-5 p-5 lg:col-span-2">
          <div className="grid gap-6 sm:grid-cols-2">
            <StopBlock label="Pickup" stop={shipment.origin} date={formatDate(shipment.pickup_date)} />
            <StopBlock
              label="Delivery"
              stop={shipment.destination}
              date={shipment.delivery_date ? formatDate(shipment.delivery_date) : `ETA ${formatDateTime(shipment.eta)}`}
            />
          </div>
          <dl className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-5 text-sm sm:grid-cols-4">
            <Detail label="Weight" value={formatWeight(shipment.weight_lbs)} />
            <Detail label="Handling units" value={String(shipment.pieces)} />
            <Detail label="Class" value={shipment.freight_class} />
            <Detail label="Linehaul rate" value={formatCurrency(shipment.rate_cents)} />
            <Detail label="Hazmat" value={shipment.hazmat ? "Yes" : "No"} />
            <Detail label="Tendered" value={formatDateTime(shipment.created_at)} />
          </dl>
        </section>

        <section className="card p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Tracking</h2>
          {tracking ? (
            <TrackingTimeline events={tracking.events} />
          ) : (
            <p className="text-sm text-ink-muted">Tracking is temporarily unavailable.</p>
          )}
        </section>
      </div>

    </div>
  );
}

function StopBlock({ label, stop, date }: { label: string; stop: Stop; date: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{label}</p>
      <p className="mt-1 font-medium">{stop.name}</p>
      {stop.street1 && <p className="text-sm text-slate-600">{stop.street1}</p>}
      <p className="text-sm text-slate-600">{formatStop(stop)}</p>
      <p className="mt-2 text-sm">{date}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-ink-muted">{label}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  );
}
