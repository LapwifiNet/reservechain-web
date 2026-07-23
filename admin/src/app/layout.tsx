import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";

export const metadata: Metadata = {
  title: "ReserveChain \u2014 Admin Console",
  description:
    "Operational admin console for the ReserveChain industrial-metals RWA platform (testnet demo).",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <Topbar />
            <main className="flex-1 p-6 lg:p-8">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
