"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <button
      onClick={logout}
      disabled={loading}
      className="rounded-md border border-border px-2.5 py-1 text-xs text-text-2 transition-colors hover:bg-surface-2 hover:text-text disabled:opacity-50"
    >
      {loading ? "Signing out\u2026" : "Sign out"}
    </button>
  );
}
