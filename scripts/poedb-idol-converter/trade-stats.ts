import type { ModifierData } from "./types.ts";

const TRADE_STATS_API_URL = "https://www.pathofexile.com/api/trade/data/stats";

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

export interface TradeStatResult {
	matchedCount: number;
	unmatchedCount: number;
	unmatchedModifiers: string[];
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

async function fetchTradeStats(): Promise<TradeStatsData | null> {
	console.log(`  Fetching trade stats from POE API...`);
	try {
		const response = await fetch(TRADE_STATS_API_URL, {
			headers: {
				"User-Agent": "poe-idol-planner/1.0",
				Accept: "application/json",
			},
		});

		if (!response.ok) {
			console.warn(
				`  Failed to fetch trade stats: ${response.status} ${response.statusText}`,
			);
			return null;
		}

		const data = (await response.json()) as TradeStatsData;
		console.log(`  Fetched ${data.result.length} stat categories`);
		return data;
	} catch (error) {
		console.warn(
			`  Error fetching trade stats:`,
			error instanceof Error ? error.message : error,
		);
		return null;
	}
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

export async function applyTradeStatMappings(
	modifiers: ModifierData[],
): Promise<TradeStatResult> {
	const tradeStats = await fetchTradeStats();
	if (!tradeStats) {
		return {
			matchedCount: 0,
			unmatchedCount: 0,
			unmatchedModifiers: [],
		};
	}

	console.log("  Building trade stat index...");
	const index = buildTradeStatIndex(tradeStats);
	console.log(`  Trade stat index size: ${index.size} entries`);

	const unmatchedModifiers: string[] = [];
	let matchedCount = 0;
	let unmatchedCount = 0;

	const seenTexts = new Set<string>();

	for (const mod of modifiers) {
		for (const tier of mod.tiers) {
			const englishText = tier.text.en;
			if (!englishText) continue;

			const match = findBestMatch(englishText, index);

			if (match) {
				tier.tradeStatId = match.statId;
				if (!seenTexts.has(englishText)) {
					matchedCount++;
					seenTexts.add(englishText);
				}
			} else {
				if (!seenTexts.has(englishText)) {
					unmatchedModifiers.push(englishText);
					unmatchedCount++;
					seenTexts.add(englishText);
				}
			}
		}
	}

	console.log(`  Matched modifiers: ${matchedCount}`);
	console.log(`  Unmatched modifiers: ${unmatchedCount}`);

	return {
		matchedCount,
		unmatchedCount,
		unmatchedModifiers:
			unmatchedModifiers.length > 10
				? [
						...unmatchedModifiers.slice(0, 10),
						`... and ${unmatchedModifiers.length - 10} more`,
					]
				: unmatchedModifiers,
	};
}
