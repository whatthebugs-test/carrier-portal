import type { DefaultSession } from "next-auth";

type CarrierRole = "admin" | "dispatcher" | "viewer";

declare module "next-auth" {
  interface User {
    carrierId: string;
    carrierName: string;
    scac: string;
    role: CarrierRole;
  }

  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      carrierId: string;
      carrierName: string;
      scac: string;
      role: CarrierRole;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    carrierId: string;
    carrierName: string;
    scac: string;
    role: CarrierRole;
  }
}
