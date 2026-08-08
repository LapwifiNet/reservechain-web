import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { ConditionalShell } from "@/components/ConditionalShell";

export const metadata: Metadata = {
  title: "OpenRWA \u2014 Admin Console",
  description:
    "Operational admin console for the OpenRWA industrial-metals RWA platform (testnet demo).",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ConditionalShell sidebar={<Sidebar />} topbar={<Topbar />}>
          {children}
        </ConditionalShell>
      </body>
    </html>
  );
}
