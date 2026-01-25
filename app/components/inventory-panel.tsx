import { Copy, PenLine, Plus, Search, Trash2 } from "lucide-react";
import { type DragEvent, useState } from "react";
import { MechanicFilter } from "~/components/mod-search";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { ScrollArea } from "~/components/ui/scroll-area";
import { useDnd } from "~/context/dnd-context";
import type { LeagueMechanic } from "~/data/idol-bases";
import { useTranslations } from "~/i18n";
import type { InventoryIdol } from "~/schemas/inventory";
import { IdolCard } from "./idol-card";

interface InventoryPanelProps {
	inventory: InventoryIdol[];
	onImportClick: () => void;
	onCreateClick?: () => void;
	onIdolClick?: (idol: InventoryIdol) => void;
	onDuplicateIdol?: (id: string) => void;
	onRemoveIdol?: (id: string) => void;
	onClearAll?: () => void;
}

function DraggableIdolCard({
	item,
	onIdolClick,
	onDuplicateIdol,
	onRemoveIdol,
	t,
}: {
	item: InventoryIdol;
	onIdolClick?: (idol: InventoryIdol) => void;
	onDuplicateIdol?: (id: string) => void;
	onRemoveIdol?: (id: string) => void;
	t: ReturnType<typeof useTranslations>;
}) {
	const { setDraggedItem } = useDnd();

	const handleDragStart = (e: DragEvent<HTMLLIElement>) => {
		setDraggedItem(item);
		e.dataTransfer.setData("text/plain", item.id);
		e.dataTransfer.effectAllowed = "move";
	};

	const handleDragEnd = () => {
		setDraggedItem(null);
	};

	return (
		<li
			className="group relative cursor-grab list-none active:cursor-grabbing"
			draggable
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}
		>
			<IdolCard
				idol={item.idol}
				showTradeMenu
				showTooltip={false}
				onClick={() => onIdolClick?.(item)}
			/>
			<div className="absolute top-1 right-1 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
				{onDuplicateIdol && (
					<Button
						variant="secondary"
						size="icon"
						className="h-6 w-6"
						onClick={(e) => {
							e.stopPropagation();
							onDuplicateIdol(item.id);
						}}
						title={t.inventory.duplicate}
					>
						<Copy className="h-3 w-3" />
					</Button>
				)}
				{onRemoveIdol && (
					<Button
						variant="destructive"
						size="icon"
						className="h-6 w-6"
						onClick={(e) => {
							e.stopPropagation();
							onRemoveIdol(item.id);
						}}
					>
						<Trash2 className="h-3 w-3" />
					</Button>
				)}
			</div>
			{item.usageCount > 0 && (
				<span className="absolute right-1 bottom-1 rounded bg-blue-600 px-1 text-xs">
					{t.inventory.usedInSets.replace(
						"{count}",
						String(item.usageCount),
					)}
				</span>
			)}
		</li>
	);
}

export function InventoryPanel({
	inventory,
	onImportClick,
	onCreateClick,
	onIdolClick,
	onDuplicateIdol,
	onRemoveIdol,
	onClearAll,
}: InventoryPanelProps) {
	const t = useTranslations();
	const [searchQuery, setSearchQuery] = useState("");
	const [mechanicFilter, setMechanicFilter] = useState<LeagueMechanic | null>(
		null,
	);

	const filteredInventory = inventory.filter((item) => {
		const idol = item.idol;
		const allMods = [...idol.prefixes, ...idol.suffixes];

		if (mechanicFilter) {
			const hasMechanic = allMods.some(
				(mod) => mod.mechanic === mechanicFilter,
			);
			if (!hasMechanic) return false;
		}

		if (!searchQuery) return true;
		const query = searchQuery.toLowerCase();
		return (
			idol.name?.toLowerCase().includes(query) ||
			idol.baseType.toLowerCase().includes(query) ||
			allMods.some((mod) => mod.text.toLowerCase().includes(query))
		);
	});

	return (
		<Card className="flex h-full flex-col">
			<CardHeader className="pb-2">
				<div className="flex items-center justify-between">
					<CardTitle className="text-lg">
						{t.inventory.title}
					</CardTitle>
					<span className="text-gray-400 text-sm">
						{inventory.length} idol(s)
					</span>
				</div>
			</CardHeader>

			<CardContent className="flex flex-1 flex-col gap-2 overflow-hidden">
				<div className="relative">
					<Search className="absolute top-2.5 left-2 h-4 w-4 text-gray-400" />
					<Input
						placeholder={t.inventory.search}
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-8"
					/>
				</div>

				<MechanicFilter
					value={mechanicFilter}
					onChange={setMechanicFilter}
				/>

				<div className="flex gap-2">
					<Button
						onClick={onImportClick}
						className="flex-1"
						size="sm"
					>
						<Plus className="mr-1 h-4 w-4" />
						{t.inventory.import}
					</Button>
					{onCreateClick && (
						<Button
							onClick={onCreateClick}
							variant="outline"
							className="flex-1"
							size="sm"
						>
							<PenLine className="mr-1 h-4 w-4" />
							{t.inventory.create}
						</Button>
					)}
					{onClearAll && inventory.length > 0 && (
						<Button
							variant="destructive"
							size="sm"
							onClick={onClearAll}
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					)}
				</div>

				<ScrollArea className="flex-1">
					{filteredInventory.length === 0 ? (
						<div className="py-8 text-center text-gray-400">
							{inventory.length === 0
								? t.inventory.empty
								: t.inventory.noMatches}
						</div>
					) : (
						<ul className="space-y-2 pr-2">
							{filteredInventory.map((item) => (
								<DraggableIdolCard
									key={item.id}
									item={item}
									onIdolClick={onIdolClick}
									onDuplicateIdol={onDuplicateIdol}
									onRemoveIdol={onRemoveIdol}
									t={t}
								/>
							))}
						</ul>
					)}
				</ScrollArea>
			</CardContent>
		</Card>
	);
}
