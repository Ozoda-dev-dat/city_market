---
name: Profile page modals
description: How the customer profile page modals are structured and where to find them
---

All 4 feature modals are inline components at top of app/(tabs)/profile.tsx:
- PaymentModal — radio-select; only cash active, others show "Tez orada"
- LanguageModal — flag + radio for UZ/RU; applies and closes immediately
- HelpModal — contact rows with Linking.openURL + FAQ accordion (openFaq: number|null, one open at a time)
- AboutModal — logo, info grid, links via Linking.openURL(..).catch(()=>{})

**Why:** Inline (not separate files) to avoid over-engineering; all share isDarkMode + Colors props.
**How to apply:** New settings features should follow same bottom-sheet pattern (mStyles.overlay + mStyles.sheet).
