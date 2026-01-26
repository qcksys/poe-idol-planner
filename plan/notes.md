# Notes: POE Idol Planner Enhancements

## Codebase Analysis

### Component Architecture

#### Tooltip System
- Uses shadcn/ui `Tooltip` (Radix UI under the hood)
- `TooltipContent` supports `side`, `sideOffset`, `align`, `collisionBoundary`, `collisionPadding`
- Current: `side="right"` on inventory cards, no collision handling
- Radix docs: https://www.radix-ui.com/primitives/docs/components/tooltip

#### Scroll Components
- `ScrollArea` from shadcn/ui wraps content with custom scrollbar
- Requires explicit height constraint on parent or fixed height
- `CommandList` uses `max-h-[300px]` with `overflow-y-auto`

#### Drag-and-Drop
- Custom DnD using native HTML5 drag API
- `setDragImage()` not currently used - shows native drag preview
- Offset tracking: `dragOffset` in DnD context tracks relative position
- Issue: Single cell drag preview, not full idol shape

### Grid Hover Bug Analysis
```
Grid cell types:
1. Origin cell (dx=0, dy=0) → Renders IdolCardMini with tooltip
2. Non-origin occupied → Renders invisible drag handle div
3. Empty valid → Drop target
4. Invalid → Blocked cell visual

Problem: Hovering non-origin cell doesn't trigger tooltip because:
- IdolCardMini only at origin position
- Non-origin cells are separate div elements
- No pointer-events pass-through to IdolCardMini
```

### Modal Overflow Analysis
```tsx
// idol-editor.tsx:389
<DialogContent className="flex max-h-[85vh] max-w-[1000px] flex-col overflow-hidden">
  // ...
  <ScrollArea className="min-h-0 flex-1 pr-4">
```
- `overflow-hidden` on DialogContent
- `flex-1` + `min-h-0` on ScrollArea should work
- May need `h-full` or explicit height calculation

---

## Default Favorite Mods

### High-Value Generic Mods (from idol-modifiers.json)
- **Quantity**: "X% increased Quantity of Items found in this Area"
- **Rarity**: "X% increased Rarity of Items found in this Area"
- **Pack Size**: "X% increased Pack Size of Monster Packs in this Area"
- **Magic Monsters**: "Areas contain X additional packs of Magic Monsters"
- **Rare Monsters**: "Areas contain X additional packs of Rare Monsters"
- **Experience**: "X% increased Experience gain in this Area"
- **Scarab Effect**: (if exists) Enhanced scarab effects

### Mechanic-Specific Valuable Mods
- Breach: Additional splinters, breach hand spawns
- Delirium: Increased delirium rewards, simulacrum splinters
- Expedition: Additional remnants, logbooks
- Ritual: Tribute, favor, reroll options
- Incursion: Room upgrades, temple tier
- Blight: Additional rewards, lanes

---

## Trade System Notes

### Current Implementation (`trade-search.ts`)
- `generateTradeUrl(idol)` - Full idol search with mods
- `generateTradeUrlForBaseType(baseType)` - Base type only
- `generateTradeUrlForMod(mod, baseType)` - Specific mod
- `getTradeStatId(modText)` - Maps mod text to POE trade stat ID
- Trade URL: `https://www.pathofexile.com/trade2/search/Phrecia?q=...`

### Trade Query Structure
```typescript
interface TradeQuery {
  query: {
    status: { option: "online" },
    stats: [{
      type: "and",
      filters: [{ id: string, value?: { min?, max? } }]
    }],
    filters: {
      type_filters: { filters: { rarity: { option: string } } },
      misc_filters: { filters: { ilvl: { min: number } } }
    }
  }
}
```

---

## Scarab System Design

### POE Scarabs (Phrecia context)
- Scarabs are map items that add modifiers to maps
- Categories: Breach, Legion, Abyss, Expedition, etc.
- Tiers: Rusted, Polished, Gilded, Winged
- Effect: Adds specific content/rewards to area

### Proposed Schema
```typescript
interface Scarab {
  id: string;
  type: ScarabType; // breach, legion, abyss, etc.
  tier: ScarabTier; // rusted | polished | gilded | winged
  effect: string;   // Description
}

interface ScarabSet {
  id: string;
  scarabs: Scarab[]; // Up to 4 per map device
}
```

### UI Considerations
- Simpler than idol grid (no placement, just 4 slots)
- Could be a row of 4 dropdowns or drag targets
- Filter by category, tier
- Show combined effects

---

## Multi-Select Design

### Interaction Patterns
- Click: Select single (deselect others)
- Ctrl+Click: Toggle selection
- Shift+Click: Range selection
- Ctrl+A: Select all visible
- Escape: Deselect all

### State Structure
```typescript
interface IdolSet {
  // ... existing
  selectedInventoryIds: string[]; // NEW
}
```

### Bulk Operations
- Delete selected
- Duplicate selected
- Move to another set
- Export selected

---

## Shared Strategies Design

### What is a Strategy?
A strategy could include:
1. Complete idol set with placements
2. Scarab configuration (if implemented)
3. Notes/description from creator
4. Metadata (creator, date, rating?)

### Storage
```typescript
interface SharedStrategy {
  id: string;
  name: string;
  description?: string;
  author?: string;
  createdAt: number;
  sets: IdolSet[];
  scarabs?: ScarabSet;
  tags?: string[]; // farming, bossing, etc.
}
```

### Cloudflare KV Structure
- Key: `strategy:{id}`
- Value: JSON of SharedStrategy
- List endpoint: Paginated fetch of recent strategies

---

## Translation Types CLI

### Current Structure
```
app/i18n/locales/
├── en.json
├── zh.json
├── pt.json
└── ... (10 languages)
```

### Type Generation Approach
1. Read `en.json` as source of truth
2. Generate TypeScript interface recursively
3. Output to `app/i18n/types.ts`
4. Update `useTranslations` hook to use generated type

### Script Design
```bash
# package.json
"scripts": {
  "i18n:types": "node scripts/generate-i18n-types.js"
}
```

```typescript
// Output: app/i18n/types.ts
export interface Translations {
  inventory: {
    title: string;
    search: string;
    // ...
  };
  // ...
}
```
