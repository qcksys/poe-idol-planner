---
"poe-idol-planner": minor
---

feat: parse imported idol values into preset mods for editing

When importing an idol from POE clipboard, the parser now matches modifier text against known modifier definitions. This allows imported idols to be edited with the preset mods already filled out (correct tier, rolled value, modifier ID, and mechanic).

- Added `mod-matcher.ts` with text normalization and matching logic
- Integrated matching into `idol-parser.ts` conversion flow
- Added comprehensive tests for matching and integration
