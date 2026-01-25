# Changelog

## 0.2.0

### Minor Changes

- 142db67: fix drag and drop and add idol move functionality:
  - fix drag and drop by switching from DropdownMenu to ContextMenu (left-click now drags, right-click opens trade menu)
  - add ability to drag and reposition idols already placed on the grid
  - size placed idols based on CELL_SIZE constant (64px) instead of hardcoded values
  - track source placement during drag operations for proper collision detection
  - Total Stats panel now sums identical mod values instead of showing ranges and multipliers
- 2e11f3f: Add GitHub Actions CI/CD workflows and changelog route
  - CI workflow for lint/test on PRs to dev/main
  - Automatic deployment to dev environment on push to dev branch
  - Automatic deployment to production on push to main branch
  - Changeset release workflow for version management
  - Changelog page at /changelog using react-markdown
  - Vitest configuration for unit testing with snapshot support

- d7beed8: Add core idol planner functionality with inventory management and data import
  - Idol grid and inventory panel for placing and managing idols
  - Import modal supporting POE clipboard formats (Ctrl+C and Ctrl+Alt+C)
  - Idol card component with modifier display and rarity styling
  - Set tabs for managing multiple idol configurations
  - Stats summary panel aggregating modifier values
  - POEDB data converter scripts for fetching idol modifier data
  - Zod schemas for type-safe idol, inventory, and set validation
  - i18n infrastructure with English locale and type-safe translation keys
  - Local storage persistence for idol sets and inventory
  - UI components: button, card, dialog, dropdown-menu, input, scroll-area, select, tabs, textarea, tooltip

- 11047db: add mod validation by idol type in editor - mods are now filtered to only show options valid for the selected idol base type, and invalid mods are cleared when changing idol type
- f1b3c04: improve inventory and modal UI:
  - increase inventory panel width and show full mod details with highlighted numbers
  - fix scroll issues in modals and inventory
  - show mod text in idol editor when selecting mods
  - increase modal width and enable text wrapping
  - remove item level from UI
  - reduce padding around idol names in cards
  - add idol icons to inventory cards and base type dropdown selector
  - add edit button to inventory idols
  - replace number input with slider for modifier value ranges
- 8754801: Add custom 404 page with Path of Exile themed design
  - Atmospheric dark design with floating particles and fog effects
  - Glitch effect on 404 text with red/cyan color splitting
  - Golden/bronze gradient text matching POE's aesthetic
  - "Return to Hideout" button with portal icon and hover effects
  - Error boundary integration for route-level 404 handling
  - Snapshot tests for the 404 page component
  - Update global color palette to match POE amber/bronze theme

- 7bea252: add click to edit and duplicate idol features in inventory
- 658b985: Add search, filtering, and idol editor functionality
  - Mod search component with Command combobox for searchable modifier selection
  - MechanicFilter component for filtering mods by league mechanic
  - Idol editor modal for creating custom idols with prefix/suffix selection
  - Updated inventory panel with mechanic filter and Create button
  - Unit tests for idol-parser (25 tests)
  - Translations for editor and filter UI

- 6ea55a5: Add translations for all 9 supported locales (zh-TW, zh-CN, ko, ja, ru, pt-BR, de, fr, es)
- 84568f6: Update poedb parser to fetch mods per idol type from individual pages
  - Parse individual idol pages (Minor, Noble, Kamasan, Burial, Totemic, Conqueror) instead of general Idols page
  - Extract modifier data from embedded ModsView JSON with accurate value ranges per idol type
  - Track `idolSource` and `modFamily` for each modifier to enable proper filtering
  - Generate unique mod IDs that include idol type (e.g., `prefix_minor_additional_abyss_chance`)
  - Correctly map ModGenerationTypeID to prefix (1) or suffix (2)
  - 757 total modifiers parsed with proper idol type distribution
  - Add 28 unit tests for poedb parser covering parsing, value extraction, and error handling

- 502078a: Add trade search integration with dynamic stat mapping generation
  - Trade search library for generating pathofexile.com/trade URLs
  - Dynamic trade stat mapping generation via poedb-converter script
  - Auto-generated mappings from POE trade API stats data (368 mappings, 96% coverage)
  - "Find Similar on Trade" dropdown menu on idol cards in inventory
  - Functions: generateTradeUrl(), generateTradeUrlForBaseType(), generateTradeUrlForMod()
  - Unit tests for trade search functionality

- 4999691: Add sharing functionality with Cloudflare KV integration
  - Share schema with 30-day TTL expiration for shared sets
  - API routes for creating and retrieving shared sets (POST/GET /api/share)
  - Share page for loading and importing shared idol configurations
  - ShareModal component with copy-to-clipboard functionality
  - Share button integrated into app header

### Patch Changes

- e2920d2: Add navigation link to changelog page in app header
- 1689061: Improve blocked grid cell visibility with distinct red styling

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
