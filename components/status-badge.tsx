import { cn } from "@/lib/cn";
import { statusLabel } from "@/lib/format";
import type { ShipmentStatus } from "@/lib/schemas";

const TONES: Record<ShipmentStatus, string> = {
  tendered: "bg-slate-100 text-slate-700 ring-slate-200",
  booked: "bg-sky-50 text-sky-700 ring-sky-200",
  picked_up: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  in_transit: "bg-blue-50 text-blue-700 ring-blue-200",
  out_for_delivery: "bg-violet-50 text-violet-700 ring-violet-200",
  delivered: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  exception: "bg-amber-50 text-amber-800 ring-amber-300",
  cancelled: "bg-slate-50 text-slate-500 ring-slate-200 line-through",
};

export function StatusBadge({ status, className }: { status: ShipmentStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        TONES[status],
        className,
      )}
    >
      {statusLabel(status)}
    </span>
  );
}
