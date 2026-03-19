import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod";
import { authenticateCarrierUser, ShipmentApiError } from "./shipment-api";

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    // Dispatchers keep the portal open all shift; re-auth daily.
    maxAge: 12 * 60 * 60,
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Kestrel carrier account",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        try {
          const user = await authenticateCarrierUser(parsed.data.email, parsed.data.password);
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            carrierId: user.carrier_id,
            carrierName: user.carrier_name,
            scac: user.scac,
            role: user.role,
          };
        } catch (err) {
          if (err instanceof ShipmentApiError && (err.status === 401 || err.status === 403)) return null;
          throw err;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.carrierId = user.carrierId;
        token.carrierName = user.carrierName;
        token.scac = user.scac;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: token.sub ?? "",
        carrierId: token.carrierId,
        carrierName: token.carrierName,
        scac: token.scac,
        role: token.role,
      };
      return session;
    },
  },
};
