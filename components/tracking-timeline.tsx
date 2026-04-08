import { formatDateTime } from "@/lib/format";
import type { TrackingEvent } from "@/lib/schemas";

export function TrackingTimeline({ events }: { events: TrackingEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-ink-muted">No tracking events yet.</p>;
  }

  const ordered = [...events].sort((a, b) => b.occurred_at.localeCompare(a.occurred_at));

  return (
    <ol className="relative space-y-5 border-l border-slate-200 pl-5">
      {ordered.map((event, i) => (
        <li key={event.id} className="relative">
          <span
            className={
              "absolute -left-[1.6rem] top-1 h-2.5 w-2.5 rounded-full ring-4 ring-white " +
              (i === 0 ? "bg-kestrel-500" : "bg-slate-300")
            }
          />
          <p className="text-sm font-medium">{event.description}</p>
          <p className="text-xs text-ink-muted">
            {[event.city, event.state].filter(Boolean).join(", ")}
            {event.city ? " · " : ""}
            {formatDateTime(event.occurred_at)}
          </p>
        </li>
      ))}
    </ol>
  );
}
