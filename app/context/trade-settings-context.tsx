import { createContext, type ReactNode, useCallback, useContext } from "react";
import { useStorageState } from "~/hooks/use-storage-state";
import {
	DEFAULT_TRADE_SETTINGS,
	loadTradeSettings,
	saveTradeSettings,
	type TradeSettings,
} from "~/lib/trade-settings";

interface TradeSettingsContextValue {
	settings: TradeSettings;
	isHydrated: boolean;
	updateSettings: (updates: Partial<TradeSettings>) => void;
}

const TradeSettingsContext = createContext<TradeSettingsContextValue | null>(
	null,
);

export function TradeSettingsProvider({ children }: { children: ReactNode }) {
	const [settings, setSettings, isHydrated] = useStorageState(
		loadTradeSettings,
		saveTradeSettings,
		DEFAULT_TRADE_SETTINGS,
	);

	const updateSettings = useCallback(
		(updates: Partial<TradeSettings>) => {
			setSettings((prev) => ({ ...prev, ...updates }));
		},
		[setSettings],
	);

	return (
		<TradeSettingsContext.Provider
			value={{
				settings,
				isHydrated,
				updateSettings,
			}}
		>
			{children}
		</TradeSettingsContext.Provider>
	);
}

export function useTradeSettings(): TradeSettingsContextValue {
	const context = useContext(TradeSettingsContext);
	if (!context) {
		throw new Error(
			"useTradeSettings must be used within a TradeSettingsProvider",
		);
	}
	return context;
}
