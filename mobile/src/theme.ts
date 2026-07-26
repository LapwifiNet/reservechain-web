// Dark-first design tokens (shared with the web design system).
export const colors = {
  canvas: "#0E1116",
  surface: "#171A21",
  surface2: "#1F232C",
  border: "#2A2F3A",
  text: "#ECEEF1",
  text2: "#A2ABB8",
  copper: "#C0703B",
  nickel: "#6B7785",
  brand: "#2783DE",
  ok: "#46A171",
  warn: "#D5803B",
  danger: "#E56458",
} as const;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
export const radius = { sm: 8, md: 12, lg: 16 } as const;
export const font = {
  h1: 28,
  h2: 22,
  h3: 18,
  body: 15,
  small: 13,
} as const;

export type Colors = typeof colors;
