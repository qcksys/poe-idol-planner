---
"poe-idol-planner": minor
---

refactor mod storage to use mod IDs for localization support

- Store mod IDs instead of text in saved data, enabling proper localization when switching languages
- Add mod text resolver utility that looks up localized text from modifier definitions
- Migrate storage from v4 to v5, stripping redundant text from matched mods
- Update display components to resolve mod text dynamically based on current locale
- Unmatched mods retain their original text as fallback
