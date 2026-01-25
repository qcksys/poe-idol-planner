---
"poe-idol-planner": minor
---

Update poedb parser to fetch mods per idol type from individual pages

- Parse individual idol pages (Minor, Noble, Kamasan, Burial, Totemic, Conqueror) instead of general Idols page
- Extract modifier data from embedded ModsView JSON with accurate value ranges per idol type
- Track `idolSource` and `modFamily` for each modifier to enable proper filtering
- Generate unique mod IDs that include idol type (e.g., `prefix_minor_additional_abyss_chance`)
- Correctly map ModGenerationTypeID to prefix (1) or suffix (2)
- 757 total modifiers parsed with proper idol type distribution
- Add 28 unit tests for poedb parser covering parsing, value extraction, and error handling
