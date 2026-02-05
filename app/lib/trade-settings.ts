import { z } from "zod";

const TRADE_SETTINGS_KEY = "poe-idol-planner-trade-settings";

const WeightFilterModeSchema = z.enum(["gte", "lte"]);

const TradeSettingsSchema = z.object({
	maxWeight: z.number().int().min(0).nullable(),
	filterByMaxWeight: z.boolean(),
	separateWeightFilters: z.boolean(),
	maxPrefixWeight: z.number().int().min(0).nullable(),
	maxSuffixWeight: z.number().int().min(0).nullable(),
	weightFilterMode: WeightFilterModeSchema,
});

export type WeightFilterMode = z.infer<typeof WeightFilterModeSchema>;
export type TradeSettings = z.infer<typeof TradeSettingsSchema>;

export const DEFAULT_TRADE_SETTINGS: TradeSettings = {
	maxWeight: null,
	filterByMaxWeight: false,
	separateWeightFilters: false,
	maxPrefixWeight: null,
	maxSuffixWeight: null,
	weightFilterMode: "gte",
};

export function loadTradeSettings(): TradeSettings {
	if (typeof window === "undefined") return DEFAULT_TRADE_SETTINGS;

	try {
		const stored = localStorage.getItem(TRADE_SETTINGS_KEY);
		if (!stored) return DEFAULT_TRADE_SETTINGS;

		const parsed = JSON.parse(stored);
		const result = TradeSettingsSchema.safeParse(parsed);
		if (result.success) {
			return result.data;
		}
	} catch {
		// Ignore parse errors
	}
	return DEFAULT_TRADE_SETTINGS;
}

export function saveTradeSettings(settings: TradeSettings): void {
	if (typeof window === "undefined") return;
	localStorage.setItem(TRADE_SETTINGS_KEY, JSON.stringify(settings));
}
