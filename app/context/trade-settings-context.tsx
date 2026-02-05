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
	type WeightFilterMode,
} from "~/lib/trade-settings";

interface TradeSettingsContextValue {
	settings: TradeSettings;
	isHydrated: boolean;
	setMaxWeight: (maxWeight: number | null) => void;
	setFilterByMaxWeight: (filterByMaxWeight: boolean) => void;
	setSeparateWeightFilters: (separate: boolean) => void;
	setMaxPrefixWeight: (maxWeight: number | null) => void;
	setMaxSuffixWeight: (maxWeight: number | null) => void;
	setWeightFilterMode: (mode: WeightFilterMode) => void;
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

	const setFilterByMaxWeight = useCallback((filterByMaxWeight: boolean) => {
		setSettings((prev) => ({ ...prev, filterByMaxWeight }));
	}, []);

	const setSeparateWeightFilters = useCallback((separate: boolean) => {
		setSettings((prev) => ({ ...prev, separateWeightFilters: separate }));
	}, []);

	const setMaxPrefixWeight = useCallback((maxWeight: number | null) => {
		setSettings((prev) => ({ ...prev, maxPrefixWeight: maxWeight }));
	}, []);

	const setMaxSuffixWeight = useCallback((maxWeight: number | null) => {
		setSettings((prev) => ({ ...prev, maxSuffixWeight: maxWeight }));
	}, []);

	const setWeightFilterMode = useCallback((mode: WeightFilterMode) => {
		setSettings((prev) => ({ ...prev, weightFilterMode: mode }));
	}, []);

	return (
		<TradeSettingsContext.Provider
			value={{
				settings,
				isHydrated,
				setMaxWeight,
				setFilterByMaxWeight,
				setSeparateWeightFilters,
				setMaxPrefixWeight,
				setMaxSuffixWeight,
				setWeightFilterMode,
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
