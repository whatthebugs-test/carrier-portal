import Link from "next/link";
import { formatDate, formatLane, formatProNumber, formatRelative, formatWeight } from "@/lib/format";
import type { Shipment } from "@/lib/schemas";
import { StatusBadge } from "./status-badge";

export function ShipmentTable({
  shipments,
  emptyMessage = "No active shipments.",
}: {
  shipments: Shipment[];
  emptyMessage?: string;
}) {
  if (shipments.length === 0) {
    return <div className="card p-8 text-center text-sm text-ink-muted">{emptyMessage}</div>;
  }

  return (
    <div className="card overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
          <tr>
            <th className="px-4 py-3">PRO</th>
            <th className="px-4 py-3">Lane</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Pickup</th>
            <th className="px-4 py-3 text-right">Weight</th>
            <th className="px-4 py-3">Last update</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {shipments.map((s) => (
            <tr key={s.id} className="hover:bg-slate-50">
              <td className="whitespace-nowrap px-4 py-3 font-mono">
                <Link href={`/shipments/${s.id}`} className="text-kestrel-700 hover:underline">
                  {formatProNumber(s.pro_number)}
                </Link>
                {s.reference && <div className="font-sans text-xs text-ink-muted">Ref {s.reference}</div>}
              </td>
              <td className="px-4 py-3">{formatLane(s.origin, s.destination)}</td>
              <td className="px-4 py-3">
                <StatusBadge status={s.status} />
              </td>
              <td className="whitespace-nowrap px-4 py-3">{formatDate(s.pickup_date)}</td>
              <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">{formatWeight(s.weight_lbs)}</td>
              <td className="px-4 py-3 text-ink-muted">
                {s.last_event ? (
                  <span title={s.last_event.description}>{formatRelative(s.last_event.occurred_at)}</span>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
