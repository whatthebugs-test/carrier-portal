import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "./auth";

export type CarrierSession = {
  userId: string;
  name: string;
  email: string;
  carrierId: string;
  carrierName: string;
  scac: string;
  role: "admin" | "dispatcher" | "viewer";
};

export async function getCarrierSession(): Promise<CarrierSession | null> {
  const session = await getServerSession(authOptions);
  const user = session?.user;
  if (!user?.carrierId) return null;
  return {
    userId: user.id,
    name: user.name ?? user.email ?? "",
    email: user.email ?? "",
    carrierId: user.carrierId,
    carrierName: user.carrierName,
    scac: user.scac,
    role: user.role,
  };
}

/** For pages and server actions. Middleware already gates routes, this covers direct action calls. */
export async function requireCarrierSession(): Promise<CarrierSession> {
  const session = await getCarrierSession();
  if (!session) redirect("/login");
  return session;
}

export function canBook(session: CarrierSession): boolean {
  return session.role === "admin" || session.role === "dispatcher";
}
