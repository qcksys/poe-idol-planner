# POE Idol Planner

A Path of Exile idol planning tool for the Legacy of Phrecia event. Plan your idol layouts, manage multiple sets, and generate trade search URLs.

## Features

- **Idol Grid Planning** - Visual grid editor for placing idols with collision detection
- **Multiple Sets** - Create and manage multiple idol configurations
- **Import from Game** - Paste idol data directly from Path of Exile (Ctrl+C and Ctrl+Alt+C formats)
- **Trade Search** - Generate trade site URLs for finding idols you need
- **Share Builds** - Share your idol sets via unique URLs
- **Localization** - Available in 10 languages

## Tech Stack

- React Router 7 (SSR-enabled)
- React 19
- TypeScript 5.9
- Tailwind CSS 4
- shadcn/ui
- Cloudflare Workers

## Development

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm run dev

# Run tests
pnpm run test

# Build for production
pnpm run build
```

## Attribution

This project uses data and pricing information from the following sources:

### [poedb.tw](https://poedb.tw/)

Idol modifier data, base types, and game data are sourced from poedb.tw. Thank you to the poedb team for maintaining this comprehensive Path of Exile database.

### [poe.ninja](https://poe.ninja/)

Scarab pricing data is fetched from poe.ninja's API. Thank you to poe.ninja for providing reliable, up-to-date economy data for the Path of Exile community.

## License

This project is not affiliated with or endorsed by Grinding Gear Games.

Path of Exile is a trademark of Grinding Gear Games.
