import type { IdolBaseKey } from "~/data/idol-bases";
import idolModifiers from "~/data/idol-modifiers.json";
import uniqueIdols from "~/data/unique-idols.json";
import type { IdolInstance, IdolModifier } from "~/schemas/idol";
import { DEFAULT_LEAGUE } from "~/schemas/league";

const TRADE_BASE_URL = "https://www.pathofexile.com/trade/search";

type IdolTypeName =
	| "Minor Idol"
	| "Kamasan Idol"
	| "Totemic Idol"
	| "Noble Idol"
	| "Burial Idol"
	| "Conqueror Idol";

const IDOL_TYPE_MAP: Record<IdolBaseKey, IdolTypeName> = {
	minor: "Minor Idol",
	kamasan: "Kamasan Idol",
	totemic: "Totemic Idol",
	noble: "Noble Idol",
	burial: "Burial Idol",
	conqueror: "Conqueror Idol",
};

interface TradeStatFilter {
	id: string;
	value?: {
		min?: number;
		max?: number;
	};
	disabled?: boolean;
}

interface TradeQuery {
	query: {
		status: {
			option: "securable";
		};
		type?: string;
		stats: Array<{
			type: "and" | "count" | "not";
			filters: TradeStatFilter[];
			value?: { min?: number };
			disabled?: boolean;
		}>;
		filters?: {
			type_filters?: {
				filters: {
					category?: { option: string };
					rarity?: { option: string };
				};
				disabled?: boolean;
			};
			misc_filters?: {
				filters: {
					ilvl?: { min?: number; max?: number };
					corrupted?: { option: "true" | "false" | "any" };
				};
				disabled?: boolean;
			};
		};
	};
	sort: {
		price: "asc" | "desc";
	};
}

interface ModifierTierData {
	tier: number;
	text: Record<string, string>;
	tradeStatId?: string;
	weight?: number;
}

interface ModifierDataFromJson {
	id: string;
	tiers: ModifierTierData[];
}

function getModWeight(modId: string, tier: number | null): number | null {
	if (tier === null) return null;

	for (const mod of idolModifiers as ModifierDataFromJson[]) {
		if (mod.id === modId) {
			const tierData = mod.tiers.find((t) => t.tier === tier);
			return tierData?.weight ?? null;
		}
	}
	return null;
}

interface WeightRange {
	min: number;
	max: number;
}

let cachedWeightRange: WeightRange | null = null;
let cachedUniqueWeights: number[] | null = null;

function getWeightRange(): WeightRange {
	if (cachedWeightRange) {
		return cachedWeightRange;
	}

	let min = Number.POSITIVE_INFINITY;
	let max = Number.NEGATIVE_INFINITY;

	for (const mod of idolModifiers as ModifierDataFromJson[]) {
		for (const tier of mod.tiers) {
			if (tier.weight != null) {
				min = Math.min(min, tier.weight);
				max = Math.max(max, tier.weight);
			}
		}
	}

	if (min === Number.POSITIVE_INFINITY) min = 0;
	if (max === Number.NEGATIVE_INFINITY) max = 1000;

	cachedWeightRange = { min, max };
	return cachedWeightRange;
}

function getUniqueWeights(): number[] {
	if (cachedUniqueWeights) {
		return cachedUniqueWeights;
	}

	const weights = new Set<number>();

	for (const mod of idolModifiers as ModifierDataFromJson[]) {
		for (const tier of mod.tiers) {
			if (tier.weight != null) {
				weights.add(tier.weight);
			}
		}
	}

	cachedUniqueWeights = Array.from(weights).sort((a, b) => a - b);
	return cachedUniqueWeights;
}

function snapToNearestWeight(value: number): number {
	const weights = getUniqueWeights();
	if (weights.length === 0) return value;

	let closest = weights[0];
	let minDiff = Math.abs(value - closest);

	for (const weight of weights) {
		const diff = Math.abs(value - weight);
		if (diff < minDiff) {
			minDiff = diff;
			closest = weight;
		}
	}

	return closest;
}

let modIdIndex: Map<string, string> | null = null;
let textMappings: Record<string, string> | null = null;
let uniqueModIndex: Map<string, string> | null = null;

interface UniqueIdolJsonModifier {
	text: Record<string, string>;
	values: { min: number; max: number }[];
	tradeStatId?: string;
}

interface UniqueIdolFromJson {
	id: string;
	modifiers: UniqueIdolJsonModifier[];
}

function buildUniqueModIndex(): Map<string, string> {
	if (uniqueModIndex) {
		return uniqueModIndex;
	}

	uniqueModIndex = new Map();
	for (const idol of uniqueIdols as UniqueIdolFromJson[]) {
		for (let i = 0; i < idol.modifiers.length; i++) {
			const mod = idol.modifiers[i];
			if (mod.tradeStatId) {
				const key = `unique_${idol.id}_${i}`;
				uniqueModIndex.set(key, mod.tradeStatId);
			}
		}
	}

	return uniqueModIndex;
}

function buildModIdIndex(): Map<string, string> {
	if (modIdIndex) {
		return modIdIndex;
	}

	modIdIndex = new Map();
	for (const mod of idolModifiers as ModifierDataFromJson[]) {
		for (const tier of mod.tiers) {
			if (tier.tradeStatId) {
				const key = `${mod.id}:${tier.tier}`;
				modIdIndex.set(key, tier.tradeStatId);
			}
		}
	}

	return modIdIndex;
}

function buildTextMappings(): Record<string, string> {
	if (textMappings) {
		return textMappings;
	}

	textMappings = {};
	for (const mod of idolModifiers as ModifierDataFromJson[]) {
		for (const tier of mod.tiers) {
			if (tier.tradeStatId && tier.text.en) {
				const normalized = normalizeModText(tier.text.en);
				textMappings[normalized] = tier.tradeStatId;
			}
		}
	}

	return textMappings;
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
		.trim();
}

function findStatIdByModId(modId: string, tier: number | null): string | null {
	if (tier === null) return null;

	const index = buildModIdIndex();
	const key = `${modId}:${tier}`;
	return index.get(key) ?? null;
}

function findStatIdByText(modText: string): string | null {
	const mappings = buildTextMappings();
	const normalized = normalizeModText(modText);

	if (mappings[normalized]) {
		return mappings[normalized];
	}

	for (const [pattern, statId] of Object.entries(mappings)) {
		const normalizedPattern = normalizeModText(pattern);
		if (normalized === normalizedPattern) {
			return statId;
		}
	}

	return null;
}

function findStatIdForUniqueMod(modId: string): string | null {
	const index = buildUniqueModIndex();
	return index.get(modId) ?? null;
}

function findStatIdForMod(mod: IdolModifier): string | null {
	if (mod.type === "unique") {
		return findStatIdForUniqueMod(mod.modId);
	}

	const statId = findStatIdByModId(mod.modId, mod.tier);
	if (statId) {
		return statId;
	}

	if (mod.text) {
		return findStatIdByText(mod.text);
	}

	return null;
}

interface BuildTradeQueryOptions {
	idolType?: IdolBaseKey;
	mods?: IdolModifier[];
	maxWeight?: number | null;
}

function buildTradeQuery(options: BuildTradeQueryOptions = {}): TradeQuery {
	const { idolType, mods, maxWeight } = options;

	const query: TradeQuery = {
		query: {
			status: {
				option: "securable",
			},
			stats: [
				{
					type: "and",
					filters: [],
				},
			],
		},
		sort: {
			price: "asc",
		},
	};

	if (idolType) {
		query.query.type = IDOL_TYPE_MAP[idolType];
	}

	if (mods && mods.length > 0) {
		const statFilters: TradeStatFilter[] = [];

		for (const mod of mods) {
			const statId = findStatIdForMod(mod);
			if (!statId) continue;

			// Skip mods that exceed maxWeight threshold
			if (maxWeight != null && mod.tier != null) {
				const weight = getModWeight(mod.modId, mod.tier);
				if (weight != null && weight > maxWeight) {
					continue;
				}
			}

			statFilters.push({
				id: statId,
				value: {
					min: mod.rolledValue > 0 ? mod.rolledValue : undefined,
				},
			});
		}

		if (statFilters.length > 0) {
			query.query.stats[0].filters = statFilters;
		}
	}

	return query;
}

export function generateTradeUrl(
	idol: IdolInstance,
	options?: {
		league?: string;
		includeAllMods?: boolean;
		maxWeight?: number | null;
	},
): string {
	const league = options?.league || DEFAULT_LEAGUE;
	const allMods = [...idol.prefixes, ...idol.suffixes];

	const modsToSearch = options?.includeAllMods
		? allMods
		: allMods.slice(0, 4);

	const query = buildTradeQuery({
		idolType: idol.baseType,
		mods: modsToSearch,
		maxWeight: options?.maxWeight,
	});

	const queryParam = encodeURIComponent(JSON.stringify(query));
	return `${TRADE_BASE_URL}/${league}?q=${queryParam}`;
}

export function generateTradeUrlForBaseType(
	baseType: IdolBaseKey,
	options?: {
		league?: string;
		onlineOnly?: boolean;
		minItemLevel?: number;
	},
): string {
	const league = options?.league || DEFAULT_LEAGUE;
	const query = buildTradeQuery({ idolType: baseType });

	const queryParam = encodeURIComponent(JSON.stringify(query));
	return `${TRADE_BASE_URL}/${league}?q=${queryParam}`;
}

export function generateTradeUrlForMod(
	mod: IdolModifier,
	options?: {
		league?: string;
		onlineOnly?: boolean;
		baseType?: IdolBaseKey;
	},
): string {
	const league = options?.league || DEFAULT_LEAGUE;
	const query = buildTradeQuery({
		idolType: options?.baseType,
		mods: [mod],
	});

	const queryParam = encodeURIComponent(JSON.stringify(query));
	return `${TRADE_BASE_URL}/${league}?q=${queryParam}`;
}

export {
	getModWeight,
	getUniqueWeights,
	getWeightRange,
	snapToNearestWeight,
	type WeightRange,
};

export function getTradeStatId(modText: string): string | null {
	return findStatIdByText(modText);
}

export function hasTradeStatMapping(modText: string): boolean {
	return findStatIdByText(modText) !== null;
}

export { IDOL_TYPE_MAP, type TradeQuery };
