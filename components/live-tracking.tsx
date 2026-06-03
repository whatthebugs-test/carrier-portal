"use client";

import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { formatDateTime, formatStop } from "@/lib/format";
import { trackingSchema, type Tracking } from "@/lib/schemas";
import { StatusBadge } from "./status-badge";
import { TrackingTimeline } from "./tracking-timeline";

const ShipmentMap = dynamic(() => import("./shipment-map").then((m) => m.ShipmentMap), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse rounded-lg bg-slate-100" />,
});

const TERMINAL = new Set(["delivered", "cancelled"]);

async function fetchTracking(pro: string): Promise<Tracking> {
  const res = await fetch(`/api/tracking/${encodeURIComponent(pro)}`);
  if (!res.ok) throw new Error(`tracking request failed: ${res.status}`);
  return trackingSchema.parse(await res.json());
}

export function LiveTracking({ initial, mapboxToken }: { initial: Tracking; mapboxToken?: string }) {
  const { data = initial } = useQuery({
    queryKey: ["tracking", initial.pro_number],
    queryFn: () => fetchTracking(initial.pro_number),
    initialData: initial,
    refetchInterval: (query) => (query.state.data && TERMINAL.has(query.state.data.status) ? false : 60_000),
  });

  const located = data.events.find((e) => e.lat != null && e.lng != null);

  return (
    <div className="space-y-6">
      <div className="card grid gap-4 p-5 sm:grid-cols-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-ink-muted">Status</p>
          <StatusBadge status={data.status} className="mt-1" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-ink-muted">From</p>
          <p className="mt-1 text-sm font-medium">{formatStop(data.origin)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-ink-muted">To</p>
          <p className="mt-1 text-sm font-medium">{formatStop(data.destination)}</p>
          <p className="text-xs text-ink-muted">
            {data.delivered_at ? `Delivered ${formatDateTime(data.delivered_at)}` : `ETA ${formatDateTime(data.eta)}`}
          </p>
        </div>
      </div>

      {mapboxToken && located && (
        <ShipmentMap token={mapboxToken} lat={located.lat as number} lng={located.lng as number} />
      )}

      <div className="card p-5">
        <TrackingTimeline events={data.events} />
      </div>
    </div>
  );
}
