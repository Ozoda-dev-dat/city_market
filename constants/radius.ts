/**
 * Centralized border-radius scale.
 * Use these tokens instead of hardcoded numeric borderRadius values so the
 * whole app shares one consistent "roundness" language.
 *
 * Circular/avatar-style radii that depend on a dynamic container size
 * (e.g. `size / 2`) are NOT part of this scale — compute those inline.
 */
export const Radius = {
  xs: 8,    // small chips/tags, small buttons
  sm: 12,   // standard buttons, inputs
  md: 16,   // cards (ProductCard, list items)
  lg: 20,   // larger cards, section containers
  xl: 24,   // modal / bottom-sheet corners
  xxl: 32,  // large bottom sheets
  full: 999, // pill-shaped buttons/badges
} as const;

export type RadiusToken = keyof typeof Radius;
