import { nanoid } from "nanoid";
import { useCallback, useMemo } from "react";
import { IDOL_BASES, type IdolBaseKey } from "~/data/idol-bases";
import type { GridTab, IdolPlacement, IdolSet } from "~/schemas/idol-set";
import type { InventoryIdol } from "~/schemas/inventory";

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
	inventory: InventoryIdol[],
): UseIdolSetsReturn {
	const activeSet = useMemo(
		() => sets.find((s) => s.id === activeSetId) ?? null,
		[sets, activeSetId],
	);

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
		],
	);
}
