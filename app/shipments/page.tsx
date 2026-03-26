import type { Metadata } from "next";
import Link from "next/link";
import { Pagination } from "@/components/pagination";
import { ShipmentFilters } from "@/components/shipment-filters";
import { ShipmentTable } from "@/components/shipment-table";
import { SHIPMENT_STATUSES, type ShipmentStatus } from "@/lib/schemas";
import { canBook, requireCarrierSession } from "@/lib/session";
import { listShipments } from "@/lib/shipment-api";

export const metadata: Metadata = { title: "Shipments" };

const PAGE_SIZE = 25;

function parseStatus(value: string | undefined): ShipmentStatus | "active" | undefined {
  if (value === "active") return value;
  return SHIPMENT_STATUSES.find((s) => s === value);
}

export default async function ShipmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const session = await requireCarrierSession();
  const params = await searchParams;
  const status = parseStatus(params.status);
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const q = params.q?.trim() || undefined;

  const result = await listShipments({ carrierId: session.carrierId, status, q, page, pageSize: PAGE_SIZE });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Shipments</h1>
        {canBook(session) && (
          <Link href="/shipments/new" className="btn-primary">
            Tender shipment
          </Link>
        )}
      </div>
      <ShipmentFilters status={status} q={q} />
      <ShipmentTable shipments={result.items} emptyMessage="No shipments match these filters." />
      <Pagination page={result.page} pageSize={result.page_size} total={result.total} params={{ status, q }} />
    </div>
  );
}
