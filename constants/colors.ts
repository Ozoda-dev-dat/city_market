const Colors = {
  primary: "#16A34A",
  primaryLight: "#DCFCE7",
  primaryDark: "#166534",

  accent: "#F97316",
  accentLight: "#FFF7ED",

  background: "#F5F6F5",
  card: "#FFFFFF",
  cardBorder: "rgba(0,0,0,0.06)",

  text: "#111827",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",
  textInverse: "#FFFFFF",

  success: "#16A34A",
  warning: "#F59E0B",
  error: "#EF4444",

  tabIconDefault: "#9CA3AF",
  tint: "#16A34A",

  divider: "#F3F4F6",
  overlay: "rgba(0,0,0,0.5)",
  glass: "rgba(255,255,255,0.92)",
  glassDark: "rgba(0,0,0,0.08)",
};

const DarkColors = {
  ...Colors,
  background: "#0C0C0E",
  card: "#1C1C1E",
  cardBorder: "rgba(255,255,255,0.08)",
  text: "#F9FAFB",
  textSecondary: "#A1A1AA",
  textMuted: "#71717A",
  divider: "#27272A",
  glass: "rgba(28,28,30,0.95)",
  glassDark: "rgba(0,0,0,0.3)",
};

export default function getColors(isDarkMode: boolean = false) {
  return isDarkMode ? DarkColors : Colors;
}
