---
"poe-idol-planner": patch
---

Improve weight filter for trade searches:
- The "not" query group now excludes all high-weight mods that can roll on the idol type (not the idol's own mods)
- All mods on the idol are now searched for regardless of weight (previously high-weight mods were skipped)
- Weight filter threshold is now inclusive (>= instead of >)
- Single mod searches in the Browse Mods modal now respect the weight filter settings
- Added "Only exclude matching affix type" toggle for single mod searches to filter by prefix/suffix type
