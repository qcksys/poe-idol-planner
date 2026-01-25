import { parseArgs } from "node:util";
import { clearCache, fetchPoedbPage, listCachedFiles } from "./fetcher.ts";
import {
	generateJsonSchemas,
	validateConvertedData,
	writeConvertedData,
} from "./output.ts";
import { parsePoedbPage } from "./parser.ts";
import { transform } from "./transformer.ts";
import type { Locale, ParsedPage } from "./types.ts";
import { LOCALES } from "./types.ts";

const PAGES_TO_FETCH = ["Idols#IdolMods"];

const { values: args } = parseArgs({
	allowPositionals: true,
	options: {
		cached: { type: "boolean", default: false },
		"clear-cache": { type: "boolean", default: false },
		locales: { type: "string", default: "en" },
		"generate-schemas": { type: "boolean", default: true },
		help: { type: "boolean", short: "h", default: false },
	},
});

function printHelp(): void {
	console.log(`
poedb-converter - Fetch and convert POE idol data from poedb.tw

Usage: pnpm run data:convert [options]

Options:
  --cached           Use cached HTML files if available
  --clear-cache      Clear the cache before fetching
  --locales <list>   Comma-separated list of locales (default: en)
                     Available: ${LOCALES.join(", ")}
  --generate-schemas Generate JSON Schema files (default: true)
  -h, --help         Show this help message

Examples:
  pnpm run data:convert
  pnpm run data:convert --cached
  pnpm run data:convert --locales en,zh-TW,ko
  pnpm run data:convert --clear-cache --locales en
`);
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

	console.log("=== POE Idol Data Converter ===\n");

	if (args["clear-cache"]) {
		console.log("Clearing cache...");
		clearCache();
	}

	const locales = args.locales
		?.split(",")
		.map((l) => l.trim())
		.filter((l): l is Locale => LOCALES.includes(l as Locale)) || ["en"];

	console.log(`Locales to process: ${locales.join(", ")}`);
	console.log(`Use cache: ${args.cached}`);
	console.log("");

	const dataByLocale = new Map<Locale, ParsedPage>();

	for (const locale of locales) {
		console.log(`Processing locale: ${locale}`);

		for (const page of PAGES_TO_FETCH) {
			try {
				const html = await fetchPoedbPage(
					locale,
					page,
					args.cached ?? false,
				);
				const parsed = parsePoedbPage(html, locale);

				const existingData = dataByLocale.get(locale) || {
					modifiers: [],
					uniqueIdols: [],
				};
				existingData.modifiers.push(...parsed.modifiers);
				existingData.uniqueIdols.push(...parsed.uniqueIdols);
				dataByLocale.set(locale, existingData);

				console.log(
					`  Parsed: ${parsed.modifiers.length} modifiers, ${parsed.uniqueIdols.length} uniques`,
				);
			} catch (error) {
				console.error(
					`  Error fetching ${page}:`,
					error instanceof Error ? error.message : error,
				);
			}
		}
	}

	if (dataByLocale.size === 0) {
		console.error("No data fetched. Exiting.");
		process.exit(1);
	}

	console.log("\nTransforming data...");
	const convertedData = transform(dataByLocale);

	console.log(`  Total modifiers: ${convertedData.modifiers.length}`);
	console.log(`  Total uniques: ${convertedData.uniqueIdols.length}`);

	console.log("\nValidating data...");
	if (!validateConvertedData(convertedData)) {
		console.error("Validation failed. Data not written.");
		process.exit(1);
	}
	console.log("  Validation passed!");

	console.log("\nWriting output files...");
	writeConvertedData(convertedData);

	if (args["generate-schemas"]) {
		console.log("\nGenerating JSON schemas...");
		generateJsonSchemas();
	}

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
