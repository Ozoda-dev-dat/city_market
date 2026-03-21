const Colors = {
  primary: "#E53E3E", // Logo red
  primaryLight: "#FFF5F5", // Light red background
  primaryDark: "#C53030", // Darker red
  accent: "#38A169", // Logo green
  accentLight: "#F0FFF4", // Light green background

  background: "#F8FAFC", // Modern light gray
  card: "#FFFFFF",
  cardBorder: "rgba(229, 62, 62, 0.1)", // Transparent red border

  text: "#000000", // Pure black for maximum contrast
  textSecondary: "#2D3748", // Dark gray for secondary text
  textMuted: "#4A5568", // Medium gray for muted text
  textInverse: "#FFFFFF",

  success: "#38A169", // Green for success
  warning: "#D69E2E",
  error: "#E53E3E", // Red for error

  tabIconDefault: "#A0AEC0",
  tint: "#E53E3E",

  divider: "rgba(229, 62, 62, 0.08)", // Very light transparent divider
  overlay: "rgba(0, 0, 0, 0.3)", // Modern overlay
  glass: "rgba(248, 250, 252, 0.8)", // Glass effect matching background
  glassDark: "rgba(255, 255, 255, 0.1)", // Dark glass effect
};

const DarkColors = {
  ...Colors,
  background: "#0F0F0F", // Modern dark background
  card: "rgba(255, 255, 255, 0.05)", // Transparent dark card
  cardBorder: "rgba(229, 62, 62, 0.2)", // Transparent red border
  text: "#F8FAFC", // Light text
  textSecondary: "#E2E8F0", // Light secondary text
  textMuted: "#94A3B8", // Better contrast for dark mode muted text
  divider: "rgba(255, 255, 255, 0.08)", // Transparent divider
  overlay: "rgba(0, 0, 0, 0.5)", // Dark overlay
  glass: "rgba(15, 15, 15, 0.6)", // Dark glass effect matching background
  glassDark: "rgba(0, 0, 0, 0.3)", // Even darker glass
};

export default function getColors(isDarkMode: boolean = false) {
  return isDarkMode ? DarkColors : Colors;
}
