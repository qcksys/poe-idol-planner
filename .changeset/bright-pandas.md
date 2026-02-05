---
"poe-idol-planner": minor
---

Improve UI layout, state management, and code organization

- Add weight numbers to mod displays in inventory cards, idol editor, and mod search dropdowns
- Reorganize layout: move Browse Mods and League Selector to card above inventory, Share button above idol grid
- Replace ExternalLink with ShoppingCart icon for trade search buttons
- Make inventory action icons always visible instead of hover-only
- Improve idol editor layout with name field next to type field
- Add horizontal ScrollArea for set tabs with fixed New Set and Import buttons
- Fix league selector to default to first available league if stored league not found
- Fix inventory panel layout to prevent overflow under footer
- Make league selector full width with matching popover width
- Remove mechanics and weight filters from inventory panel (still available in Browse Mods)
- Add useStorageState hook for persistent state management in favorites and trade settings
- Add storage utility functions for loading and saving settings with validation
- Refactor grid logic by extracting utility functions to grid-utils module
- Update localization strings for 'browseMods' and 'share' actions across multiple languages
