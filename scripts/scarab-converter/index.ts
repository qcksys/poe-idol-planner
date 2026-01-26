import * as fs from "node:fs";
import * as path from "node:path";
import { parseArgs } from "node:util";
import {
	clearCache,
	downloadImage,
	fetchScarabPage,
	listCachedFiles,
} from "./fetcher.ts";
import { parseScarabPage } from "./parser.ts";
import type { ConvertedScarabData, RawScarab, ScarabData } from "./types.ts";

const OUTPUT_DIR = path.join(import.meta.dirname, "../../app/data");

const { values: args } = parseArgs({
	allowPositionals: true,
	options: {
		cached: { type: "boolean", default: false },
		"clear-cache": { type: "boolean", default: false },
		"skip-images": { type: "boolean", default: false },
		help: { type: "boolean", short: "h", default: false },
	},
});

function printHelp(): void {
	console.log(`
scarab-converter - Fetch and convert POE scarab data from poedb.tw

Usage: pnpm run data:scarabs [options]

Options:
  --cached           Use cached HTML files if available
  --clear-cache      Clear the cache before fetching
  --skip-images      Skip downloading images (use existing or CDN URLs)
  -h, --help         Show this help message

Examples:
  pnpm run data:scarabs
  pnpm run data:scarabs --cached
  pnpm run data:scarabs --cached --skip-images
`);
}

function getImageFilename(imageUrl: string, scarabId: string): string {
	// Extract extension from URL
	const ext = imageUrl.split(".").pop()?.split("?")[0] || "webp";
	return `${scarabId}.${ext}`;
}

async function downloadScarabImages(
	scarabs: RawScarab[],
): Promise<Map<string, string>> {
	const imageMap = new Map<string, string>();
	console.log(`\nDownloading ${scarabs.length} scarab images...`);

	for (const scarab of scarabs) {
		try {
			const filename = getImageFilename(scarab.imageUrl, scarab.id);
			const localPath = await downloadImage(scarab.imageUrl, filename);
			imageMap.set(scarab.id, localPath);
		} catch (error) {
			console.error(
				`  [error] Failed to download image for ${scarab.name}:`,
				error instanceof Error ? error.message : error,
			);
			// Fall back to CDN URL
			imageMap.set(scarab.id, scarab.imageUrl);
		}
	}

	return imageMap;
}

function transformScarabs(
	rawScarabs: RawScarab[],
	imageMap: Map<string, string>,
): ScarabData[] {
	return rawScarabs.map((raw) => ({
		id: raw.id,
		name: raw.name,
		effect: raw.effect,
		category: raw.category,
		image: imageMap.get(raw.id) || raw.imageUrl,
		limit: raw.limit ?? 5,
	}));
}

function getCategories(scarabs: ScarabData[]): string[] {
	const categories = new Set<string>();
	for (const scarab of scarabs) {
		categories.add(scarab.category);
	}
	return Array.from(categories).sort();
}

function writeOutput(data: ConvertedScarabData): void {
	if (!fs.existsSync(OUTPUT_DIR)) {
		fs.mkdirSync(OUTPUT_DIR, { recursive: true });
	}

	const outputPath = path.join(OUTPUT_DIR, "scarabs.json");
	fs.writeFileSync(outputPath, JSON.stringify(data, null, "\t"), "utf-8");
	console.log(`  Written to ${outputPath}`);
}

async function main(): Promise<void> {
	if (
		args.help ||
		process.argv.includes("--help") ||
		process.argv.includes("-h")
	) {
		printHelp();
		process.exit(0);
	}

	console.log("=== POE Scarab Data Converter ===\n");

	if (args["clear-cache"]) {
		console.log("Clearing cache...");
		clearCache();
	}

	console.log(`Use cache: ${args.cached}`);
	console.log(`Skip images: ${args["skip-images"]}`);
	console.log("");

	// Fetch and parse HTML
	console.log("Fetching scarab page...");
	const html = await fetchScarabPage(args.cached ?? false);

	console.log("\nParsing scarab data...");
	const rawScarabs = parseScarabPage(html);
	console.log(`  Found ${rawScarabs.length} scarabs`);

	if (rawScarabs.length === 0) {
		console.error("No scarabs found. Exiting.");
		process.exit(1);
	}

	// Download images (unless skipped)
	let imageMap: Map<string, string>;
	if (args["skip-images"]) {
		console.log("\nSkipping image downloads, using CDN URLs...");
		imageMap = new Map(rawScarabs.map((s) => [s.id, s.imageUrl]));
	} else {
		imageMap = await downloadScarabImages(rawScarabs);
	}

	// Transform data
	console.log("\nTransforming data...");
	const scarabs = transformScarabs(rawScarabs, imageMap);
	const categories = getCategories(scarabs);

	console.log(`  Categories: ${categories.join(", ")}`);

	// Create output
	const convertedData: ConvertedScarabData = {
		scarabs,
		categories,
		generatedAt: new Date().toISOString(),
		version: 1,
	};

	// Write output
	console.log("\nWriting output files...");
	writeOutput(convertedData);

	console.log("\nDone!");
	const cachedFiles = listCachedFiles();
	if (cachedFiles.length > 0) {
		console.log(`\nCached files available: ${cachedFiles.length}`);
	}
}

main().catch((error) => {
	console.error("Fatal error:", error);
	process.exit(1);
});
