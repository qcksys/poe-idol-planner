import { useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { IDOL_BASES, type IdolBaseKey } from "~/data/idol-bases";
import { useTranslations } from "~/i18n";
import { cn } from "~/lib/utils";
import type { IdolInstance } from "~/schemas/idol";
import type { GridTab, IdolPlacement } from "~/schemas/idol-set";
import type { InventoryIdol } from "~/schemas/inventory";
import { IdolCardMini } from "./idol-card";

const GRID_WIDTH = 6;
const GRID_HEIGHT = 7;
const CELL_SIZE = 40;

interface IdolGridProps {
	placements: IdolPlacement[];
	inventory: InventoryIdol[];
	activeTab: GridTab;
	onTabChange: (tab: GridTab) => void;
	onPlaceIdol?: (inventoryIdolId: string, x: number, y: number) => void;
	onRemoveIdol?: (placementId: string) => void;
	onIdolClick?: (idol: IdolInstance) => void;
}

interface GridCell {
	occupied: boolean;
	placementId?: string;
	idol?: IdolInstance;
	isOrigin: boolean;
}

function createEmptyGrid(): GridCell[][] {
	return Array.from({ length: GRID_HEIGHT }, () =>
		Array.from({ length: GRID_WIDTH }, () => ({
			occupied: false,
			isOrigin: false,
		})),
	);
}

function populateGrid(
	placements: IdolPlacement[],
	inventory: InventoryIdol[],
	tab: GridTab,
): GridCell[][] {
	const grid = createEmptyGrid();
	const tabPlacements = placements.filter((p) => p.tab === tab);

	for (const placement of tabPlacements) {
		const inventoryIdol = inventory.find(
			(i) => i.id === placement.inventoryIdolId,
		);
		if (!inventoryIdol) continue;

		const idol = inventoryIdol.idol;
		const base = IDOL_BASES[idol.baseType as IdolBaseKey];
		const { x, y } = placement.position;

		for (let dy = 0; dy < base.height; dy++) {
			for (let dx = 0; dx < base.width; dx++) {
				const cellY = y + dy;
				const cellX = x + dx;
				if (cellY < GRID_HEIGHT && cellX < GRID_WIDTH) {
					grid[cellY][cellX] = {
						occupied: true,
						placementId: placement.id,
						idol,
						isOrigin: dx === 0 && dy === 0,
					};
				}
			}
		}
	}

	return grid;
}

function canPlaceIdol(
	grid: GridCell[][],
	idol: IdolInstance,
	x: number,
	y: number,
): boolean {
	const base = IDOL_BASES[idol.baseType as IdolBaseKey];

	if (x + base.width > GRID_WIDTH || y + base.height > GRID_HEIGHT) {
		return false;
	}

	for (let dy = 0; dy < base.height; dy++) {
		for (let dx = 0; dx < base.width; dx++) {
			if (grid[y + dy][x + dx].occupied) {
				return false;
			}
		}
	}

	return true;
}

interface GridCellComponentProps {
	cell: GridCell;
	x: number;
	y: number;
	onClick?: () => void;
}

function GridCellComponent({ cell, x, y, onClick }: GridCellComponentProps) {
	if (cell.isOrigin && cell.idol) {
		return (
			<div
				className="absolute"
				style={{
					left: x * CELL_SIZE,
					top: y * CELL_SIZE,
				}}
			>
				<IdolCardMini idol={cell.idol} onClick={onClick} />
			</div>
		);
	}

	if (cell.occupied) {
		return null;
	}

	return (
		<div
			className={cn(
				"absolute border border-gray-700 bg-gray-900/30",
				"hover:border-blue-500/50 hover:bg-blue-900/20",
			)}
			style={{
				left: x * CELL_SIZE,
				top: y * CELL_SIZE,
				width: CELL_SIZE,
				height: CELL_SIZE,
			}}
		/>
	);
}

function GridTabContent({
	tab,
	placements,
	inventory,
	onIdolClick,
}: {
	tab: GridTab;
	placements: IdolPlacement[];
	inventory: InventoryIdol[];
	onIdolClick?: (idol: IdolInstance) => void;
}) {
	const grid = useMemo(
		() => populateGrid(placements, inventory, tab),
		[placements, inventory, tab],
	);

	return (
		<div
			className="relative rounded-lg border border-gray-700 bg-gray-950"
			style={{
				width: GRID_WIDTH * CELL_SIZE,
				height: GRID_HEIGHT * CELL_SIZE,
			}}
		>
			{grid.flatMap((row, y) =>
				row.map((cell, x) => (
					<GridCellComponent
						key={`cell-${x}-${y}`}
						cell={cell}
						x={x}
						y={y}
						onClick={
							cell.isOrigin && cell.idol && onIdolClick
								? () => onIdolClick(cell.idol as IdolInstance)
								: undefined
						}
					/>
				)),
			)}
		</div>
	);
}

export function IdolGrid({
	placements,
	inventory,
	activeTab,
	onTabChange,
	onRemoveIdol: _onRemoveIdol,
	onIdolClick,
}: IdolGridProps) {
	const t = useTranslations();

	return (
		<div className="flex flex-col items-center">
			<Tabs
				value={activeTab}
				onValueChange={(v) => onTabChange(v as GridTab)}
				className="w-full"
			>
				<TabsList className="mb-2 grid w-full grid-cols-3">
					<TabsTrigger value="tab1">{t.grid.tab1}</TabsTrigger>
					<TabsTrigger value="tab2">{t.grid.tab2}</TabsTrigger>
					<TabsTrigger value="tab3">{t.grid.tab3}</TabsTrigger>
				</TabsList>

				<TabsContent value="tab1" className="flex justify-center">
					<GridTabContent
						tab="tab1"
						placements={placements}
						inventory={inventory}
						onIdolClick={onIdolClick}
					/>
				</TabsContent>

				<TabsContent value="tab2" className="flex justify-center">
					<GridTabContent
						tab="tab2"
						placements={placements}
						inventory={inventory}
						onIdolClick={onIdolClick}
					/>
				</TabsContent>

				<TabsContent value="tab3" className="flex justify-center">
					<GridTabContent
						tab="tab3"
						placements={placements}
						inventory={inventory}
						onIdolClick={onIdolClick}
					/>
				</TabsContent>
			</Tabs>
		</div>
	);
}

export { canPlaceIdol, GRID_WIDTH, GRID_HEIGHT, CELL_SIZE };
