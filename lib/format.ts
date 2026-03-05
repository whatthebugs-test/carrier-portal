import { format, formatDistanceToNowStrict, isValid, parseISO } from "date-fns";
import type { ShipmentStatus, Stop } from "./schemas";

const EMPTY = "—";

const weightFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const currencyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const percentFormatter = new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 1 });

export function formatWeight(lbs: number | null | undefined): string {
  if (lbs == null || !Number.isFinite(lbs)) return EMPTY;
  return `${weightFormatter.format(lbs)} lb`;
}

export function formatCurrency(cents: number | null | undefined): string {
  if (cents == null || !Number.isFinite(cents)) return EMPTY;
  return currencyFormatter.format(cents / 100);
}

export function formatPercent(ratio: number | null | undefined): string {
  if (ratio == null || !Number.isFinite(ratio)) return EMPTY;
  return percentFormatter.format(ratio);
}

/** Ten-digit numeric PROs print as 3-3-4; anything else is shown as issued. */
export function formatProNumber(pro: string): string {
  const compact = pro.replace(/[\s-]/g, "").toUpperCase();
  if (/^\d{10}$/.test(compact)) {
    return `${compact.slice(0, 3)}-${compact.slice(3, 6)}-${compact.slice(6)}`;
  }
  return compact;
}

export function formatStop(stop: Pick<Stop, "city" | "state" | "postal_code">): string {
  return `${stop.city}, ${stop.state} ${stop.postal_code}`.trim();
}

export function formatLane(origin: Pick<Stop, "city" | "state">, destination: Pick<Stop, "city" | "state">): string {
  return `${origin.city}, ${origin.state} → ${destination.city}, ${destination.state}`;
}

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const date = typeof value === "string" ? parseISO(value) : value;
  return isValid(date) ? date : null;
}

export function formatDate(value: string | Date | null | undefined): string {
  const date = toDate(value);
  return date ? format(date, "MMM d, yyyy") : EMPTY;
}

export function formatDateTime(value: string | Date | null | undefined): string {
  const date = toDate(value);
  return date ? format(date, "MMM d, yyyy h:mm a") : EMPTY;
}

export function formatRelative(value: string | Date | null | undefined): string {
  const date = toDate(value);
  return date ? formatDistanceToNowStrict(date, { addSuffix: true }) : EMPTY;
}

const STATUS_LABELS: Record<ShipmentStatus, string> = {
  tendered: "Tendered",
  booked: "Booked",
  picked_up: "Picked up",
  in_transit: "In transit",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  exception: "Exception",
  cancelled: "Cancelled",
};

export function statusLabel(status: ShipmentStatus): string {
  return STATUS_LABELS[status];
}
