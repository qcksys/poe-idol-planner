import { useCallback, useEffect, useState } from "react";
import { loadStorage, saveStorage } from "~/lib/storage";
import type { IdolSet } from "~/schemas/idol-set";
import type { InventoryIdol } from "~/schemas/inventory";
import { useIdolSets } from "./use-idol-sets";
import { useInventory } from "./use-inventory";

const DEFAULT_SET_NAME = "Set 1";

export function usePlannerState() {
	const [inventory, setInventory] = useState<InventoryIdol[]>([]);
	const [sets, setSets] = useState<IdolSet[]>([]);
	const [activeSetId, setActiveSetId] = useState<string | null>(null);
	const [isHydrated, setIsHydrated] = useState(false);

	useEffect(() => {
		const data = loadStorage();
		setInventory(data.inventory);
		setSets(data.sets);
		setActiveSetId(data.activeSetId);

		if (data.sets.length === 0) {
			const defaultSet: IdolSet = {
				id: "default",
				name: DEFAULT_SET_NAME,
				placements: [],
				activeTab: "tab1",
				createdAt: Date.now(),
				updatedAt: Date.now(),
			};
			setSets([defaultSet]);
			setActiveSetId(defaultSet.id);
		}

		setIsHydrated(true);
	}, []);

	useEffect(() => {
		if (!isHydrated) return;

		saveStorage({
			version: 1,
			inventory,
			sets,
			activeSetId,
		});
	}, [inventory, sets, activeSetId, isHydrated]);

	const inventoryHook = useInventory(inventory, setInventory);
	const setsHook = useIdolSets(
		sets,
		setSets,
		activeSetId,
		setActiveSetId,
		inventory,
	);

	useEffect(() => {
		if (!isHydrated) return;

		const allPlacementIdolIds = sets.flatMap((s) =>
			s.placements.map((p) => p.inventoryIdolId),
		);
		inventoryHook.updateUsageCounts(allPlacementIdolIds);
	}, [sets, isHydrated, inventoryHook.updateUsageCounts]);

	const removeIdolFromInventory = useCallback(
		(id: string) => {
			setsHook.removeInventoryIdolFromAllSets(id);
			inventoryHook.removeIdol(id);
		},
		[setsHook, inventoryHook],
	);

	return {
		isHydrated,
		inventory: inventoryHook,
		sets: setsHook,
		removeIdolFromInventory,
	};
}
