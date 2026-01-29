import type { IdolBaseKey } from "~/data/idol-bases";
import idolModifiers from "~/data/idol-modifiers.json";
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
			option: "online" | "any";
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
}

interface ModifierDataFromJson {
	id: string;
	tiers: ModifierTierData[];
}

let modIdIndex: Map<string, string> | null = null;
let textMappings: Record<string, string> | null = null;

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

function findStatIdForMod(mod: IdolModifier): string | null {
	const statId = findStatIdByModId(mod.modId, mod.tier);
	if (statId) {
		return statId;
	}

	if (mod.text) {
		return findStatIdByText(mod.text);
	}

	return null;
}

function buildTradeQuery(
	idolType?: IdolBaseKey,
	mods?: IdolModifier[],
	options?: {
		minItemLevel?: number;
		onlineOnly?: boolean;
	},
): TradeQuery {
	const query: TradeQuery = {
		query: {
			status: {
				option: options?.onlineOnly ? "online" : "any",
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
			if (statId) {
				statFilters.push({
					id: statId,
					value: {
						min: mod.rolledValue > 0 ? mod.rolledValue : undefined,
					},
				});
			}
		}

		if (statFilters.length > 0) {
			query.query.stats[0].filters = statFilters;
		}
	}

	if (options?.minItemLevel) {
		query.query.filters = {
			...query.query.filters,
			misc_filters: {
				filters: {
					ilvl: { min: options.minItemLevel },
				},
			},
		};
	}

	return query;
}

export function generateTradeUrl(
	idol: IdolInstance,
	options?: {
		league?: string;
		onlineOnly?: boolean;
		includeAllMods?: boolean;
	},
): string {
	const league = options?.league || DEFAULT_LEAGUE;
	const allMods = [...idol.prefixes, ...idol.suffixes];

	const modsToSearch = options?.includeAllMods
		? allMods
		: allMods.slice(0, 4);

	const query = buildTradeQuery(idol.baseType, modsToSearch, {
		onlineOnly: options?.onlineOnly,
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
	const query = buildTradeQuery(baseType, undefined, {
		onlineOnly: options?.onlineOnly,
		minItemLevel: options?.minItemLevel,
	});

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
	const query = buildTradeQuery(options?.baseType, [mod], {
		onlineOnly: options?.onlineOnly,
	});

	const queryParam = encodeURIComponent(JSON.stringify(query));
	return `${TRADE_BASE_URL}/${league}?q=${queryParam}`;
}

export function getTradeStatId(modText: string): string | null {
	return findStatIdByText(modText);
}

export function hasTradeStatMapping(modText: string): boolean {
	return findStatIdByText(modText) !== null;
}

export { IDOL_TYPE_MAP, type TradeQuery };
