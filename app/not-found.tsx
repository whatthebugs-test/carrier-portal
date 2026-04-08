import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card mx-auto max-w-lg p-8 text-center">
      <h1 className="text-lg font-semibold">Not found</h1>
      <p className="mt-2 text-sm text-ink-muted">That page or shipment doesn&apos;t exist, or your account can&apos;t see it.</p>
      <Link href="/shipments" className="btn-secondary mt-6">
        Back to shipments
      </Link>
    </div>
  );
}
