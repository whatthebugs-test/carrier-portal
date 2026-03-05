import type { z } from "zod";
import { serverEnv } from "./env";
import {
  carrierSummarySchema,
  carrierUserSchema,
  shipmentDocumentSchema,
  shipmentPageSchema,
  shipmentSchema,
  trackingSchema,
  type CarrierSummary,
  type CarrierUser,
  type NewShipmentInput,
  type Shipment,
  type ShipmentDocument,
  type ShipmentPage,
  type ShipmentStatus,
  type Tracking,
} from "./schemas";

export class ShipmentApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly detail?: unknown,
  ) {
    super(message);
    this.name = "ShipmentApiError";
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }
}

export class ShipmentApiTimeoutError extends ShipmentApiError {
  constructor(path: string, timeoutMs: number) {
    super(`shipment-api did not respond to ${path} within ${timeoutMs}ms`, 504, "timeout");
    this.name = "ShipmentApiTimeoutError";
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  query?: Record<string, string | number | undefined>;
  body?: unknown;
  /** Override the default per-request timeout. */
  timeoutMs?: number;
  /** Carrier the request acts for; shipment-api scopes results to it. */
  carrierId?: string;
  headers?: Record<string, string>;
};

async function request<S extends z.ZodTypeAny>(
  path: string,
  schema: S,
  options: RequestOptions = {},
): Promise<z.infer<S>> {
  const env = serverEnv();
  const url = new URL(path, env.SHIPMENT_API_URL);
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  }

  const timeoutMs = options.timeoutMs ?? env.SHIPMENT_API_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const headers: Record<string, string> = {
    Accept: "application/json",
    Authorization: `Bearer ${env.SHIPMENT_API_TOKEN}`,
    "User-Agent": "carrier-portal",
  };
  if (options.carrierId) headers["X-Kestrel-Carrier"] = options.carrierId;
  Object.assign(headers, options.headers);

  let body: BodyInit | undefined;
  if (options.body instanceof Blob) {
    body = options.body;
  } else if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method ?? "GET",
      headers,
      body,
      signal: controller.signal,
      cache: "no-store",
    });
  } catch (err) {
    if (controller.signal.aborted) throw new ShipmentApiTimeoutError(path, timeoutMs);
    throw new ShipmentApiError(`shipment-api request to ${path} failed: ${(err as Error).message}`, 502, "network");
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    let payload: { detail?: unknown; code?: string } | undefined;
    try {
      payload = (await response.json()) as typeof payload;
    } catch {
      payload = undefined;
    }
    // FastAPI puts errors in `detail`: a string, a {code, message} object, or a validation error list.
    const detail = payload?.detail;
    const coded =
      detail && typeof detail === "object" && !Array.isArray(detail) ? (detail as { code?: string; message?: string }) : undefined;
    const message =
      typeof detail === "string" ? detail : (coded?.message ?? `shipment-api ${response.status} on ${path}`);
    throw new ShipmentApiError(message, response.status, payload?.code ?? coded?.code, detail);
  }

  if (response.status === 204) return schema.parse(undefined);
  return schema.parse(await response.json());
}

// ---------------------------------------------------------------------------

export function authenticateCarrierUser(email: string, password: string): Promise<CarrierUser> {
  return request("/v1/carrier-auth/verify", carrierUserSchema, {
    method: "POST",
    body: { email, password },
    timeoutMs: 5000,
  });
}

export function getCarrierSummary(carrierId: string): Promise<CarrierSummary> {
  return request(`/v1/carriers/${encodeURIComponent(carrierId)}/summary`, carrierSummarySchema, { carrierId });
}

export type ListShipmentsParams = {
  carrierId: string;
  status?: ShipmentStatus | "active";
  q?: string;
  page?: number;
  pageSize?: number;
};

export function listShipments({ carrierId, status, q, page = 1, pageSize = 25 }: ListShipmentsParams): Promise<ShipmentPage> {
  return request("/v1/shipments", shipmentPageSchema, {
    carrierId,
    query: { carrier_id: carrierId, status, q, page, page_size: pageSize },
  });
}

export function getShipment(carrierId: string, id: string): Promise<Shipment> {
  return request(`/v1/shipments/${encodeURIComponent(id)}`, shipmentSchema, { carrierId });
}

export function createShipment(carrierId: string, input: NewShipmentInput): Promise<Shipment> {
  return request("/v1/shipments", shipmentSchema, {
    method: "POST",
    carrierId,
    body: {
      ...input,
      carrier_id: carrierId,
      reference: input.reference || null,
      special_instructions: input.special_instructions || null,
    },
  });
}

export function cancelShipment(carrierId: string, id: string, reason: string): Promise<Shipment> {
  return request(`/v1/shipments/${encodeURIComponent(id)}/cancel`, shipmentSchema, {
    method: "POST",
    carrierId,
    body: { reason },
  });
}

export type DocumentUpload = {
  file: Blob;
  filename: string;
  kind: ShipmentDocument["kind"];
  uploadedBy: string;
};

/** shipment-api takes the raw file body with metadata in headers (no multipart). */
export function uploadShipmentDocument(carrierId: string, id: string, upload: DocumentUpload): Promise<ShipmentDocument> {
  return request(`/v1/shipments/${encodeURIComponent(id)}/documents`, shipmentDocumentSchema, {
    method: "POST",
    carrierId,
    body: upload.file,
    headers: {
      "Content-Type": upload.file.type,
      "X-Document-Kind": upload.kind,
      "X-Document-Filename": encodeURIComponent(upload.filename),
      "X-Uploaded-By": upload.uploadedBy,
    },
    timeoutMs: 30_000,
  });
}

export function getTracking(proNumber: string): Promise<Tracking> {
  return request(`/v1/tracking/${encodeURIComponent(proNumber)}`, trackingSchema);
}
