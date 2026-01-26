import {
	BookOpen,
	CheckSquare,
	ClipboardPaste,
	Copy,
	ExternalLink,
	PenLine,
	Plus,
	Search,
	Trash2,
	X,
} from "lucide-react";
import { type DragEvent, useCallback, useRef, useState } from "react";
import { MultiMechanicFilter } from "~/components/mod-search";
import { ModsSearchModal } from "~/components/mods-search-modal";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { ScrollArea } from "~/components/ui/scroll-area";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "~/components/ui/tooltip";
import { useDnd } from "~/context/dnd-context";
import type { LeagueMechanic } from "~/data/idol-bases";
import { useLeague } from "~/hooks/use-league";
import { useTranslations } from "~/i18n";
import { generateTradeUrl } from "~/lib/trade-search";
import { cn } from "~/lib/utils";
import type { InventoryIdol } from "~/schemas/inventory";
import { IdolCard } from "./idol-card";

interface InventoryPanelProps {
	inventory: InventoryIdol[];
	onImportClick: () => void;
	onCreateClick?: () => void;
	onIdolClick?: (idol: InventoryIdol) => void;
	onDuplicateIdol?: (id: string) => void;
	onRemoveIdol?: (id: string) => void;
	onRemoveIdols?: (ids: string[]) => void;
	onClearAll?: () => void;
	onPasteIdol?: () => void;
	hasClipboardIdol?: boolean;
}

function DraggableIdolCard({
	item,
	isSelected,
	league,
	onIdolClick,
	onDuplicateIdol,
	onRemoveIdol,
	onSelect,
	t,
}: {
	item: InventoryIdol;
	isSelected: boolean;
	league: string;
	onIdolClick?: (idol: InventoryIdol) => void;
	onDuplicateIdol?: (id: string) => void;
	onRemoveIdol?: (id: string) => void;
	onSelect?: (id: string, e: React.MouseEvent) => void;
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

	const handleFindOnTrade = (e: React.MouseEvent) => {
		e.stopPropagation();
		const url = generateTradeUrl(item.idol, { league });
		window.open(url, "_blank", "noopener,noreferrer");
	};

	const handleClick = (e: React.MouseEvent) => {
		// If Ctrl/Cmd is pressed, handle selection
		if (e.ctrlKey || e.metaKey || e.shiftKey) {
			e.preventDefault();
			onSelect?.(item.id, e);
		} else {
			// Normal click opens editor
			onIdolClick?.(item);
		}
	};

	return (
		<li
			className={cn(
				"group relative cursor-grab list-none active:cursor-grabbing",
				isSelected && "rounded-md ring-2 ring-primary ring-offset-2",
			)}
			draggable
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}
			onClick={handleClick}
		>
			<IdolCard idol={item.idol} showTooltip={false} />
			<div className="absolute top-1 right-1 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="secondary"
							size="icon"
							className="h-6 w-6"
							onClick={handleFindOnTrade}
						>
							<ExternalLink className="h-3 w-3" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>{t.trade.findSimilar}</TooltipContent>
				</Tooltip>
				{onIdolClick && (
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="secondary"
								size="icon"
								className="h-6 w-6"
								onClick={(e) => {
									e.stopPropagation();
									onIdolClick(item);
								}}
							>
								<PenLine className="h-3 w-3" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>{t.inventory.edit}</TooltipContent>
					</Tooltip>
				)}
				{onDuplicateIdol && (
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="secondary"
								size="icon"
								className="h-6 w-6"
								onClick={(e) => {
									e.stopPropagation();
									onDuplicateIdol(item.id);
								}}
							>
								<Copy className="h-3 w-3" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>{t.inventory.duplicate}</TooltipContent>
					</Tooltip>
				)}
				{onRemoveIdol && (
					<Tooltip>
						<TooltipTrigger asChild>
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
						</TooltipTrigger>
						<TooltipContent>
							{t.inventory.removeFromInventory}
						</TooltipContent>
					</Tooltip>
				)}
			</div>
			{item.usageCount > 0 && (
				<span className="absolute right-1 bottom-1 rounded bg-primary px-1 text-primary-foreground text-xs">
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
	onRemoveIdols,
	onClearAll,
	onPasteIdol,
	hasClipboardIdol,
}: InventoryPanelProps) {
	const t = useTranslations();
	const { league } = useLeague();
	const [searchQuery, setSearchQuery] = useState("");
	const [mechanicFilter, setMechanicFilter] = useState<LeagueMechanic[]>([]);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const lastSelectedId = useRef<string | null>(null);
	const [modsSearchOpen, setModsSearchOpen] = useState(false);

	const filteredInventory = inventory.filter((item) => {
		const idol = item.idol;
		const allMods = [...idol.prefixes, ...idol.suffixes];

		if (mechanicFilter.length > 0) {
			const mechanicSet = new Set(mechanicFilter);
			const hasMechanic = allMods.some(
				(mod) => mod.mechanic && mechanicSet.has(mod.mechanic),
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

	const handleSelect = useCallback(
		(id: string, e: React.MouseEvent) => {
			setSelectedIds((prev) => {
				const newSet = new Set(prev);

				if (e.shiftKey && lastSelectedId.current) {
					// Range selection
					const filteredIds = filteredInventory.map(
						(item) => item.id,
					);
					const lastIndex = filteredIds.indexOf(
						lastSelectedId.current,
					);
					const currentIndex = filteredIds.indexOf(id);

					if (lastIndex !== -1 && currentIndex !== -1) {
						const start = Math.min(lastIndex, currentIndex);
						const end = Math.max(lastIndex, currentIndex);
						for (let i = start; i <= end; i++) {
							newSet.add(filteredIds[i]);
						}
					}
				} else if (e.ctrlKey || e.metaKey) {
					// Toggle selection
					if (newSet.has(id)) {
						newSet.delete(id);
					} else {
						newSet.add(id);
					}
					lastSelectedId.current = id;
				}

				return newSet;
			});
		},
		[filteredInventory],
	);

	const handleSelectAll = () => {
		const allIds = filteredInventory.map((item) => item.id);
		setSelectedIds(new Set(allIds));
		lastSelectedId.current = allIds[allIds.length - 1] || null;
	};

	const handleDeselectAll = () => {
		setSelectedIds(new Set());
		lastSelectedId.current = null;
	};

	const handleDeleteSelected = () => {
		if (onRemoveIdols) {
			onRemoveIdols(Array.from(selectedIds));
		} else if (onRemoveIdol) {
			// Fallback to single delete
			for (const id of selectedIds) {
				onRemoveIdol(id);
			}
		}
		setSelectedIds(new Set());
		lastSelectedId.current = null;
	};

	const selectionCount = selectedIds.size;
	const hasSelection = selectionCount > 0;

	return (
		<Card className="flex h-full flex-col">
			<CardHeader className="pb-2">
				<div className="flex items-center justify-between">
					<CardTitle className="text-lg">
						{t.inventory.title}
					</CardTitle>
					<span className="text-muted-foreground text-sm">
						{hasSelection
							? t.inventory.selected.replace(
									"{count}",
									String(selectionCount),
								)
							: `${inventory.length} idol(s)`}
					</span>
				</div>
			</CardHeader>

			<CardContent className="flex flex-1 flex-col gap-2 overflow-hidden">
				{hasSelection ? (
					<div className="flex items-center gap-2 rounded-md bg-muted p-2">
						<Button
							variant="ghost"
							size="sm"
							onClick={handleDeselectAll}
							className="h-8"
						>
							<X className="mr-1 h-4 w-4" />
							{t.inventory.deselectAll}
						</Button>
						<div className="flex-1" />
						<Button
							variant="destructive"
							size="sm"
							onClick={handleDeleteSelected}
							className="h-8"
						>
							<Trash2 className="mr-1 h-4 w-4" />
							{t.inventory.deleteSelected}
						</Button>
					</div>
				) : (
					<>
						<div className="relative">
							<Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder={t.inventory.search}
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-8"
							/>
						</div>

						<MultiMechanicFilter
							value={mechanicFilter}
							onChange={setMechanicFilter}
						/>

						<div className="flex flex-wrap gap-2">
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
							{hasClipboardIdol && onPasteIdol && (
								<Button
									onClick={onPasteIdol}
									variant="secondary"
									size="sm"
									className="flex-1"
								>
									<ClipboardPaste className="mr-1 h-4 w-4" />
									{t.inventory.paste}
								</Button>
							)}
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="secondary"
										size="sm"
										onClick={() => setModsSearchOpen(true)}
									>
										<BookOpen className="h-4 w-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									{t.inventory.browseMods || "Browse Mods"}
								</TooltipContent>
							</Tooltip>
							{onClearAll && inventory.length > 0 && (
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											variant="destructive"
											size="sm"
											onClick={onClearAll}
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</TooltipTrigger>
									<TooltipContent>
										{t.inventory.clear}
									</TooltipContent>
								</Tooltip>
							)}
						</div>
					</>
				)}

				{filteredInventory.length > 0 && !hasSelection && (
					<div className="flex items-center justify-end">
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="sm"
									onClick={handleSelectAll}
									className="h-7 text-muted-foreground text-xs"
								>
									<CheckSquare className="mr-1 h-3 w-3" />
									{t.inventory.selectAll}
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								{t.inventory.selectionHint}
							</TooltipContent>
						</Tooltip>
					</div>
				)}

				<ScrollArea className="min-h-0 flex-1">
					{filteredInventory.length === 0 ? (
						<div className="py-8 text-center text-muted-foreground">
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
									isSelected={selectedIds.has(item.id)}
									league={league}
									onIdolClick={onIdolClick}
									onDuplicateIdol={onDuplicateIdol}
									onRemoveIdol={onRemoveIdol}
									onSelect={handleSelect}
									t={t}
								/>
							))}
						</ul>
					)}
				</ScrollArea>
			</CardContent>

			<ModsSearchModal
				open={modsSearchOpen}
				onOpenChange={setModsSearchOpen}
			/>
		</Card>
	);
}
