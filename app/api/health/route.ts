import { NextResponse } from "next/server";
import pkg from "@/package.json";

export const dynamic = "force-dynamic";

/**
 * ALB target-group health check. Deliberately does not call shipment-api:
 * an upstream outage should surface as errors, not as every task being
 * pulled from the target group at once.
 */
export function GET() {
  return NextResponse.json(
    {
      status: "ok",
      version: pkg.version,
      commit: process.env.GIT_SHA ?? null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
