---
"poe-idol-planner": patch
---

Improve storage validation to be granular - removes only invalid data items instead of clearing all storage when validation fails. Adds Sentry alerts with detailed Zod error context when invalid data is detected.
