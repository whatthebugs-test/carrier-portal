import { NextResponse } from "next/server";
import { proNumberSchema } from "@/lib/schemas";
import { getTracking, ShipmentApiError } from "@/lib/shipment-api";

export async function GET(_request: Request, { params }: { params: Promise<{ pro: string }> }) {
  const parsed = proNumberSchema.safeParse((await params).pro);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_pro" }, { status: 400 });
  }

  try {
    const tracking = await getTracking(parsed.data);
    return NextResponse.json(tracking, {
      headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=60" },
    });
  } catch (err) {
    if (err instanceof ShipmentApiError && err.isNotFound) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    throw err;
  }
}
