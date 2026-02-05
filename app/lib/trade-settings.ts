import { z } from "zod";
import { loadFromStorage, saveToStorage } from "~/lib/storage-utils";

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
	return loadFromStorage(
		TRADE_SETTINGS_KEY,
		TradeSettingsSchema,
		DEFAULT_TRADE_SETTINGS,
	);
}

export function saveTradeSettings(settings: TradeSettings): void {
	saveToStorage(TRADE_SETTINGS_KEY, settings);
}
