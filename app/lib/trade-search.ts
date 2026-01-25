import type { IdolBaseKey } from "~/data/idol-bases";
import { TRADE_STAT_MAPPINGS } from "~/data/trade-stat-mappings";
import type { IdolInstance, IdolModifier } from "~/schemas/idol";

const TRADE_BASE_URL = "https://www.pathofexile.com/trade/search";
const DEFAULT_LEAGUE = "Phrecia";

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

function findStatId(modText: string): string | null {
	const normalized = normalizeModText(modText);

	if (TRADE_STAT_MAPPINGS[normalized]) {
		return TRADE_STAT_MAPPINGS[normalized];
	}

	for (const [pattern, statId] of Object.entries(TRADE_STAT_MAPPINGS)) {
		const normalizedPattern = normalizeModText(pattern);
		if (normalized === normalizedPattern) {
			return statId;
		}
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
			const statId = findStatId(mod.text);
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
		: allMods.slice(0, 2);

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
	return findStatId(modText);
}

export function hasTradeStatMapping(modText: string): boolean {
	return findStatId(modText) !== null;
}

export { DEFAULT_LEAGUE, IDOL_TYPE_MAP, type TradeQuery };
