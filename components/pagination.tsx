import Link from "next/link";

type Props = {
  page: number;
  pageSize: number;
  total: number;
  params: Record<string, string | undefined>;
};

export function Pagination({ page, pageSize, total, params }: Props) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;

  const href = (p: number) => {
    const search = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) search.set(k, v);
    search.set("page", String(p));
    return `/shipments?${search}`;
  };

  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between text-sm text-ink-muted">
      <p>
        {first.toLocaleString()}–{last.toLocaleString()} of {total.toLocaleString()}
      </p>
      <div className="flex gap-2">
        {page > 1 && (
          <Link href={href(page - 1)} className="btn-secondary">
            Previous
          </Link>
        )}
        {page < pages && (
          <Link href={href(page + 1)} className="btn-secondary">
            Next
          </Link>
        )}
      </div>
    </div>
  );
}
