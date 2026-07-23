export function formatDate(v?: string | Date | null): string {
  if (!v) return "\u2014";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "\u2014";
  return d.toISOString().slice(0, 10);
}

export function formatNumber(n?: number | string | null): string {
  if (n === null || n === undefined || n === "") return "\u2014";
  const num = typeof n === "string" ? Number(n) : n;
  if (Number.isNaN(num)) return String(n);
  return num.toLocaleString("en-US");
}

export function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!domain) return email;
  const head = user.slice(0, 2);
  return `${head}${"*".repeat(Math.max(1, user.length - 2))}@${domain}`;
}
