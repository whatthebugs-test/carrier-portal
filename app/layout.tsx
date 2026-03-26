import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppHeader } from "@/components/app-header";
import { getCarrierSession } from "@/lib/session";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Kestrel Carrier Portal",
    template: "%s · Kestrel Carrier Portal",
  },
  description: "Tender, track and manage Kestrel Freight shipments.",
  robots: { index: false, follow: false },
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const session = await getCarrierSession();

  return (
    <html lang="en">
      <body className="min-h-screen font-sans">
        <Providers>
          <AppHeader session={session} />
          <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
