---
"poe-idol-planner": minor
---

Consolidate trade stat mappings into idol-modifiers.json. The converter now fetches trade stats directly from the POE API and embeds `tradeStatId` into each modifier tier, eliminating the separate trade-stat-mappings files.

- Improve trade stat matching to handle decimal number ranges (e.g., `(0.8—1.2)%`)
- Add direction word canonicalization so opposite modifiers match (reduced↔increased, less↔more, slower↔faster, fewer↔additional)
- Reduce unmatched modifiers from 31 to 8 (74% improvement)
