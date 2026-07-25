"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        setError(
          res.status === 502
            ? "Backend unreachable. Is the API running?"
            : "Invalid email or password.",
        );
        setLoading(false);
        return;
      }
      const from = params.get("from") || "/";
      router.replace(from);
      router.refresh();
    } catch {
      setError("Network error.");
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border border-border bg-surface p-6"
    >
      <h1 className="text-lg font-semibold">Sign in</h1>
      <p className="mt-1 text-sm text-text-2">
        Admin &amp; compliance access only.
      </p>

      {error && (
        <div className="mt-4 rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}

      <label className="mt-5 block text-xs text-text-2" htmlFor="email">
        Email
      </label>
      <input
        id="email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="username"
        className="mt-1 w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm outline-none focus:border-brand"
        placeholder="admin@reservechain.local"
      />

      <label className="mt-4 block text-xs text-text-2" htmlFor="password">
        Password
      </label>
      <input
        id="password"
        type="password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
        className="mt-1 w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm outline-none focus:border-brand"
        placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
      />

      <button
        type="submit"
        disabled={loading}
        className="mt-6 w-full rounded-md bg-brand px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Signing in\u2026" : "Sign in"}
      </button>

      <p className="mt-4 text-[11px] text-text-2">
        Testnet demo \u00b7 sessions expire after 12h.
      </p>
    </form>
  );
}
