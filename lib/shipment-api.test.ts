import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const shipment = {
  id: "shp_01JD3K8W1V",
  pro_number: "4820019375",
  status: "in_transit",
  carrier_id: "car_mdt",
  reference: "PO-88213",
  origin: { name: "Delta Cold Storage", street1: "4120 Lamar Ave", city: "Memphis", state: "TN", postal_code: "38118", country: "US" },
  destination: { name: "Rickenbacker DC 3", street1: null, city: "Columbus", state: "OH", postal_code: "43217", country: "US" },
  pickup_date: "2026-11-17",
  delivery_date: null,
  eta: "2026-11-19T18:00:00Z",
  weight_lbs: 8200,
  pieces: 6,
  freight_class: "70",
  hazmat: false,
  rate_cents: 184250,
  last_event: null,
  created_at: "2026-11-16T14:02:11Z",
  updated_at: "2026-11-18T09:40:00Z",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

describe("shipment-api client", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("SHIPMENT_API_URL", "https://shipment-api.internal.kestrelfreight.io");
    vi.stubEnv("SHIPMENT_API_TOKEN", "svc-portal-token");
    vi.stubEnv("SHIPMENT_API_TIMEOUT_MS", "50");
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("sends the service token and carrier scope", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(shipment));
    const { getShipment } = await import("./shipment-api");

    const result = await getShipment("car_mdt", "shp_01JD3K8W1V");

    expect(result.pro_number).toBe("4820019375");
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toBe("https://shipment-api.internal.kestrelfreight.io/v1/shipments/shp_01JD3K8W1V");
    const headers = init?.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer svc-portal-token");
    expect(headers["X-Kestrel-Carrier"]).toBe("car_mdt");
  });

  it("builds list queries and drops empty filters", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ items: [shipment], total: 1, page: 2, page_size: 25 }));
    const { listShipments } = await import("./shipment-api");

    await listShipments({ carrierId: "car_mdt", status: "active", q: "", page: 2 });

    const url = new URL(String(fetchMock.mock.calls[0]![0]));
    expect(url.pathname).toBe("/v1/shipments");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      carrier_id: "car_mdt",
      status: "active",
      page: "2",
      page_size: "25",
    });
  });

  it("maps error responses to ShipmentApiError with the API detail", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ detail: "Shipment not found", code: "not_found" }, 404));
    const { getShipment, ShipmentApiError } = await import("./shipment-api");

    const err = await getShipment("car_mdt", "shp_missing").catch((e: unknown) => e);

    expect(err).toBeInstanceOf(ShipmentApiError);
    expect(err).toMatchObject({ status: 404, code: "not_found", message: "Shipment not found", isNotFound: true });
  });

  it("reads error codes nested in FastAPI's detail object", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ detail: { code: "lane_not_serviced", message: "no contracted rate for 995 to 336" } }, 422),
    );
    const { createShipment } = await import("./shipment-api");

    const err = await createShipment("car_mdt", {} as never).catch((e: unknown) => e);

    expect(err).toMatchObject({ status: 422, code: "lane_not_serviced", message: "no contracted rate for 995 to 336" });
  });

  it("aborts requests that exceed the timeout", async () => {
    fetchMock.mockImplementationOnce(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
        }),
    );
    const { getTracking, ShipmentApiTimeoutError } = await import("./shipment-api");

    await expect(getTracking("4820019375")).rejects.toBeInstanceOf(ShipmentApiTimeoutError);
  });

  it("rejects responses that don't match the contract", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ...shipment, status: "lost" }));
    const { getShipment } = await import("./shipment-api");

    await expect(getShipment("car_mdt", "shp_01JD3K8W1V")).rejects.toThrow();
  });

  it("uploads documents as a raw body with metadata headers", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ id: "doc_01JD4", kind: "pod", filename: "POD 4820019375.pdf", uploaded_at: "2026-11-19T21:04:00Z" }, 201),
    );
    const { uploadShipmentDocument } = await import("./shipment-api");
    const file = new Blob(["%PDF-1.7"], { type: "application/pdf" });

    await uploadShipmentDocument("car_mdt", "shp_01JD3K8W1V", {
      file,
      filename: "POD 4820019375.pdf",
      kind: "pod",
      uploadedBy: "dispatch@midsouthtransport.com",
    });

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toMatch(/\/v1\/shipments\/shp_01JD3K8W1V\/documents$/);
    expect(init?.body).toBe(file);
    expect(init?.headers).toMatchObject({
      "Content-Type": "application/pdf",
      "X-Document-Kind": "pod",
      "X-Document-Filename": "POD%204820019375.pdf",
      Authorization: "Bearer svc-portal-token",
    });
  });

  it("fails fast when the service token is missing", async () => {
    vi.stubEnv("SHIPMENT_API_TOKEN", "");
    const { getShipment } = await import("./shipment-api");

    await expect(getShipment("car_mdt", "shp_01JD3K8W1V")).rejects.toThrow(/SHIPMENT_API_TOKEN/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
