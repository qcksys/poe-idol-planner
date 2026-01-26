---
"poe-idol-planner": patch
---

- fix idol grid hover to show remove/copy buttons when hovering any cell of multi-cell idols, not just the top-left origin cell
- fix tooltip positioning to show on the opposite side when hovering wide idols (left half shows tooltip on right, right half shows on left)
- fix drag-and-drop to allow dropping an idol onto its own position for repositioning
- add Zod validation for share ID format in share API endpoint
- add Zod validation for league query parameter in scarab prices API endpoint
