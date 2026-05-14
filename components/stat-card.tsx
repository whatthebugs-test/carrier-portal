import Link from "next/link";
import { cn } from "@/lib/cn";

type Props = {
  label: string;
  value: number | string;
  tone?: "default" | "warning";
  href?: string;
};

export function StatCard({ label, value, tone = "default", href }: Props) {
  const body = (
    <>
      <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</p>
      <p className={cn("mt-2 text-2xl font-semibold tabular-nums", tone === "warning" && "text-amber-700")}>
        {typeof value === "number" ? value.toLocaleString("en-US") : value}
      </p>
    </>
  );

  const className = cn("card p-4", tone === "warning" && "border-amber-300 bg-amber-50/40", href && "hover:border-kestrel-300");
  return href ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}
