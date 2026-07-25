import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Sign in \u2014 ReserveChain Admin",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3">
          <span className="h-9 w-9 rounded-md bg-gradient-to-br from-copper to-nickel" />
          <div>
            <div className="text-base font-semibold leading-none">
              ReserveChain
            </div>
            <div className="mt-1 text-xs text-text-2">Admin Console</div>
          </div>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
