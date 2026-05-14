import Link from "next/link";
import { ShipmentTable } from "@/components/shipment-table";
import { StatCard } from "@/components/stat-card";
import { VolumeChart } from "@/components/volume-chart";
import { formatPercent } from "@/lib/format";
import { canBook, requireCarrierSession } from "@/lib/session";
import { getCarrierSummary, listShipments } from "@/lib/shipment-api";

export default async function DashboardPage() {
  const session = await requireCarrierSession();
  const [summary, recent] = await Promise.all([
    getCarrierSummary(session.carrierId),
    listShipments({ carrierId: session.carrierId, status: "active", pageSize: 8 }),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-ink-muted">
            {session.carrierName} · SCAC {session.scac}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        </div>
        {canBook(session) && (
          <Link href="/shipments/new" className="btn-primary">
            Tender shipment
          </Link>
        )}
      </div>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Active shipments" value={summary.active_shipments} />
        <StatCard label="In transit" value={summary.in_transit} />
        <StatCard label="Delivered (30d)" value={summary.delivered_30d} />
        <StatCard label="On-time (30d)" value={formatPercent(summary.on_time_rate)} />
        <StatCard
          label="Open exceptions"
          value={summary.open_exceptions}
          tone={summary.open_exceptions > 0 ? "warning" : "default"}
          href={summary.open_exceptions > 0 ? "/shipments?status=exception" : undefined}
        />
      </section>

      <section className="card p-5">
        <h2 className="text-sm font-semibold text-slate-700">Weekly tenders</h2>
        <VolumeChart data={summary.weekly_volume} />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Active shipments</h2>
          <Link href="/shipments" className="text-sm font-medium text-kestrel-700 hover:underline">
            View all
          </Link>
        </div>
        <ShipmentTable shipments={recent.items} />
      </section>
    </div>
  );
}
