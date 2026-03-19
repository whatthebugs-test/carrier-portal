import Link from "next/link";
import { requireCarrierSession } from "@/lib/session";

export default async function DashboardPage() {
  const session = await requireCarrierSession();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Welcome, {session.name}</h1>
      <Link href="/shipments" className="btn-primary">
        View shipments
      </Link>
    </div>
  );
}
