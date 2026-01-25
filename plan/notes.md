# Research Notes: POE Idol Planner

## Source 1: poedb.tw/us/Idols

### Base Idol Types (6 total)
| Idol Type | Size | Maps Found Bonus |
|-----------|------|------------------|
| Minor Idol | 1x1 | 2% |
| Kamasan Idol | 1x2 | 4% |
| Totemic Idol | 1x3 | 6% |
| Noble Idol | 2x1 | 4% |
| Burial Idol | 3x1 | 6% |
| Conqueror Idol | 2x2 | 8% |

### Modifier System
- 503 total modifiers (prefixes + suffixes)
- Rare idols can have prefixes and suffixes
- Unique idols have fixed mods
- All idols are "Unmodifiable" after rolling

### League Mechanics with Idol Mods
- Abyss, Alva (Incursion), Bestiary (Einhar), Beyond, Blight
- Breach, Delirium, Delve, Essence, Expedition
- Harvest, Heist, Jun (Betrayal), Legion, Ritual, Ultimatum
- Harbinger, Rogue Exiles, Eldritch content
- General: Pack Size, Quantity, Rarity, Map Boss drops

### Modifier Tiers
- 8 tiers typically (T8 lowest, T1 highest)
- Base range example: +15-25% (T8) up to +224-280% (T1)
- Level requirements: 68 (standard), 73, 78 (higher tiers)

### Inventory System
- 32 idol slots total
- Spread across 3 separate inventory tabs
- Unlocked via progression (quests, Atlas, bosses)

---

## Source 2: Trade API (Reddit post)

### Endpoints
- Leagues: `https://www.pathofexile.com/api/trade/data/leagues`
- Static data: `https://www.pathofexile.com/api/trade/data/static`
- Stats/mods: `https://www.pathofexile.com/api/trade/data/stats`
- Search: `POST https://www.pathofexile.com/api/trade/search/{LEAGUE}`
- Fetch results: `GET https://www.pathofexile.com/api/trade/fetch/{RESULT_IDS}?query={QUERY_ID}`

### Search Query Format
```json
{
    "query": {
        "status": { "option": "online" },
        "name": "Item Name",
        "type": "Item Type",
        "stats": [{
            "type": "and",
            "filters": []
        }]
    },
    "sort": { "price": "asc" }
}
```

### Stat Filter Format
Stats are identified by IDs like:
- `explicit.stat_2843100721`
- `implicit.stat_4077843608`

For idol searches, need to find the stat IDs for idol mods.

### Response Flow
1. POST search → get result IDs + query ID
2. GET fetch with comma-joined result IDs → get full item details

---

## Source 3: User Import Formats

### Format 1: Simple Copy (Ctrl+C)
```
Item Class: Idols
Rarity: Rare
Bramble Ornament
Conqueror Idol
--------
Item Level: 82
--------
8% increased Maps found in Area (implicit)
--------
Ultimatum Boss drops a full stack of a random Catalyst
Currency Shards dropped by Harbingers in your Maps can drop as Currency Items instead
Your Maps have +65% chance to contain a Legion Encounter
4% increased Pack Size in your Maps
--------
Place this item into the Idol inventory at a Map Device to affect Maps you open. Idols are not consumed when opening Maps.
--------
Unmodifiable
```

**Characteristics:**
- No mod metadata (tier, name, ranges)
- Mods listed as plain text
- Need to match mod text against database to identify

### Format 2: Advanced Copy (Ctrl+Alt+C)
```
Item Class: Idols
Rarity: Rare
Bramble Ornament
Conqueror Idol
--------
Item Level: 82
--------
{ Implicit Modifier }
8% increased Maps found in Area (implicit)
--------
{ Prefix Modifier "General's" (Tier: 1) }
Your Maps have +65(45-70)% chance to contain a Legion Encounter

{ Prefix Modifier "Cartographer's" (Tier: 1) }
4(4-6)% increased Pack Size in your Maps

{ Suffix Modifier "of Ultimatum" (Tier: 1) }
Ultimatum Boss drops a full stack of a random Catalyst

{ Suffix Modifier "of the Harbinger" (Tier: 1) }
Currency Shards dropped by Harbingers in your Maps can drop as Currency Items instead

--------
Place this item into the Idol inventory at a Map Device to affect Maps you open. Idols are not consumed when opening Maps.
--------
Unmodifiable
```

**Characteristics:**
- Full mod metadata in `{ }` blocks
- Includes: mod type (Prefix/Suffix), mod name, tier
- Value shows rolled value with range in parentheses: `+65(45-70)%`
- Blank lines between mods

### Parsing Requirements
- Detect "Item Class: Idols" to validate input
- Parse "Rarity: Normal/Magic/Rare/Unique"
- Extract idol type from line after item name
- Split sections by "--------"
- Parse implicit (contains "(implicit)" or `{ Implicit Modifier }`)
- **Auto-detect format:** presence of `{ Prefix Modifier` or `{ Suffix Modifier` = advanced
- **Simple format:** match mod text against modifier database (fuzzy match for values)
- **Advanced format:** extract mod name, tier, and value directly from `{ }` blocks
- Parse value with regex: `(\d+)\((\d+)-(\d+)\)` → rolled, min, max

---

## Data Model Draft

### IdolBase
```typescript
interface IdolBase {
  id: string;
  name: string;
  width: 1 | 2 | 3;
  height: 1 | 2 | 3;
  implicitMod: string; // "X% increased Maps found in Area"
}
```

### IdolModifier
```typescript
interface IdolModifier {
  id: string;
  type: 'prefix' | 'suffix';
  name: string; // "General's", "of Ultimatum"
  tier: number; // 1-8
  text: string; // Full mod text with placeholder
  minValue: number;
  maxValue: number;
  leagueMechanic: string; // "Legion", "Ultimatum", "General"
  tradeStatId?: string; // For trade API
}
```

### IdolInstance (user's actual idol)
```typescript
interface IdolInstance {
  id: string; // UUID
  baseType: IdolBase['id'];
  name: string; // User-generated or parsed name
  itemLevel: number;
  rarity: 'normal' | 'magic' | 'rare' | 'unique';
  prefixes: Array<{
    modId: string;
    value: number; // Actual rolled value
  }>;
  suffixes: Array<{
    modId: string;
    value: number;
  }>;
  position?: { x: number; y: number }; // Grid position
}
```

### IdolSet
```typescript
interface IdolSet {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  idols: IdolInstance[];
}
```

---

## UI Components Needed

1. **IdolGrid** - 32-slot placement grid (3 tabs)
2. **IdolCard** - Display single idol with mods
3. **IdolSearch** - Search/filter available mods
4. **IdolEditor** - Create/edit custom idol
5. **SetManager** - Switch between multiple sets
6. **StatsSummary** - Aggregate stats from current set
7. **TradeGenerator** - Create trade search URLs
8. **ImportModal** - Paste idol data
9. **ShareModal** - Generate/load share links
10. **DataConverter** - Tool to convert poedb data to JSON
