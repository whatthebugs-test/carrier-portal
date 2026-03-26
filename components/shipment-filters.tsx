import Link from "next/link";
import { cn } from "@/lib/cn";
import type { ShipmentStatus } from "@/lib/schemas";

const TABS: { label: string; value?: ShipmentStatus | "active" }[] = [
  { label: "All" },
  { label: "Active", value: "active" },
  { label: "In transit", value: "in_transit" },
  { label: "Exceptions", value: "exception" },
  { label: "Delivered", value: "delivered" },
];

export function ShipmentFilters({ status, q }: { status?: ShipmentStatus | "active"; q?: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <nav className="flex gap-1 rounded-lg bg-slate-100 p-1 text-sm">
        {TABS.map((tab) => {
          const params = new URLSearchParams();
          if (tab.value) params.set("status", tab.value);
          if (q) params.set("q", q);
          const active = tab.value === status;
          return (
            <Link
              key={tab.label}
              href={`/shipments${params.size ? `?${params}` : ""}`}
              className={cn(
                "rounded-md px-3 py-1.5 font-medium",
                active ? "bg-white text-ink shadow-sm" : "text-ink-muted hover:text-ink",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
      <form action="/shipments" className="flex gap-2">
        {status && <input type="hidden" name="status" value={status} />}
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="PRO, reference or city"
          className="field-input w-64"
          aria-label="Search shipments"
        />
        <button type="submit" className="btn-secondary">
          Search
        </button>
      </form>
    </div>
  );
}
