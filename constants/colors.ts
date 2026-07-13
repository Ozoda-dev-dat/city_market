const Colors = {
  primary: "#16A34A",
  primaryLight: "#DCFCE7",
  primaryDark: "#166534",
  primaryDeep: "#14532D",
  primaryGradientEnd: "#15803D",
  secondaryGreen: "#22C55E",
  mintGreen: "#4ADE80",
  mintGreenLight: "#86EFAC",
  mintGreenLighter: "#A7F3D0",

  accent: "#F97316",
  accentLight: "#FFF7ED",

  // Status / feature accent colors (mode-independent)
  info: "#3B82F6",
  infoDark: "#2563EB",
  cyan: "#0891B2",
  indigo: "#6366F1",
  indigoDark: "#4F46E5",
  purple: "#8B5CF6",
  emerald: "#10B981",
  telegram: "#2AABEE",
  payme: "#00AAFF",
  neutralPill: "#D1D5DB",

  background: "#F5F6F5",
  card: "#FFFFFF",
  cardBorder: "rgba(0,0,0,0.06)",

  text: "#111827",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",
  textInverse: "#FFFFFF",

  success: "#16A34A",
  successBgSoft: "#E8F5E9",
  warning: "#F59E0B",
  warningBg: "#FFFBEB",
  error: "#EF4444",
  errorBg: "#FEF2F2",

  tabIconDefault: "#9CA3AF",
  tint: "#16A34A",

  divider: "#F3F4F6",
  overlay: "rgba(0,0,0,0.5)",
  glass: "rgba(255,255,255,0.92)",
  glassDark: "rgba(0,0,0,0.08)",

  // Mode-dependent surface tokens (light values here, overridden in DarkColors)
  sheetBg: "#FFFFFF",
  inputBg: "#F8FAFC",
  inputBorder: "#E2E8F0",
  chipBg: "#F1F5F9",
  switchOffTrack: "#E2E8F0",
  infoBg: "#EFF6FF",
  cyanBg: "#E0F2FE",
  purpleBg: "#F5F3FF",
  indigoBg: "#EEF2FF",
  bannerGradientTop: "#D1FAE5",
  bannerGradientBottom: "#F0FDF4",
  screenGradientStart: "#d4ede0",
  screenGradientMid: "#eaf4ee",

  // Soft translucent card surface (distinct from sheetBg/inputBg)
  cardSoftBg: "#F8FAFC",
  surfaceMuted: "#F8FAFC",
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

  sheetBg: "#18181B",
  inputBg: "#27272A",
  inputBorder: "rgba(255,255,255,0.1)",
  chipBg: "rgba(255,255,255,0.06)",
  switchOffTrack: "#3F3F46",
  infoBg: "rgba(59,130,246,0.12)",
  cyanBg: "rgba(8,145,178,0.15)",
  purpleBg: "rgba(139,92,246,0.12)",
  indigoBg: "rgba(99,102,241,0.12)",
  bannerGradientTop: "#0D1F14",
  bannerGradientBottom: "#111827",
  screenGradientStart: "#0a1f12",
  screenGradientMid: "#0f0f12",

  cardSoftBg: "rgba(255,255,255,0.06)",
  surfaceMuted: "#111827",
};

export default function getColors(isDarkMode: boolean = false) {
  return isDarkMode ? DarkColors : Colors;
}

// Named export for mode-independent tokens (brand/status colors that are
// identical in light and dark mode) — safe to use in module-level
// StyleSheet.create() blocks that don't have access to isDarkMode.
export { Colors };
