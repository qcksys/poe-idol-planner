import * as fs from "node:fs";
import * as path from "node:path";
import type { ModifierData } from "./types.ts";

const TRADE_STATS_PATH = path.resolve(
	import.meta.dirname,
	"../../dev/poe/api.trade.data.stats.json",
);
const OUTPUT_DIR = path.resolve(import.meta.dirname, "../../app/data");

interface TradeStatEntry {
	id: string;
	text: string;
	type: string;
}

interface TradeStatCategory {
	id: string;
	label: string;
	entries: TradeStatEntry[];
}

interface TradeStatsData {
	result: TradeStatCategory[];
}

interface TradeStatMapping {
	normalizedText: string;
	statId: string;
	originalText: string;
}

export interface TradeStatMappings {
	mappings: Record<string, string>;
	generatedAt: string;
	version: number;
	stats: {
		totalMappings: number;
		matchedModifiers: number;
		unmatchedModifiers: string[];
	};
}

function normalizeModText(text: string): string {
	return text
		.replace(
			/(\+)?(\(?\d+(?:—\d+)?\)?)(%)?/g,
			(_match, plus, _num, percent) => {
				return `${plus || ""}#${percent || ""}`;
			},
		)
		.replace(/\s+/g, " ")
		.replace(/\n/g, " ")
		.trim();
}

function loadTradeStats(): TradeStatsData | null {
	if (!fs.existsSync(TRADE_STATS_PATH)) {
		console.warn(`  Trade stats file not found: ${TRADE_STATS_PATH}`);
		console.warn(
			"  To generate trade stat mappings, add the POE trade API stats data to:",
		);
		console.warn(`  ${TRADE_STATS_PATH}`);
		return null;
	}

	const content = fs.readFileSync(TRADE_STATS_PATH, "utf-8");
	return JSON.parse(content) as TradeStatsData;
}

function buildTradeStatIndex(
	data: TradeStatsData,
): Map<string, TradeStatMapping> {
	const index = new Map<string, TradeStatMapping>();

	for (const category of data.result) {
		if (category.id !== "explicit" && category.id !== "implicit") {
			continue;
		}

		for (const entry of category.entries) {
			const normalized = normalizeModText(entry.text);

			if (!index.has(normalized)) {
				index.set(normalized, {
					normalizedText: normalized,
					statId: entry.id,
					originalText: entry.text,
				});
			}
		}
	}

	return index;
}

function findBestMatch(
	modText: string,
	index: Map<string, TradeStatMapping>,
): TradeStatMapping | null {
	const normalized = normalizeModText(modText);

	if (index.has(normalized)) {
		return index.get(normalized) || null;
	}

	for (const [key, mapping] of index) {
		if (key === normalized) {
			return mapping;
		}
	}

	const modWords = normalized.toLowerCase().split(" ");
	let bestMatch: TradeStatMapping | null = null;
	let bestScore = 0;

	for (const [key, mapping] of index) {
		const keyWords = key.toLowerCase().split(" ");

		let matchCount = 0;
		for (const word of modWords) {
			if (word.length > 2 && keyWords.includes(word)) {
				matchCount++;
			}
		}

		const score = matchCount / Math.max(modWords.length, keyWords.length);

		if (score > bestScore && score > 0.7) {
			bestScore = score;
			bestMatch = mapping;
		}
	}

	return bestMatch;
}

export function generateTradeStatMappings(
	modifiers: ModifierData[],
): TradeStatMappings | null {
	const tradeStats = loadTradeStats();
	if (!tradeStats) {
		return null;
	}

	console.log("  Building trade stat index...");
	const index = buildTradeStatIndex(tradeStats);
	console.log(`  Trade stat index size: ${index.size} entries`);

	const mappings: Record<string, string> = {};
	const unmatchedModifiers: string[] = [];
	let matchedCount = 0;

	const seenTexts = new Set<string>();

	for (const mod of modifiers) {
		for (const tier of mod.tiers) {
			const englishText = tier.text.en;
			if (!englishText || seenTexts.has(englishText)) continue;
			seenTexts.add(englishText);

			const normalized = normalizeModText(englishText);
			const match = findBestMatch(englishText, index);

			if (match) {
				mappings[normalized] = match.statId;
				matchedCount++;
			} else {
				unmatchedModifiers.push(englishText);
			}
		}
	}

	console.log(`  Matched modifiers: ${matchedCount}`);
	console.log(`  Unmatched modifiers: ${unmatchedModifiers.length}`);

	return {
		mappings,
		generatedAt: new Date().toISOString(),
		version: 1,
		stats: {
			totalMappings: Object.keys(mappings).length,
			matchedModifiers: matchedCount,
			unmatchedModifiers:
				unmatchedModifiers.length > 10
					? [
							...unmatchedModifiers.slice(0, 10),
							`... and ${unmatchedModifiers.length - 10} more`,
						]
					: unmatchedModifiers,
		},
	};
}

export function writeTradeStatMappings(data: TradeStatMappings): void {
	if (!fs.existsSync(OUTPUT_DIR)) {
		fs.mkdirSync(OUTPUT_DIR, { recursive: true });
	}

	const jsonPath = path.join(OUTPUT_DIR, "trade-stat-mappings.json");
	fs.writeFileSync(jsonPath, JSON.stringify(data, null, "\t"), "utf-8");
	console.log(
		`  Written: ${jsonPath} (${data.stats.totalMappings} mappings)`,
	);

	const tsContent = `// Auto-generated file - do not edit manually
// Generated at: ${data.generatedAt}
// Total mappings: ${data.stats.totalMappings}

export const TRADE_STAT_MAPPINGS: Record<string, string> = ${JSON.stringify(data.mappings, null, "\t")};

export function getTradeStatId(normalizedText: string): string | undefined {
	return TRADE_STAT_MAPPINGS[normalizedText];
}
`;

	const tsPath = path.join(OUTPUT_DIR, "trade-stat-mappings.ts");
	fs.writeFileSync(tsPath, tsContent, "utf-8");
	console.log(`  Written: ${tsPath}`);
}
