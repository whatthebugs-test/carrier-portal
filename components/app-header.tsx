"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import type { CarrierSession } from "@/lib/session";

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/shipments", label: "Shipments" },
];

export function AppHeader({ session }: { session: CarrierSession | null }) {
  const pathname = usePathname();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="inline-block h-6 w-6 rounded bg-kestrel-600" aria-hidden />
            Kestrel <span className="font-normal text-ink-muted">Carrier Portal</span>
          </Link>
          {session && (
            <nav className="hidden gap-1 text-sm sm:flex">
              {NAV.map((item) => {
                const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "rounded-md px-3 py-1.5 font-medium",
                      active ? "bg-slate-100 text-ink" : "text-ink-muted hover:text-ink",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        {session && (
          <DropdownMenu.Root>
            <DropdownMenu.Trigger className="rounded-md px-2 py-1 text-sm hover:bg-slate-100">
              {session.name} <span className="text-ink-muted">· {session.scac}</span>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content align="end" sideOffset={6} className="card min-w-48 p-1 text-sm">
                <DropdownMenu.Label className="px-2 py-1.5 text-xs text-ink-muted">{session.carrierName}</DropdownMenu.Label>
                <DropdownMenu.Separator className="my-1 h-px bg-slate-100" />
                <DropdownMenu.Item
                  className="cursor-pointer rounded px-2 py-1.5 outline-none data-[highlighted]:bg-slate-100"
                  onSelect={() => signOut({ callbackUrl: "/login" })}
                >
                  Sign out
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        )}
      </div>
    </header>
  );
}
