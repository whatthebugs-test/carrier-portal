import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CarrierSession } from "@/lib/session";

const mocks = vi.hoisted(() => ({
  session: vi.fn<() => Promise<CarrierSession>>(),
  createShipment: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw Object.assign(new Error("NEXT_REDIRECT"), { url });
  }),
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/session", () => ({
  requireCarrierSession: mocks.session,
  canBook: (s: CarrierSession) => s.role !== "viewer",
}));
vi.mock("@/lib/shipment-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/shipment-api")>()),
  createShipment: mocks.createShipment,
}));

const { createShipmentAction } = await import("./actions");
const { ShipmentApiError } = await import("@/lib/shipment-api");

const dispatcher: CarrierSession = {
  userId: "usr_41",
  name: "Luis Ortega",
  email: "dispatch@midsouthtransport.com",
  carrierId: "car_mdt",
  carrierName: "Mid-South Transport",
  scac: "MDTX",
  role: "dispatcher",
};

const tender = {
  reference: "PO-88213",
  origin: { name: "Delta Cold Storage", street1: "4120 Lamar Ave", city: "Memphis", state: "TN", postal_code: "38118", country: "US" },
  destination: { name: "Rickenbacker DC 3", street1: "2700 Port Rd", city: "Columbus", state: "OH", postal_code: "43217", country: "US" },
  pickup_date: "2099-01-05",
  weight_lbs: 8200,
  pieces: 6,
  freight_class: "70",
  hazmat: false,
};

describe("createShipmentAction", () => {
  beforeEach(() => {
    mocks.session.mockResolvedValue(dispatcher);
    mocks.createShipment.mockReset();
    mocks.redirect.mockClear();
  });

  it("tenders the shipment for the session's carrier and redirects to it", async () => {
    mocks.createShipment.mockResolvedValueOnce({ id: "shp_01JD3K8W1V" });

    await expect(createShipmentAction(tender)).rejects.toThrow("NEXT_REDIRECT");

    expect(mocks.createShipment).toHaveBeenCalledWith("car_mdt", expect.objectContaining({ weight_lbs: 8200 }));
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/shipments");
    expect(mocks.redirect).toHaveBeenCalledWith("/shipments/shp_01JD3K8W1V");
  });

  it("ignores a carrier_id supplied by the client", async () => {
    mocks.createShipment.mockResolvedValueOnce({ id: "shp_01JD3K8W1V" });

    await createShipmentAction({ ...tender, carrier_id: "car_other" }).catch(() => undefined);

    const [carrierId, input] = mocks.createShipment.mock.calls[0]!;
    expect(carrierId).toBe("car_mdt");
    expect(input).not.toHaveProperty("carrier_id");
  });

  it("returns field errors keyed by path without calling shipment-api", async () => {
    const result = await createShipmentAction({ ...tender, origin: { ...tender.origin, postal_code: "ABC" } });

    expect(result.fieldErrors).toHaveProperty(["origin.postal_code"]);
    expect(mocks.createShipment).not.toHaveBeenCalled();
  });

  it("refuses viewers", async () => {
    mocks.session.mockResolvedValueOnce({ ...dispatcher, role: "viewer" });

    const result = await createShipmentAction(tender);

    expect(result.formError).toMatch(/not tender/);
    expect(mocks.createShipment).not.toHaveBeenCalled();
  });

  it("surfaces shipment-api validation messages", async () => {
    mocks.createShipment.mockRejectedValueOnce(new ShipmentApiError("Pickup window closed for 2099-01-05", 422));

    const result = await createShipmentAction(tender);

    expect(result.formError).toBe("Pickup window closed for 2099-01-05");
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
