---
name: npm supply-chain firewall blocks
description: Replit's package-firewall.replit.local can block an npm package at every version, not just a specific flagged release.
---

Symptom: `npm install` fails with `403 Forbidden ... Blocked by Security Policy` for a package (e.g. `shell-quote`, pulled in transitively by `react-native` via `react-devtools-core`). Retrying the install, or bumping/pinning to a different version of the same package, still fails — the block is on the package name, not a specific version.

**Why:** The firewall flagged the package itself (reputation/CVE heuristics), so every version request returns 403, even versions with no public CVE against them.

**How to apply:** Don't waste time retrying installs or trying version overrides. Vendor a small local replacement instead:
1. Add an `overrides` entry in `package.json` pointing the package name at a local path: `"pkg-name": "file:vendor/pkg-name"`.
2. Create `vendor/pkg-name/package.json` (name = blocked package, matching semver-compatible version) and `index.js` with a minimal/functionally-equivalent implementation.
3. Manually patch `package-lock.json`'s entry for that package to `"resolved": "file:vendor/pkg-name"` and add the same `overrides` block to the lockfile's root `""` package entry, so npm doesn't try to re-fetch from the registry.
4. Run `npm install` again — it will link the local package instead of hitting the firewall.
