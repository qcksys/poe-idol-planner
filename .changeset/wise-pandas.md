---
"poe-idol-planner": patch
---

Improve storage validation to be granular - removes only invalid data items instead of clearing all storage when validation fails. Adds Sentry alerts with detailed Zod error context when invalid data is detected.

- Also clears `activeSetId` when it references a non-existent set
- Refactor tests to use shared realistic fixtures with varied idol sets, map devices, and edge cases
