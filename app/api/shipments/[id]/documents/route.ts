import { NextResponse } from "next/server";
import { DOCUMENT_KINDS } from "@/lib/schemas";
import { getCarrierSession } from "@/lib/session";
import { ShipmentApiError, uploadShipmentDocument } from "@/lib/shipment-api";

const MAX_BYTES = 15 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "image/tiff"]);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCarrierSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (session.role === "viewer") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const form = await request.formData();
  const file = form.get("file");
  const kind = form.get("kind");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "file_required" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "file_too_large" }, { status: 413 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "unsupported_type" }, { status: 415 });
  }
  if (typeof kind !== "string" || !(DOCUMENT_KINDS as readonly string[]).includes(kind)) {
    return NextResponse.json({ error: "invalid_kind" }, { status: 400 });
  }

  try {
    const document = await uploadShipmentDocument(session.carrierId, (await params).id, {
      file,
      filename: file.name,
      kind: kind as (typeof DOCUMENT_KINDS)[number],
      uploadedBy: session.email,
    });
    return NextResponse.json(document, { status: 201 });
  } catch (err) {
    if (err instanceof ShipmentApiError && err.status < 500) {
      return NextResponse.json({ error: err.code ?? "upload_rejected", detail: err.message }, { status: err.status });
    }
    throw err;
  }
}
