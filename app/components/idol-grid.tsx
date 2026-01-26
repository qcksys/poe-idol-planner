import { type DragEvent, useCallback, useMemo, useState } from "react";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "~/components/ui/tooltip";
import { useDnd } from "~/context/dnd-context";
import { IDOL_BASES, type IdolBaseKey } from "~/data/idol-bases";
import { highlightNumbers } from "~/lib/highlight-numbers";
import { cn } from "~/lib/utils";
import type { IdolInstance } from "~/schemas/idol";
import type { GridTab, IdolPlacement } from "~/schemas/idol-set";
import type { InventoryIdol } from "~/schemas/inventory";
import { IdolCardMini } from "./idol-card";

const GRID_WIDTH = 6;
const GRID_HEIGHT = 7;
const CELL_SIZE = 64;

// Invalid cells (blocked) based on POE idol inventory layout:
const INVALID_CELLS: Set<string> = new Set([
	"0,0",
	"1,2",
	"1,3",
	"1,4",
	"2,3",
	"3,3",
	"4,3",
	"4,2",
	"4,4",
	"5,6",
]);

function isCellValid(x: number, y: number): boolean {
	return !INVALID_CELLS.has(`${x},${y}`);
}

interface IdolGridProps {
	placements: IdolPlacement[];
	inventory: InventoryIdol[];
	activeTab: GridTab;
	onTabChange: (tab: GridTab) => void;
	onPlaceIdol?: (
		inventoryIdolId: string,
		x: number,
		y: number,
		tab: GridTab,
	) => void;
	onMoveIdol?: (
		placementId: string,
		x: number,
		y: number,
		tab: GridTab,
	) => void;
	onRemoveIdol?: (placementId: string) => void;
	onCopyIdol?: (idol: IdolInstance) => void;
	onIdolClick?: (idol: IdolInstance, placementId: string) => void;
}

interface GridCell {
	occupied: boolean;
	placementId?: string;
	idol?: IdolInstance;
	isOrigin: boolean;
	isValid: boolean;
}

function createEmptyGrid(): GridCell[][] {
	return Array.from({ length: GRID_HEIGHT }, (_, y) =>
		Array.from({ length: GRID_WIDTH }, (_, x) => ({
			occupied: false,
			isOrigin: false,
			isValid: isCellValid(x, y),
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
						isValid: grid[cellY][cellX].isValid,
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
			const cell = grid[y + dy][x + dx];
			// Check if cell is occupied or invalid (blocked)
			if (cell.occupied || !cell.isValid) {
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
	originPosition?: { x: number; y: number };
	inventoryIdol?: InventoryIdol;
	onClick?: () => void;
	onRemove?: () => void;
	onCopy?: () => void;
	onDrop?: (x: number, y: number) => void;
	onDragStart?: (
		placementId: string,
		offset: { x: number; y: number },
	) => void;
	onDragEnd?: () => void;
	canDropHere?: boolean;
	isDropPreview?: boolean;
}

function GridCellComponent({
	cell,
	x,
	y,
	originPosition,
	inventoryIdol,
	onClick,
	onRemove,
	onCopy,
	onDrop,
	onDragStart,
	onDragEnd,
	canDropHere,
	isDropPreview,
}: GridCellComponentProps) {
	const [isDragOver, setIsDragOver] = useState(false);

	const handleDragOver = useCallback(
		(e: DragEvent<HTMLDivElement>) => {
			e.preventDefault();
			if (canDropHere) {
				e.dataTransfer.dropEffect = "move";
				setIsDragOver(true);
			} else {
				e.dataTransfer.dropEffect = "none";
			}
		},
		[canDropHere],
	);

	const handleDragLeave = useCallback(() => {
		setIsDragOver(false);
	}, []);

	const handleDrop = useCallback(
		(e: DragEvent<HTMLDivElement>) => {
			e.preventDefault();
			setIsDragOver(false);
			if (canDropHere && onDrop) {
				onDrop(x, y);
			}
		},
		[canDropHere, onDrop, x, y],
	);

	const handleIdolDragStart = useCallback(
		(e: DragEvent<HTMLButtonElement | HTMLDivElement>) => {
			if (cell.placementId && onDragStart && originPosition) {
				e.dataTransfer.effectAllowed = "move";
				const offset = {
					x: x - originPosition.x,
					y: y - originPosition.y,
				};
				onDragStart(cell.placementId, offset);
			}
		},
		[cell.placementId, onDragStart, originPosition, x, y],
	);

	const handleIdolDragEnd = useCallback(() => {
		onDragEnd?.();
	}, [onDragEnd]);

	if (cell.isOrigin && cell.idol && inventoryIdol) {
		return (
			<div
				className="absolute"
				style={{
					left: x * CELL_SIZE,
					top: y * CELL_SIZE,
				}}
			>
				<IdolCardMini
					idol={cell.idol}
					cellSize={CELL_SIZE}
					onClick={onClick}
					onRemove={onRemove}
					onCopy={onCopy}
					draggable
					onDragStart={handleIdolDragStart}
					onDragEnd={handleIdolDragEnd}
				/>
			</div>
		);
	}

	if (cell.occupied && !cell.isOrigin && cell.idol) {
		const idol = cell.idol;
		const base = IDOL_BASES[idol.baseType as IdolBaseKey];
		const allMods = [...idol.prefixes, ...idol.suffixes];

		return (
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						{/* biome-ignore lint/a11y/noStaticElementInteractions: Drag handle for idol movement */}
						<div
							className="absolute cursor-grab"
							style={{
								left: x * CELL_SIZE,
								top: y * CELL_SIZE,
								width: CELL_SIZE,
								height: CELL_SIZE,
							}}
							draggable
							onDragStart={handleIdolDragStart}
							onDragEnd={handleIdolDragEnd}
						/>
					</TooltipTrigger>
					<TooltipContent
						side="right"
						avoidCollisions
						collisionPadding={8}
						className="max-w-xs border border-border bg-card text-card-foreground"
					>
						<div className="space-y-1">
							<div className="flex items-center gap-1.5">
								<img
									src={base.image}
									alt=""
									className="h-5 w-5 object-contain"
								/>
								<span className="text-muted-foreground text-xs">
									{base.name}
								</span>
							</div>
							<div className="space-y-0.5">
								{allMods.map((mod, index) => (
									<div
										key={`${mod.modId}-${index}`}
										className={
											mod.type === "prefix"
												? "text-mod-prefix text-sm"
												: "text-mod-suffix text-sm"
										}
									>
										{highlightNumbers(mod.text)}
									</div>
								))}
							</div>
						</div>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		);
	}

	// Render invalid (blocked) cells with a distinct appearance
	if (!cell.isValid) {
		return (
			<div
				className="absolute border border-invalid bg-invalid/40"
				style={{
					left: x * CELL_SIZE,
					top: y * CELL_SIZE,
					width: CELL_SIZE,
					height: CELL_SIZE,
				}}
			/>
		);
	}

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: Drop target for drag-and-drop
		<div
			className={cn(
				"absolute border border-border bg-muted/30 transition-colors",
				isDragOver && canDropHere && "border-success bg-success/20",
				isDragOver &&
					!canDropHere &&
					"border-destructive bg-destructive/20",
				isDropPreview && "border-primary/50 bg-primary/10",
				!isDragOver &&
					!isDropPreview &&
					"hover:border-primary/50 hover:bg-primary/10",
			)}
			style={{
				left: x * CELL_SIZE,
				top: y * CELL_SIZE,
				width: CELL_SIZE,
				height: CELL_SIZE,
			}}
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			onDrop={handleDrop}
		/>
	);
}

function GridTabContent({
	tab,
	placements,
	inventory,
	onIdolClick,
	onRemoveIdol,
	onCopyIdol,
	onPlaceIdol,
	onMoveIdol,
}: {
	tab: GridTab;
	placements: IdolPlacement[];
	inventory: InventoryIdol[];
	onIdolClick?: (idol: IdolInstance, placementId: string) => void;
	onRemoveIdol?: (placementId: string) => void;
	onCopyIdol?: (idol: IdolInstance) => void;
	onPlaceIdol?: (
		inventoryIdolId: string,
		x: number,
		y: number,
		tab: GridTab,
	) => void;
	onMoveIdol?: (
		placementId: string,
		x: number,
		y: number,
		tab: GridTab,
	) => void;
}) {
	const { draggedItem, sourcePlacementId, dragOffset, setDraggedItem } =
		useDnd();

	const grid = useMemo(
		() => populateGrid(placements, inventory, tab),
		[placements, inventory, tab],
	);

	const inventoryMap = useMemo(() => {
		const map = new Map<string, InventoryIdol>();
		for (const inv of inventory) {
			map.set(inv.id, inv);
		}
		return map;
	}, [inventory]);

	const originPositionMap = useMemo(() => {
		const map = new Map<string, { x: number; y: number }>();
		const tabPlacements = placements.filter((p) => p.tab === tab);
		for (const placement of tabPlacements) {
			map.set(placement.id, placement.position);
		}
		return map;
	}, [placements, tab]);

	const canPlaceAtPosition = useCallback(
		(x: number, y: number): boolean => {
			if (!draggedItem) return false;
			const base = IDOL_BASES[draggedItem.idol.baseType as IdolBaseKey];

			const originX = x - dragOffset.x;
			const originY = y - dragOffset.y;

			if (
				originX < 0 ||
				originY < 0 ||
				originX + base.width > GRID_WIDTH ||
				originY + base.height > GRID_HEIGHT
			) {
				return false;
			}

			for (let dy = 0; dy < base.height; dy++) {
				for (let dx = 0; dx < base.width; dx++) {
					const cell = grid[originY + dy]?.[originX + dx];
					if (!cell?.isValid) return false;
					if (cell?.occupied) {
						if (
							sourcePlacementId &&
							cell.placementId === sourcePlacementId
						) {
							continue;
						}
						return false;
					}
				}
			}

			return true;
		},
		[draggedItem, grid, sourcePlacementId, dragOffset],
	);

	const handleDrop = useCallback(
		(x: number, y: number) => {
			if (!draggedItem) return;

			const originX = x - dragOffset.x;
			const originY = y - dragOffset.y;

			if (sourcePlacementId && onMoveIdol) {
				onMoveIdol(sourcePlacementId, originX, originY, tab);
			} else if (onPlaceIdol) {
				onPlaceIdol(draggedItem.id, originX, originY, tab);
			}
		},
		[
			draggedItem,
			sourcePlacementId,
			dragOffset,
			onPlaceIdol,
			onMoveIdol,
			tab,
		],
	);

	const handleIdolDragStart = useCallback(
		(placementId: string, offset: { x: number; y: number }) => {
			const placement = placements.find((p) => p.id === placementId);
			if (!placement) return;

			const invIdol = inventoryMap.get(placement.inventoryIdolId);
			if (!invIdol) return;

			setDraggedItem(invIdol, placementId, offset);
		},
		[placements, inventoryMap, setDraggedItem],
	);

	const handleIdolDragEnd = useCallback(() => {
		setDraggedItem(null);
	}, [setDraggedItem]);

	return (
		<div
			className="relative rounded-lg border border-border bg-card"
			style={{
				width: GRID_WIDTH * CELL_SIZE,
				height: GRID_HEIGHT * CELL_SIZE,
			}}
		>
			{grid.flatMap((row, y) =>
				row.map((cell, x) => {
					const inventoryIdol = cell.placementId
						? inventory.find((inv) => {
								const placement = placements.find(
									(p) => p.id === cell.placementId,
								);
								return (
									placement &&
									inv.id === placement.inventoryIdolId
								);
							})
						: undefined;

					const originPosition = cell.placementId
						? originPositionMap.get(cell.placementId)
						: undefined;

					return (
						<GridCellComponent
							key={`cell-${x}-${y}`}
							cell={cell}
							x={x}
							y={y}
							originPosition={originPosition}
							inventoryIdol={inventoryIdol}
							onClick={
								cell.isOrigin && cell.idol && cell.placementId
									? () =>
											onIdolClick?.(
												cell.idol as IdolInstance,
												cell.placementId as string,
											)
									: undefined
							}
							onRemove={
								cell.isOrigin && cell.placementId
									? () =>
											onRemoveIdol?.(
												cell.placementId as string,
											)
									: undefined
							}
							onCopy={
								cell.isOrigin && cell.idol
									? () =>
											onCopyIdol?.(
												cell.idol as IdolInstance,
											)
									: undefined
							}
							onDrop={handleDrop}
							onDragStart={handleIdolDragStart}
							onDragEnd={handleIdolDragEnd}
							canDropHere={canPlaceAtPosition(x, y)}
						/>
					);
				}),
			)}
		</div>
	);
}

export function IdolGrid({
	placements,
	inventory,
	activeTab,
	onTabChange: _onTabChange,
	onPlaceIdol,
	onMoveIdol,
	onRemoveIdol,
	onCopyIdol,
	onIdolClick,
}: IdolGridProps) {
	return (
		<div className="flex flex-col items-center">
			<GridTabContent
				tab={activeTab}
				placements={placements}
				inventory={inventory}
				onIdolClick={onIdolClick}
				onRemoveIdol={onRemoveIdol}
				onCopyIdol={onCopyIdol}
				onPlaceIdol={onPlaceIdol}
				onMoveIdol={onMoveIdol}
			/>
		</div>
	);
}

export {
	canPlaceIdol,
	GRID_WIDTH,
	GRID_HEIGHT,
	CELL_SIZE,
	INVALID_CELLS,
	isCellValid,
};
