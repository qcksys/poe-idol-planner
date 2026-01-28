---
"poe-idol-planner": minor
---

Remove redundant schema fields and derive values at runtime:
- Remove `tab` and `activeTab` from idol set schema (tabs feature removed)
- Remove `valueRange` and `mechanic` from modifier schema (derivable from modId)
- Remove `corrupted` from idol schema (idols cannot be corrupted)
- Add `getModValueRange()` helper for runtime value range derivation
- Existing data migrates automatically via Zod schema parsing
