import { useCallback, useEffect, useState } from "react";
import { useLeague } from "~/hooks/use-league";
import {
	type ScarabPricesData,
	ScarabPricesDataSchema,
} from "~/schemas/scarab";

interface ScarabPricesState {
	data: ScarabPricesData | null;
	isLoading: boolean;
	error: string | null;
}

export function useScarabPrices() {
	const { league, realm, isHydrated } = useLeague();
	const [state, setState] = useState<ScarabPricesState>({
		data: null,
		isLoading: false,
		error: null,
	});

	const fetchPrices = useCallback(async (leagueId: string) => {
		setState((prev) => ({ ...prev, isLoading: true, error: null }));

		try {
			const response = await fetch(
				`/api/prices/scarabs?league=${encodeURIComponent(leagueId)}`,
			);

			if (!response.ok) {
				if (response.status === 404) {
					setState({
						data: null,
						isLoading: false,
						error: null,
					});
					return;
				}
				throw new Error(`Failed to fetch prices: ${response.status}`);
			}

			const data = await response.json();
			const parsed = ScarabPricesDataSchema.safeParse(data);

			if (!parsed.success) {
				throw new Error("Invalid price data format");
			}

			setState({
				data: parsed.data,
				isLoading: false,
				error: null,
			});
		} catch (err) {
			setState({
				data: null,
				isLoading: false,
				error: err instanceof Error ? err.message : "Unknown error",
			});
		}
	}, []);

	useEffect(() => {
		if (!isHydrated) return;
		if (realm !== "pc") {
			setState({ data: null, isLoading: false, error: null });
			return;
		}
		fetchPrices(league);
	}, [league, realm, isHydrated, fetchPrices]);

	const getPrice = useCallback(
		(scarabId: string): number | null => {
			if (!state.data) return null;
			return state.data.prices[scarabId]?.chaosValue ?? null;
		},
		[state.data],
	);

	return {
		prices: state.data?.prices ?? null,
		isLoading: state.isLoading,
		error: state.error,
		updatedAt: state.data?.updatedAt ?? null,
		getPrice,
		refetch: () => fetchPrices(league),
	};
}
