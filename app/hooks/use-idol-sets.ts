import { nanoid } from "nanoid";
import { useCallback, useMemo } from "react";
import { IDOL_BASES, type IdolBaseKey } from "~/data/idol-bases";
import type { IdolInstance } from "~/schemas/idol";
import type { GridTab, IdolPlacement, IdolSet } from "~/schemas/idol-set";
import type { ImportSource, InventoryIdol } from "~/schemas/inventory";
import { createEmptyMapDevice } from "~/schemas/scarab";

const GRID_WIDTH = 6;
const GRID_HEIGHT = 7;

interface Position {
	x: number;
	y: number;
}

export interface UseIdolSetsReturn {
	sets: IdolSet[];
	activeSet: IdolSet | null;
	activeSetId: string | null;
	selectSet: (id: string) => void;
	createSet: (name: string) => string;
	deleteSet: (id: string) => void;
	renameSet: (id: string, name: string) => void;
	duplicateSet: (id: string) => string | null;
	setActiveTab: (setId: string, tab: GridTab) => void;
	placeIdol: (
		inventoryIdolId: string,
		position: Position,
		tab: GridTab,
	) => string | null;
	moveIdol: (
		placementId: string,
		newPosition: Position,
		newTab: GridTab,
	) => boolean;
	removeIdolFromSet: (placementId: string) => void;
	removeInventoryIdolFromAllSets: (inventoryIdolId: string) => void;
	canPlaceIdol: (
		inventoryIdol: InventoryIdol,
		position: Position,
		tab: GridTab,
		excludePlacementId?: string,
	) => boolean;
	// Map device operations
	updateMapDeviceSlot: (slotIndex: number, scarabId: string | null) => void;
	// Inventory operations for active set
	addIdol: (idol: IdolInstance, source: ImportSource) => string | null;
	addIdols: (idols: IdolInstance[], source: ImportSource) => string[];
	updateIdol: (id: string, idol: IdolInstance) => void;
	duplicateIdol: (id: string) => string | null;
	removeIdol: (id: string) => void;
	clearInventory: () => void;
}

function createEmptyGrid(): boolean[][] {
	return Array.from({ length: GRID_HEIGHT }, () =>
		Array.from({ length: GRID_WIDTH }, () => false),
	);
}

function buildOccupancyGrid(
	placements: IdolPlacement[],
	inventory: InventoryIdol[],
	tab: GridTab,
	excludePlacementId?: string,
): boolean[][] {
	const grid = createEmptyGrid();
	const tabPlacements = placements.filter(
		(p) => p.tab === tab && p.id !== excludePlacementId,
	);

	for (const placement of tabPlacements) {
		const invIdol = inventory.find(
			(i) => i.id === placement.inventoryIdolId,
		);
		if (!invIdol) continue;

		const base = IDOL_BASES[invIdol.idol.baseType as IdolBaseKey];
		const { x, y } = placement.position;

		for (let dy = 0; dy < base.height; dy++) {
			for (let dx = 0; dx < base.width; dx++) {
				const cellY = y + dy;
				const cellX = x + dx;
				if (cellY < GRID_HEIGHT && cellX < GRID_WIDTH) {
					grid[cellY][cellX] = true;
				}
			}
		}
	}

	return grid;
}

function checkCanPlace(
	grid: boolean[][],
	baseType: IdolBaseKey,
	position: Position,
): boolean {
	const base = IDOL_BASES[baseType];
	const { x, y } = position;

	if (x + base.width > GRID_WIDTH || y + base.height > GRID_HEIGHT) {
		return false;
	}

	if (x < 0 || y < 0) {
		return false;
	}

	for (let dy = 0; dy < base.height; dy++) {
		for (let dx = 0; dx < base.width; dx++) {
			if (grid[y + dy][x + dx]) {
				return false;
			}
		}
	}

	return true;
}

export function useIdolSets(
	sets: IdolSet[],
	setSets: React.Dispatch<React.SetStateAction<IdolSet[]>>,
	activeSetId: string | null,
	setActiveSetId: React.Dispatch<React.SetStateAction<string | null>>,
): UseIdolSetsReturn {
	const activeSet = useMemo(
		() => sets.find((s) => s.id === activeSetId) ?? null,
		[sets, activeSetId],
	);

	const inventory = activeSet?.inventory ?? [];

	const selectSet = useCallback(
		(id: string) => {
			setActiveSetId(id);
		},
		[setActiveSetId],
	);

	const createSet = useCallback(
		(name: string): string => {
			const id = nanoid();
			const newSet: IdolSet = {
				id,
				name,
				placements: [],
				activeTab: "tab1",
				inventory: [],
				mapDevice: createEmptyMapDevice(),
				createdAt: Date.now(),
				updatedAt: Date.now(),
			};
			setSets((prev) => [...prev, newSet]);
			setActiveSetId(id);
			return id;
		},
		[setSets, setActiveSetId],
	);

	const deleteSet = useCallback(
		(id: string) => {
			setSets((prev) => {
				const remaining = prev.filter((s) => s.id !== id);
				if (remaining.length === 0) {
					return prev;
				}
				return remaining;
			});
			if (activeSetId === id) {
				setSets((prev) => {
					const remaining = prev.filter((s) => s.id !== id);
					if (remaining.length > 0) {
						setActiveSetId(remaining[0].id);
					}
					return prev;
				});
			}
		},
		[setSets, activeSetId, setActiveSetId],
	);

	const renameSet = useCallback(
		(id: string, name: string) => {
			setSets((prev) =>
				prev.map((s) =>
					s.id === id ? { ...s, name, updatedAt: Date.now() } : s,
				),
			);
		},
		[setSets],
	);

	const duplicateSet = useCallback(
		(id: string): string | null => {
			const sourceSet = sets.find((s) => s.id === id);
			if (!sourceSet) return null;

			const newId = nanoid();
			const newSet: IdolSet = {
				...sourceSet,
				id: newId,
				name: `${sourceSet.name} (Copy)`,
				placements: sourceSet.placements.map((p) => ({
					...p,
					id: nanoid(),
				})),
				inventory: sourceSet.inventory.map((item) => ({
					...item,
					id: nanoid(),
					idol: { ...item.idol, id: nanoid() },
				})),
				createdAt: Date.now(),
				updatedAt: Date.now(),
			};
			setSets((prev) => [...prev, newSet]);
			setActiveSetId(newId);
			return newId;
		},
		[sets, setSets, setActiveSetId],
	);

	const setActiveTab = useCallback(
		(setId: string, tab: GridTab) => {
			setSets((prev) =>
				prev.map((s) =>
					s.id === setId
						? { ...s, activeTab: tab, updatedAt: Date.now() }
						: s,
				),
			);
		},
		[setSets],
	);

	const canPlaceIdol = useCallback(
		(
			inventoryIdol: InventoryIdol,
			position: Position,
			tab: GridTab,
			excludePlacementId?: string,
		): boolean => {
			if (!activeSet) return false;

			const grid = buildOccupancyGrid(
				activeSet.placements,
				inventory,
				tab,
				excludePlacementId,
			);
			return checkCanPlace(
				grid,
				inventoryIdol.idol.baseType as IdolBaseKey,
				position,
			);
		},
		[activeSet, inventory],
	);

	const placeIdol = useCallback(
		(
			inventoryIdolId: string,
			position: Position,
			tab: GridTab,
		): string | null => {
			if (!activeSet) return null;

			const invIdol = inventory.find((i) => i.id === inventoryIdolId);
			if (!invIdol) return null;

			const grid = buildOccupancyGrid(
				activeSet.placements,
				inventory,
				tab,
			);
			if (
				!checkCanPlace(
					grid,
					invIdol.idol.baseType as IdolBaseKey,
					position,
				)
			) {
				return null;
			}

			const placementId = nanoid();
			const newPlacement: IdolPlacement = {
				id: placementId,
				inventoryIdolId,
				position,
				tab,
			};

			setSets((prev) =>
				prev.map((s) =>
					s.id === activeSet.id
						? {
								...s,
								placements: [...s.placements, newPlacement],
								updatedAt: Date.now(),
							}
						: s,
				),
			);

			return placementId;
		},
		[activeSet, inventory, setSets],
	);

	const moveIdol = useCallback(
		(
			placementId: string,
			newPosition: Position,
			newTab: GridTab,
		): boolean => {
			if (!activeSet) return false;

			const placement = activeSet.placements.find(
				(p) => p.id === placementId,
			);
			if (!placement) return false;

			const invIdol = inventory.find(
				(i) => i.id === placement.inventoryIdolId,
			);
			if (!invIdol) return false;

			const grid = buildOccupancyGrid(
				activeSet.placements,
				inventory,
				newTab,
				placementId,
			);
			if (
				!checkCanPlace(
					grid,
					invIdol.idol.baseType as IdolBaseKey,
					newPosition,
				)
			) {
				return false;
			}

			setSets((prev) =>
				prev.map((s) =>
					s.id === activeSet.id
						? {
								...s,
								placements: s.placements.map((p) =>
									p.id === placementId
										? {
												...p,
												position: newPosition,
												tab: newTab,
											}
										: p,
								),
								updatedAt: Date.now(),
							}
						: s,
				),
			);

			return true;
		},
		[activeSet, inventory, setSets],
	);

	const removeIdolFromSet = useCallback(
		(placementId: string) => {
			setSets((prev) =>
				prev.map((s) => ({
					...s,
					placements: s.placements.filter(
						(p) => p.id !== placementId,
					),
					updatedAt: Date.now(),
				})),
			);
		},
		[setSets],
	);

	const removeInventoryIdolFromAllSets = useCallback(
		(inventoryIdolId: string) => {
			setSets((prev) =>
				prev.map((s) => ({
					...s,
					placements: s.placements.filter(
						(p) => p.inventoryIdolId !== inventoryIdolId,
					),
					updatedAt: Date.now(),
				})),
			);
		},
		[setSets],
	);

	// Map device operations
	const updateMapDeviceSlot = useCallback(
		(slotIndex: number, scarabId: string | null) => {
			if (!activeSet) return;

			setSets((prev) =>
				prev.map((s) =>
					s.id === activeSet.id
						? {
								...s,
								mapDevice: {
									...s.mapDevice,
									slots: s.mapDevice.slots.map((slot) =>
										slot.slotIndex === slotIndex
											? { ...slot, scarabId }
											: slot,
									),
								},
								updatedAt: Date.now(),
							}
						: s,
				),
			);
		},
		[activeSet, setSets],
	);

	// Inventory operations for active set
	const addIdol = useCallback(
		(idol: IdolInstance, source: ImportSource): string | null => {
			if (!activeSet) return null;

			const id = nanoid();
			const newItem: InventoryIdol = {
				id,
				idol,
				importedAt: Date.now(),
				source,
				usageCount: 0,
			};

			setSets((prev) =>
				prev.map((s) =>
					s.id === activeSet.id
						? {
								...s,
								inventory: [...s.inventory, newItem],
								updatedAt: Date.now(),
							}
						: s,
				),
			);

			return id;
		},
		[activeSet, setSets],
	);

	const addIdols = useCallback(
		(idols: IdolInstance[], source: ImportSource): string[] => {
			if (!activeSet) return [];

			const newItems: InventoryIdol[] = idols.map((idol) => ({
				id: nanoid(),
				idol,
				importedAt: Date.now(),
				source,
				usageCount: 0,
			}));

			setSets((prev) =>
				prev.map((s) =>
					s.id === activeSet.id
						? {
								...s,
								inventory: [...s.inventory, ...newItems],
								updatedAt: Date.now(),
							}
						: s,
				),
			);

			return newItems.map((item) => item.id);
		},
		[activeSet, setSets],
	);

	const updateIdol = useCallback(
		(id: string, idol: IdolInstance): void => {
			if (!activeSet) return;

			setSets((prev) =>
				prev.map((s) =>
					s.id === activeSet.id
						? {
								...s,
								inventory: s.inventory.map((item) =>
									item.id === id ? { ...item, idol } : item,
								),
								updatedAt: Date.now(),
							}
						: s,
				),
			);
		},
		[activeSet, setSets],
	);

	const duplicateIdol = useCallback(
		(id: string): string | null => {
			if (!activeSet) return null;

			const original = inventory.find((item) => item.id === id);
			if (!original) return null;

			const newId = nanoid();
			const duplicate: InventoryIdol = {
				id: newId,
				idol: { ...original.idol, id: nanoid() },
				importedAt: Date.now(),
				source: original.source,
				usageCount: 0,
			};

			setSets((prev) =>
				prev.map((s) =>
					s.id === activeSet.id
						? {
								...s,
								inventory: [...s.inventory, duplicate],
								updatedAt: Date.now(),
							}
						: s,
				),
			);

			return newId;
		},
		[activeSet, inventory, setSets],
	);

	const removeIdol = useCallback(
		(id: string) => {
			if (!activeSet) return;

			// Remove from inventory and placements
			setSets((prev) =>
				prev.map((s) =>
					s.id === activeSet.id
						? {
								...s,
								inventory: s.inventory.filter(
									(item) => item.id !== id,
								),
								placements: s.placements.filter(
									(p) => p.inventoryIdolId !== id,
								),
								updatedAt: Date.now(),
							}
						: s,
				),
			);
		},
		[activeSet, setSets],
	);

	const clearInventory = useCallback(() => {
		if (!activeSet) return;

		setSets((prev) =>
			prev.map((s) =>
				s.id === activeSet.id
					? {
							...s,
							inventory: [],
							placements: [],
							updatedAt: Date.now(),
						}
					: s,
			),
		);
	}, [activeSet, setSets]);

	return useMemo(
		() => ({
			sets,
			activeSet,
			activeSetId,
			selectSet,
			createSet,
			deleteSet,
			renameSet,
			duplicateSet,
			setActiveTab,
			placeIdol,
			moveIdol,
			removeIdolFromSet,
			removeInventoryIdolFromAllSets,
			canPlaceIdol,
			updateMapDeviceSlot,
			addIdol,
			addIdols,
			updateIdol,
			duplicateIdol,
			removeIdol,
			clearInventory,
		}),
		[
			sets,
			activeSet,
			activeSetId,
			selectSet,
			createSet,
			deleteSet,
			renameSet,
			duplicateSet,
			setActiveTab,
			placeIdol,
			moveIdol,
			removeIdolFromSet,
			removeInventoryIdolFromAllSets,
			canPlaceIdol,
			updateMapDeviceSlot,
			addIdol,
			addIdols,
			updateIdol,
			duplicateIdol,
			removeIdol,
			clearInventory,
		],
	);
}
