"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string; icon: string; gated?: boolean };

const nav: { group: string; items: Item[] }[] = [
  {
    group: "Operations",
    items: [
      { href: "/", label: "Overview", icon: "\u25a3" },
      { href: "/registry", label: "Asset Registry", icon: "\u25a4" },
      { href: "/programs", label: "Programs", icon: "\u25c8" },
      { href: "/passports", label: "Digital Passports", icon: "\u2756" },
      { href: "/waitlist", label: "Waitlist", icon: "\u2630" },
      { href: "/tokenomics", label: "Tokenomics", icon: "\u25ce" },
    ],
  },
  {
    group: "Compliance & Ops",
    items: [
      {
        href: "/reserves",
        label: "Reserve Reports",
        icon: "\u25a6",
        gated: true,
      },
      { href: "/kyc", label: "KYC / KYB", icon: "\u2611", gated: true },
      { href: "/redemption", label: "Redemption", icon: "\u21c4", gated: true },
      { href: "/audit", label: "Audit Log", icon: "\u2263", gated: true },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface md:flex">
      <div className="flex h-16 items-center gap-2 border-b border-border px-5">
        <span className="h-7 w-7 rounded-md bg-gradient-to-br from-copper to-nickel" />
        <div>
          <div className="text-sm font-semibold leading-none">ReserveChain</div>
          <div className="mt-0.5 text-[11px] text-text-2">Admin Console</div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        {nav.map((section) => (
          <div key={section.group} className="mb-6">
            <div className="mb-2 px-5 text-[11px] uppercase tracking-wider text-text-2">
              {section.group}
            </div>
            <ul className="space-y-0.5 px-2">
              {section.items.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                        active
                          ? "bg-surface-2 text-text"
                          : "text-text-2 hover:bg-surface-2/60 hover:text-text"
                      }`}
                    >
                      <span className="w-4 text-center opacity-70">
                        {item.icon}
                      </span>
                      <span className="flex-1">{item.label}</span>
                      {item.gated && (
                        <span className="rounded bg-warning/15 px-1.5 py-0.5 text-[10px] text-warning">
                          inactive
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-border p-4 text-[11px] text-text-2">
        Testnet demo \u00b7 all figures illustrative
      </div>
    </aside>
  );
}
