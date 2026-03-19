import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCarrierSession } from "@/lib/session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

const ERRORS: Record<string, string> = {
  CredentialsSignin: "That email and password don't match a carrier account.",
  SessionRequired: "Sign in to continue.",
};

function safeCallback(url: string | undefined): string {
  // Only same-origin paths; next-auth passes absolute URLs through untouched.
  return url && url.startsWith("/") && !url.startsWith("//") ? url : "/";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const { callbackUrl, error } = await searchParams;
  const target = safeCallback(callbackUrl);

  if (await getCarrierSession()) redirect(target);

  return (
    <div className="mx-auto mt-12 max-w-sm">
      <div className="card p-8">
        <h1 className="text-xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-1 text-sm text-ink-muted">Use the account your carrier administrator set up for you.</p>
        <LoginForm callbackUrl={target} initialError={error ? (ERRORS[error] ?? "Sign-in failed. Try again.") : undefined} />
      </div>
      <p className="mt-4 text-center text-xs text-ink-muted">
        Need access? Email <a className="underline" href="mailto:carriers@kestrelfreight.io">carriers@kestrelfreight.io</a>.
      </p>
    </div>
  );
}
