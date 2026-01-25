# Task Plan: POE Idol Planner SPA

## Goal
Build a comprehensive Path of Exile idol planning tool for the Legacy of Phrecia event that allows users to plan, save, share, and search for idol configurations.

## Phases
- [x] Phase 1: Research & Data Gathering
- [x] Phase 2: Data Converter Script (poedb → JSON)
- [x] Phase 3: Data Model & Schema Design
- [x] Phase 4: Localization Setup
- [x] Phase 5: Core UI Components
- [x] Phase 6: State Management & Storage
- [x] Phase 7: Sharing & KV Integration
- [ ] Phase 8: Trade Search Generation
- [ ] Phase 9: Search & Filtering
- [ ] Phase 10: Polish & Testing

## Key Questions (Answered)
1. ✅ Idol data: 6 base types (1x1 to 3x1/2x2), 503 mods, prefixes/suffixes with 8 tiers
2. ✅ Import formats: Two in-game copy modes (Ctrl+C simple, Ctrl+Alt+C advanced with tiers)
3. ✅ Trade API: POST to /api/trade/search/{league}, stats use IDs like "explicit.stat_123"
4. ✅ Grid: 32 slots across 3 tabs, sizes are 1x1, 1x2, 1x3, 2x1, 3x1, 2x2
5. ✅ League mechanics: 20+ including Abyss, Legion, Ultimatum, Harvest, etc.

## Features Required
- [ ] Data converter script (poedb.tw → JSON) - CLI tool
- [ ] JSON Schema validation for generated data (Zod 4)
- [ ] Idol inventory (imported idols storage)
- [ ] Idol setup UI with grid placement
- [ ] Multiple idol sets management
- [ ] LocalStorage persistence
- [ ] Share via Cloudflare KV serialization
- [ ] Copy/paste import functionality
- [ ] Trade search generation
- [ ] Total stats display per set
- [ ] Idol search with league mechanic filters
- [ ] Localization (i18n) support

## Decisions Made
- Use React 19 + React Router 7 (existing stack)
- Use Zod 4 for schema validation + JSON Schema generation
- Use shadcn/ui for UI components (with Tailwind CSS 4)
- Use KV_SAVE binding for shared idol sets
- Client-side state with localStorage + URL serialization
- Lightweight custom i18n (no heavy library needed)
- poedb-converter as standalone CLI script with tsx
- Modifier text localized from poedb sources, UI strings in JSON files
- Idol inventory separate from sets (import once, use in multiple sets)

## Errors Encountered
- (none yet)

## Status
**Currently completing Phase 7** - Sharing & KV Integration complete, ready for Phase 8 (Trade Search)

### Completed
- Phase 2: poedb-converter script created and tested
  - Fetches idol modifier data from poedb.tw (with caching)
  - Parses HTML tables for prefixes/suffixes
  - Extracts: level req, mod type, text, value ranges, mechanics
  - Outputs 503 modifiers to JSON
  - Generates JSON schemas using Zod 4's toJSONSchema

- Phase 3: Data Model & Schema Design
  - Zod schemas for idol, idol-set, inventory, storage
  - Base idol types with dimensions and image paths
  - League mechanics enum

- Phase 4: Localization Setup
  - i18n provider with hydration handling
  - English translations complete
  - Locale detection and persistence

- Phase 5/6: Core UI & State
  - Home route with 3-column layout
  - Inventory panel with search/filter and draggable items
  - Idol grid with tabs and drop targets
  - Set tabs with CRUD operations
  - Stats summary panel with mechanic grouping
  - Import modal with clipboard parser (simple & advanced formats)
  - LocalStorage persistence with Zod validation
  - useInventory and useIdolSets hooks
  - DnD context for drag-and-drop state
  - Idol images for grid display (added to public/images)
  - IdolCardMini shows idol images with rarity borders

- Phase 7: Sharing & KV Integration
  - Share schema (app/schemas/share.ts) - SharedSet with idols, set, expiry
  - Share library (app/lib/share.ts) - createSharePayload, saveShare, loadShare
  - API routes: POST /api/share, GET /api/share/:id
  - Share route (app/routes/share.$id.tsx) - load shared set and import
  - ShareModal component with copy-to-clipboard
  - 30-day TTL for shared sets in KV

### In Progress
- (none)

---

# Implementation Plan

## File Structure

```
scripts/
├── poedb-converter/
│   ├── index.ts              # Main CLI entry point
│   ├── fetcher.ts            # Fetch poedb.tw pages
│   ├── parser.ts             # Parse HTML tables to structured data
│   ├── transformer.ts        # Transform to app data format
│   ├── output.ts             # Write JSON/TS files
│   └── schema-gen.ts         # Generate JSON Schema from Zod
app/
├── data/
│   ├── idol-bases.ts         # 6 base idol types
│   ├── idol-modifiers.json   # Generated: All prefix/suffix mods
│   ├── unique-idols.json     # Generated: Unique idol data
│   ├── league-mechanics.ts   # League mechanic categories
│   └── schemas/              # Generated JSON Schemas
│       ├── idol-modifiers.schema.json
│       └── unique-idols.schema.json
├── i18n/
│   ├── index.ts              # i18n setup and hook
│   ├── locales/
│   │   ├── en.json           # English (default)
│   │   ├── zh-TW.json        # Traditional Chinese
│   │   ├── zh-CN.json        # Simplified Chinese
│   │   ├── ko.json           # Korean
│   │   ├── ja.json           # Japanese
│   │   ├── ru.json           # Russian
│   │   ├── pt-BR.json        # Portuguese (Brazil)
│   │   ├── de.json           # German
│   │   ├── fr.json           # French
│   │   └── es.json           # Spanish
│   └── types.ts              # Translation key types
├── schemas/
│   ├── idol.ts               # Zod schemas for idols
│   ├── idol-set.ts           # Zod schemas for idol sets
│   ├── inventory.ts          # Zod schema for idol inventory
│   └── storage.ts            # Zod schema for localStorage format
├── lib/
│   ├── idol-parser.ts        # Parse clipboard (Ctrl+C & Ctrl+Alt+C formats)
│   ├── trade-search.ts       # Generate trade API URLs
│   ├── storage.ts            # localStorage helpers
│   └── share.ts              # KV share link helpers
├── hooks/
│   ├── use-idol-sets.ts      # Manage multiple idol sets
│   ├── use-inventory.ts      # Manage idol inventory
│   ├── use-idol-search.ts    # Search/filter idols
│   └── use-locale.ts         # Locale switching hook
├── components/
│   ├── ui/                   # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── input.tsx
│   │   ├── tabs.tsx
│   │   ├── tooltip.tsx
│   │   ├── select.tsx
│   │   ├── command.tsx       # For search/combobox
│   │   ├── popover.tsx
│   │   └── scroll-area.tsx
│   ├── idol-grid.tsx         # 32-slot placement grid
│   ├── idol-card.tsx         # Single idol display
│   ├── idol-editor.tsx       # Create/edit idol modal
│   ├── inventory-panel.tsx   # Sidebar with imported idols
│   ├── inventory-item.tsx    # Draggable inventory idol
│   ├── set-tabs.tsx          # Tab bar for sets
│   ├── stats-summary.tsx     # Aggregate stats display
│   ├── mod-search.tsx        # Search modifiers (uses Command)
│   ├── import-modal.tsx      # Paste import dialog
│   ├── share-modal.tsx       # Share link dialog
│   └── locale-switcher.tsx   # Language selector dropdown
├── routes/
│   ├── home.tsx              # Main planner UI
│   └── share.$id.tsx         # Load shared set
└── context.ts                # Existing context (env/exe)
```

## Phase 2: Data Converter Script (poedb → JSON)

### 2.1 CLI Script (`scripts/poedb-converter/`)
Run with: `pnpm run data:convert`

**Functionality:**
- Fetch idol data from poedb.tw (with caching)
- Parse HTML tables for prefixes, suffixes, unique idols
- Extract: mod ID, name, tier, stat text, value ranges, league mechanic
- Support multiple languages (poedb has localized versions)
- Output to `app/data/idol-modifiers.json` and `app/data/unique-idols.json`

**Script Components:**
- `fetcher.ts` - HTTP client with rate limiting, fetches from:
  - `https://poedb.tw/us/Idols` (English)
  - `https://poedb.tw/tw/Idols` (Traditional Chinese)
  - `https://poedb.tw/cn/Idols` (Simplified Chinese)
  - `https://poedb.tw/kr/Idols` (Korean)
  - etc.
- `parser.ts` - DOM parsing with cheerio/linkedom
- `transformer.ts` - Normalize data structure, merge locales
- `output.ts` - Write typed JSON files

**Output Format:**
```typescript
interface ModifierData {
  id: string;
  type: "prefix" | "suffix";
  tier: number;
  levelReq: number;
  mechanic: string;
  text: Record<Locale, string>;  // Localized text
  values: { min: number; max: number }[];
  tradeStatId?: string;
}
```

### 2.2 JSON Schema Generation (Zod 4)
Using Zod 4's native `z.toJsonSchema()`:
```typescript
import { z } from "zod";

const ModifierSchema = z.object({
  id: z.string(),
  type: z.enum(["prefix", "suffix"]),
  tier: z.number().int().min(1).max(8),
  // ...
});

// Generate JSON Schema for validation
const jsonSchema = z.toJsonSchema(ModifierSchema);
fs.writeFileSync("app/data/schemas/idol-modifiers.schema.json", JSON.stringify(jsonSchema, null, 2));
```

**Benefits:**
- Validate generated JSON files in CI
- IDE autocomplete for JSON files
- Runtime validation on data load
- Single source of truth (Zod schema)

### 2.3 npm Scripts
Add to package.json:
```json
{
  "scripts": {
    "data:convert": "tsx scripts/poedb-converter/index.ts",
    "data:convert:cached": "tsx scripts/poedb-converter/index.ts --cached",
    "data:validate": "tsx scripts/poedb-converter/validate.ts"
  }
}
```

## Phase 3: Data Model & Schema Design

### 3.1 Base Idol Types (`app/data/idol-bases.ts`)
```typescript
export const IDOL_BASES = {
  minor: { name: "Minor Idol", width: 1, height: 1, implicit: 2 },
  kamasan: { name: "Kamasan Idol", width: 1, height: 2, implicit: 4 },
  totemic: { name: "Totemic Idol", width: 1, height: 3, implicit: 6 },
  noble: { name: "Noble Idol", width: 2, height: 1, implicit: 4 },
  burial: { name: "Burial Idol", width: 3, height: 1, implicit: 6 },
  conqueror: { name: "Conqueror Idol", width: 2, height: 2, implicit: 8 },
} as const;
```

### 3.2 Zod Schemas (`app/schemas/`)

**idol.ts:**
- `IdolBaseSchema` - validated base type (minor, kamasan, etc.)
- `IdolModifierSchema` - prefix/suffix with tier, values, mechanic
- `IdolInstanceSchema` - actual idol with rolled values

**idol-set.ts:**
- `IdolSetSchema` - named collection with grid positions
- `IdolPlacementSchema` - idol + position in grid

**inventory.ts:**
- `InventoryIdolSchema` - imported idol in inventory
- `InventorySchema` - full inventory collection

**storage.ts:**
- `StorageSchema` - complete localStorage format with version

```typescript
// Example: Inventory vs Set relationship
const InventoryIdolSchema = z.object({
  id: z.string().uuid(),
  idol: IdolInstanceSchema,
  importedAt: z.number(),
  source: z.enum(["clipboard", "manual", "shared"]),
});

const IdolPlacementSchema = z.object({
  inventoryIdolId: z.string().uuid(), // Reference to inventory
  position: z.object({ x: z.number(), y: z.number() }),
});
```

### 3.3 Generated Modifier Data (`app/data/idol-modifiers.json`)
- Generated by poedb-converter script
- Validated against JSON Schema on generation
- Contains all 503 modifiers with localized text
- Fields: id, type, name, tier, text (per locale), values, mechanic

## Phase 4: Localization Setup

### 4.1 i18n Architecture (`app/i18n/`)
Lightweight client-side i18n (no heavy libraries needed for this scope).

**Supported Locales:**
- `en` - English (default)
- `zh-TW` - Traditional Chinese (Taiwan)
- `zh-CN` - Simplified Chinese
- `ko` - Korean
- `ja` - Japanese
- `ru` - Russian
- `pt-BR` - Portuguese (Brazil)
- `de` - German
- `fr` - French
- `es` - Spanish

### 4.2 Translation Structure (`app/i18n/locales/en.json`)
```json
{
  "app": {
    "title": "POE Idol Planner",
    "subtitle": "Legacy of Phrecia"
  },
  "idolSet": {
    "newSet": "New Set",
    "rename": "Rename",
    "delete": "Delete",
    "duplicate": "Duplicate"
  },
  "actions": {
    "import": "Import",
    "export": "Export",
    "share": "Share",
    "search": "Search",
    "clear": "Clear"
  },
  "stats": {
    "totalStats": "Total Stats",
    "byMechanic": "By Mechanic"
  },
  "trade": {
    "findSimilar": "Find Similar",
    "searchAll": "Search All on Trade"
  },
  "mechanics": {
    "abyss": "Abyss",
    "legion": "Legion",
    "ultimatum": "Ultimatum"
  }
}
```

### 4.3 i18n Hook (`app/i18n/index.ts`)
```typescript
export function useTranslation() {
  const locale = useLocale();
  const t = (key: TranslationKey) => translations[locale][key];
  return { t, locale };
}
```

### 4.4 Locale Detection & Persistence
- Auto-detect from `navigator.language`
- Store preference in localStorage
- URL param override: `?lang=zh-TW`
- Locale switcher component in header

### 4.5 Idol Mod Text Localization
- Mod text comes from poedb (already localized)
- UI strings separate from game data
- Mod text uses `modifier.text[locale]` fallback to `en`

## Phase 5: Core UI Components

### 5.0 shadcn/ui Setup
Initialize shadcn/ui with Tailwind CSS 4:
```bash
pnpx shadcn@latest init
pnpx shadcn@latest add button card dialog dropdown-menu input tabs tooltip select command popover scroll-area
```

**Required components:**
- `Button` - actions, import/export
- `Card` - idol cards, stats panels
- `Dialog` - modals (import, share, edit)
- `DropdownMenu` - context menus, locale switcher
- `Input` - search, naming
- `Tabs` - set tabs, grid tabs
- `Tooltip` - mod explanations
- `Select` - filters, base type selection
- `Command` - searchable mod selector (combobox)
- `Popover` - quick actions
- `ScrollArea` - inventory list, mod list

### 5.1 Main Layout (`app/routes/home.tsx`)
```
┌─────────────────────────────────────────────────────────┐
│ Header: Title | Set Tabs | Locale Switcher              │
├───────────────┬─────────────────────┬───────────────────┤
│   Inventory   │     Idol Grid       │   Stats Summary   │
│   (imported   │   (32-slot with     │   (aggregated     │
│    idols)     │    3 sub-tabs)      │    by mechanic)   │
│               │                     │                   │
│  [Drag from   │  [Drop idols here]  │  [Total bonuses]  │
│   here]       │                     │                   │
├───────────────┴─────────────────────┴───────────────────┤
│ Actions: Import | Export | Share | Trade Search         │
└─────────────────────────────────────────────────────────┘
```

### 5.2 Inventory Panel (`app/components/inventory-panel.tsx`)
- Left sidebar showing all imported idols
- Search/filter within inventory
- Drag idols from inventory to grid
- Same idol can be placed in multiple sets
- Delete from inventory (removes from all sets)
- Shows count of times used across sets

### 5.3 Idol Grid (`app/components/idol-grid.tsx`)
- Visual grid representing the 32-slot inventory
- Drag-and-drop from inventory panel
- Show idol shapes correctly (1x2, 2x2, etc.)
- Highlight valid/invalid placements
- 3 sub-tabs for the 3 inventory sections
- Right-click to remove placement (idol stays in inventory)

### 5.4 Idol Card (`app/components/idol-card.tsx`)
- Display idol name, base type
- List all modifiers with values (localized)
- Color-coded by rarity (using shadcn Card variants)
- Tooltip on hover for full mod details
- Context menu (DropdownMenu) for actions

### 5.5 Stats Summary (`app/components/stats-summary.tsx`)
- Aggregate all modifiers from current set
- Group by league mechanic (collapsible sections)
- Show totals (e.g., "+180% chance for Legion")
- Highlight capped/overcapped stats
- Uses Card and ScrollArea components

### 5.6 Clipboard Parser (`app/lib/idol-parser.ts`)
Supports both POE copy formats:

**Format Detection:**
```typescript
function detectFormat(text: string): "simple" | "advanced" {
  return text.includes("{ Prefix Modifier") || text.includes("{ Suffix Modifier")
    ? "advanced"
    : "simple";
}
```

**Simple Format (Ctrl+C):**
- Parse mod text directly
- Match against modifier database using fuzzy text matching
- Extract rolled value with regex: `/\+?(\d+)%?/`
- Tier unknown (set to null)

**Advanced Format (Ctrl+Alt+C):**
- Parse `{ }` blocks with regex:
  ```
  /\{ (Prefix|Suffix) Modifier "([^"]+)" \(Tier: (\d+)\) \}/
  ```
- Extract: type, mod name, tier
- Parse value line: `/(\d+)\((\d+)-(\d+)\)/` → rolled(min-max)
- Direct mapping to modifier database by name

**Return Type:**
```typescript
interface ParsedIdol {
  name: string;
  baseType: IdolBaseType;
  itemLevel: number;
  rarity: Rarity;
  implicit: { text: string; value: number };
  modifiers: ParsedModifier[];
}

interface ParsedModifier {
  type: "prefix" | "suffix";
  modName: string | null;      // null if simple format
  tier: number | null;         // null if simple format
  text: string;
  rolledValue: number;
  valueRange?: { min: number; max: number };  // only in advanced
}
```

## Phase 6: State Management & Storage

### 6.1 Inventory Hook (`app/hooks/use-inventory.ts`)
```typescript
function useInventory() {
  // All imported idols (persisted)
  const [inventory, setInventory] = useState<InventoryIdol[]>([]);

  return {
    inventory,
    addIdol: (idol: IdolInstance, source: "clipboard" | "manual" | "shared") => {...},
    removeIdol: (id: string) => {...},  // Also removes from all sets
    getIdol: (id: string) => {...},
    searchInventory: (query: string, filters: Filters) => {...},
  };
}
```

### 6.2 Sets Hook (`app/hooks/use-idol-sets.ts`)
```typescript
function useIdolSets(inventory: InventoryIdol[]) {
  // Multiple named sets, each references inventory idols
  const [sets, setSets] = useState<IdolSet[]>([]);
  const [activeSetId, setActiveSetId] = useState<string | null>(null);

  return {
    sets,
    activeSet,
    createSet: (name: string) => {...},
    deleteSet: (id: string) => {...},
    renameSet: (id: string, name: string) => {...},
    duplicateSet: (id: string) => {...},
    placeIdol: (inventoryIdolId: string, position: Position) => {...},
    removeIdolFromSet: (placementId: string) => {...},  // Idol stays in inventory
    moveIdol: (placementId: string, newPosition: Position) => {...},
  };
}
```

### 6.3 Storage Format (Validated by Zod)
```typescript
const StorageSchema = z.object({
  version: z.literal(1),
  locale: z.string(),
  inventory: z.array(InventoryIdolSchema),
  sets: z.array(IdolSetSchema),
  activeSetId: z.string().nullable(),
});

// IdolSet references inventory by ID
const IdolSetSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
  placements: z.array(IdolPlacementSchema),
});
```

### 6.4 Data Flow
```
Import (clipboard) → Inventory → Drag to Set → Grid Position
                         ↓
                   Same idol can be in multiple sets
                         ↓
              Delete from inventory = removes everywhere
```

## Phase 7: Sharing & KV Integration

### 7.1 Share Encoding
- Serialize IdolSet to compact JSON
- Generate short hash ID (nanoid)
- Store in KV_SAVE with TTL (30 days)

### 7.2 API Routes
- `POST /api/share` - Save set, return share ID
- `GET /api/share/:id` - Retrieve shared set

### 7.3 Share URL Format
- `https://poe-idol-planner.ta2.dev/share/{id}`
- Opens app with shared set loaded

## Phase 8: Trade Search Generation

### 8.1 Trade Link Generator (`app/lib/trade-search.ts`)
- Build query JSON for specific idol mods
- Generate pathofexile.com/trade URL
- Support searching for:
  - Specific idol base type
  - Required modifiers (any with min values)
  - League filter (Phrecia)

### 8.2 UI Integration
- Button on each idol: "Find Similar"
- Button on set: "Search All" (opens multiple tabs)

## Phase 9: Search & Filtering

### 9.1 Mod Search (`app/components/mod-search.tsx`)
- Text search across mod names/descriptions (localized)
- Filter by league mechanic (dropdown/checkboxes)
- Filter by mod type (prefix/suffix)
- Show matching mods as clickable list

### 9.2 When Adding Idol
- Modal with mod search
- Select base type first
- Add prefixes (max 2) and suffixes (max 2)
- Preview total stats

## Phase 10: Polish & Testing

### 10.1 Testing
- Unit tests for parser
- Unit tests for trade URL generation
- Unit tests for poedb converter
- Integration tests for storage

### 10.2 UI Polish
- Dark theme (POE aesthetic)
- Responsive layout
- Loading states
- Error handling
- RTL support consideration

---

## Implementation Order

1. **Data Converter Script** (Phase 2)
   - Build poedb-converter CLI with tsx
   - Fetch and parse idol data from multiple locales
   - Generate JSON Schema from Zod 4
   - Output localized JSON files + validation schemas

2. **Data Layer** (Phase 3)
   - Create Zod schemas (idol, set, inventory, storage)
   - Add base idol types
   - Import and validate generated modifier data

3. **Localization** (Phase 4)
   - Set up lightweight i18n infrastructure
   - Create English translations
   - Add locale switcher component

4. **shadcn/ui Setup** (Phase 5 prereq)
   - Initialize shadcn/ui
   - Add required components (button, card, dialog, tabs, etc.)
   - Configure dark theme

5. **Basic UI** (Phase 5)
   - Home route with 3-column layout
   - Inventory panel (left sidebar)
   - Idol grid (center, static first)
   - Stats summary (right sidebar)
   - Idol card component

6. **State & Storage** (Phase 6)
   - useInventory hook
   - useIdolSets hook
   - localStorage persistence with Zod validation
   - Set management UI (tabs)

7. **Import Feature** (Phase 5 cont.)
   - Clipboard parser supporting both formats:
     - Ctrl+C (simple): match mod text against database
     - Ctrl+Alt+C (advanced): extract tier/name/values from `{ }` blocks
   - Auto-detect format on paste
   - Import modal (Dialog)
   - Add to inventory flow

8. **Drag & Drop** (Phase 5/6)
   - Drag from inventory to grid
   - Valid placement detection
   - Remove from grid (stays in inventory)

9. **Sharing** (Phase 7)
   - KV API routes
   - Share modal
   - Share route (load shared set)

10. **Trade Search** (Phase 8)
    - Trade URL builder
    - "Find Similar" per idol
    - "Search All" for set

11. **Advanced Search** (Phase 9)
    - Mod search with Command component
    - League mechanic filters
    - Idol editor modal

12. **Polish** (Phase 10)
    - Unit tests for parser, converter, trade URLs
    - Dark theme refinements
    - Additional locale translations
    - Responsive layout adjustments
