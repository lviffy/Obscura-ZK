// Shared design tokens - hardcoded hex.
// Use these with inline style={} for dynamic color props.
// For static Tailwind classes, use bg-bg, text-text, bg-accent, etc. (registered in @theme).

export const T = {
  bg:       "#09090b",
  surface:  "#18181b",
  border:   "#27272a",
  borderHi: "#3f3f46",
  text:     "#fafafa",
  muted:    "#a1a1aa",
  mutedLo:  "#71717a",
  mono:     "#d4d4d8",
  accent:   "#e5ff47",
  accentH:  "#d4ee36",
  error:    "#f87171",
  success:  "#4ade80",
  r:        "2px",   // button radius
} as const;
