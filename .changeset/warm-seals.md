---
"poe-idol-planner": minor
---

add scarabs map device, favorite mods, multi-select, and fix UI bugs
- add 5-slot map device for selecting scarabs with searchable dropdown and category filters
- scarab effects display in stats summary panel grouped by category
- fetch and parse scarab data from poedb.tw with local image caching
- storage schema v2 to v3 migration for mapDevice support
- fix tooltip overflow with collision detection on idol cards
- fix inventory and stats panel scroll issues with min-h-0 flex constraints
- fix grid hover detection so tooltips show when hovering any cell of an idol
- improve drag-and-drop visual feedback: custom drag image shows full idol with rarity border when dragging from any cell
- add favorite mods feature: click star icon to save frequently used mods, filter to show favorites only
- add multi-select for inventory: Ctrl+click to toggle selection, Shift+click for range select, bulk delete selected idols
