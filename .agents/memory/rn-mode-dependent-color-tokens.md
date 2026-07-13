---
name: RN mode-dependent color tokens vs module-level StyleSheet
description: Why getColors(isDarkMode) tokens can't be used in module-level StyleSheet.create blocks, and the pattern used to fix it.
---

In this Expo/React Native app, `constants/colors.ts` exposes both a default `getColors(isDarkMode)` (returns `Colors` or `DarkColors`) and a named `export { Colors }` for mode-independent tokens (brand/status colors identical in both themes).

Rule: any color reference inside a module-level `StyleSheet.create({...})` (declared outside a component, so it runs once at import time before `isDarkMode` is known) must use the named `Colors` export (aliased `StaticColors` in imports), never the per-render `const C = getColors(isDarkMode)` variable — that variable does not exist in module scope and causes a silent `ReferenceError: C is not defined` at runtime (TypeScript doesn't catch it if `C`/`Colors` is also a common local name elsewhere in the file).

**Why:** hit this exact runtime crash after bulk-migrating hardcoded hex colors to tokens in the customer-facing tab screens (index/cart/orders/profile) — mode-dependent tokens (sheetBg, inputBg, etc.) only exist on the per-render `C`/`Colors` object from `getColors()`, but mode-independent ones (primary, error, textInverse, neutralPill, etc.) are safe to hoist to module scope via the static export.

**How to apply:** when centralizing colors into a design-token file for a RN/Expo app, always split tokens into (a) mode-independent — safe for static export and module-level styles — and (b) mode-dependent — must be read via a hook/getter inside component render, never at module scope.
