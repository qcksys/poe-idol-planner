---
"poe-idol-planner": minor
---

fix drag and drop and add idol move functionality:
- fix drag and drop by switching from DropdownMenu to ContextMenu (left-click now drags, right-click opens trade menu)
- add ability to drag and reposition idols already placed on the grid
- size placed idols based on CELL_SIZE constant (64px) instead of hardcoded values
- track source placement during drag operations for proper collision detection
