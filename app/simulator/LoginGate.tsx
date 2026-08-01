"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconLock } from "../components/Icons";

export default function LoginGate({ configured }: { configured: boolean }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/simulator/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Login failed.");
      }
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative grid min-h-screen place-items-center px-5">
      <div aria-hidden className="grid-bg absolute inset-0" />
      <div className="relative w-full max-w-sm rounded-xl border border-line bg-ink-850 p-8 shadow-2xl shadow-ink-950/60">
        <span className="grid h-11 w-11 place-items-center rounded-lg border border-line-strong bg-ink-800 text-accent">
          <IconLock className="h-5 w-5" />
        </span>

        <h1 className="mt-5 text-xl font-semibold tracking-tight text-fg">
          Portfolio Simulator
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-fg-muted">
          Host-only access, for session facilitator use. Enter the shared host
          password to run the backtest.
        </p>

        {!configured && (
          <p className="mt-4 rounded-lg border border-warn/25 bg-warn/[0.07] px-3.5 py-2.5 text-xs leading-relaxed text-warn">
            <code className="font-mono">SIMULATOR_PASSWORD</code> is not set on
            the server. Add it to <code className="font-mono">.env.local</code>{" "}
            (or your Vercel env vars) and restart.
          </p>
        )}

        <form onSubmit={submit} className="mt-6 space-y-3">
          <div>
            <label htmlFor="host-password" className="sr-only">
              Host password
            </label>
            <input
              id="host-password"
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "login-error" : undefined}
              className="w-full rounded-lg border border-line-strong bg-ink-900 px-3.5 py-2.5 text-sm text-fg placeholder:text-fg-dim focus:border-accent focus:outline-none"
            />
          </div>

          {error && (
            <p id="login-error" role="alert" className="text-sm text-neg">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !configured}
            className="w-full cursor-pointer rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-ink-950 transition-colors duration-200 hover:bg-[#6ba0ff] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Checking…" : "Unlock"}
          </button>
        </form>

        <Link
          href="/"
          className="mt-5 block text-center text-xs text-fg-dim transition-colors duration-200 hover:text-fg"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
