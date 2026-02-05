import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import {
	DEFAULT_TRADE_SETTINGS,
	loadTradeSettings,
	saveTradeSettings,
	type TradeSettings,
} from "~/lib/trade-settings";

interface TradeSettingsContextValue {
	settings: TradeSettings;
	isHydrated: boolean;
	setMaxWeight: (maxWeight: number | null) => void;
}

const TradeSettingsContext = createContext<TradeSettingsContextValue | null>(
	null,
);

export function TradeSettingsProvider({ children }: { children: ReactNode }) {
	const [settings, setSettings] = useState<TradeSettings>(
		DEFAULT_TRADE_SETTINGS,
	);
	const [isHydrated, setIsHydrated] = useState(false);

	useEffect(() => {
		const stored = loadTradeSettings();
		setSettings(stored);
		setIsHydrated(true);
	}, []);

	useEffect(() => {
		if (isHydrated) {
			saveTradeSettings(settings);
		}
	}, [settings, isHydrated]);

	const setMaxWeight = useCallback((maxWeight: number | null) => {
		setSettings((prev) => ({ ...prev, maxWeight }));
	}, []);

	return (
		<TradeSettingsContext.Provider
			value={{
				settings,
				isHydrated,
				setMaxWeight,
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
