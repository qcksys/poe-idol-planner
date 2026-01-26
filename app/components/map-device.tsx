import { Check, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "~/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "~/components/ui/popover";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "~/components/ui/tooltip";
import {
	getScarabById,
	getScarabsByCategory,
	SCARAB_CATEGORIES,
	SCARABS,
} from "~/data/scarab-data";
import { useTranslations } from "~/i18n";
import { cn } from "~/lib/utils";
import type { MapDevice, Scarab } from "~/schemas/scarab";

interface MapDeviceProps {
	mapDevice: MapDevice;
	onSlotChange: (slotIndex: number, scarabId: string | null) => void;
}

interface ScarabSlotProps {
	slotIndex: number;
	scarabId: string | null;
	onSelect: (scarabId: string | null) => void;
	usedScarabIds: string[];
}

function ScarabSlot({
	slotIndex,
	scarabId,
	onSelect,
	usedScarabIds,
}: ScarabSlotProps) {
	const t = useTranslations();
	const [open, setOpen] = useState(false);
	const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

	const scarab = scarabId ? getScarabById(scarabId) : null;

	const filteredScarabs = useMemo(() => {
		let scarabs = categoryFilter
			? getScarabsByCategory(categoryFilter)
			: SCARABS;

		// Filter out already used scarabs (unless it's the current one)
		scarabs = scarabs.filter(
			(s) => !usedScarabIds.includes(s.id) || s.id === scarabId,
		);

		return scarabs;
	}, [categoryFilter, usedScarabIds, scarabId]);

	const groupedScarabs = useMemo(() => {
		const groups: Record<string, Scarab[]> = {};
		for (const s of filteredScarabs) {
			if (!groups[s.category]) {
				groups[s.category] = [];
			}
			groups[s.category].push(s);
		}
		return groups;
	}, [filteredScarabs]);

	const handleClear = (e: React.MouseEvent) => {
		e.stopPropagation();
		onSelect(null);
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<PopoverTrigger asChild>
							<button
								type="button"
								className={cn(
									"relative flex h-16 w-16 items-center justify-center rounded-lg border-2 transition-all hover:border-primary",
									scarab
										? "border-primary/50 bg-card"
										: "border-muted-foreground/30 border-dashed bg-muted/20",
								)}
							>
								{scarab ? (
									<>
										<img
											src={scarab.image}
											alt={scarab.name}
											className="h-12 w-12 object-contain"
											onError={(e) => {
												// Fallback to CDN if local image fails
												const img =
													e.target as HTMLImageElement;
												if (
													!img.src.includes(
														"cdn.poedb.tw",
													)
												) {
													img.src = `https://cdn.poedb.tw/image/Art/2DItems/Currency/Scarabs/${scarab.id}.webp`;
												}
											}}
										/>
										<Button
											variant="destructive"
											size="icon"
											className="absolute -top-1 -right-1 h-5 w-5 opacity-0 transition-opacity hover:opacity-100 group-hover:opacity-100"
											onClick={handleClear}
										>
											<X className="h-3 w-3" />
										</Button>
									</>
								) : (
									<span className="text-muted-foreground text-xs">
										{slotIndex + 1}
									</span>
								)}
							</button>
						</PopoverTrigger>
					</TooltipTrigger>
					{scarab && (
						<TooltipContent
							side="top"
							className="max-w-xs border border-border bg-card text-card-foreground"
						>
							<div className="space-y-1">
								<div className="font-semibold">
									{scarab.name}
								</div>
								<div className="text-muted-foreground text-sm">
									{scarab.effect}
								</div>
								<div className="text-muted-foreground text-xs">
									Limit: {scarab.limit}
								</div>
							</div>
						</TooltipContent>
					)}
				</Tooltip>
			</TooltipProvider>

			<PopoverContent className="w-[400px] p-0" align="start">
				<Command>
					<CommandInput
						placeholder={
							t.mapDevice?.searchScarabs || "Search scarabs..."
						}
					/>
					<div className="flex flex-wrap gap-1 border-b p-2">
						<Button
							variant={
								categoryFilter === null ? "secondary" : "ghost"
							}
							size="sm"
							className="h-6 text-xs"
							onClick={() => setCategoryFilter(null)}
						>
							All
						</Button>
						{SCARAB_CATEGORIES.slice(0, 8).map((cat) => (
							<Button
								key={cat}
								variant={
									categoryFilter === cat
										? "secondary"
										: "ghost"
								}
								size="sm"
								className="h-6 text-xs capitalize"
								onClick={() => setCategoryFilter(cat)}
							>
								{cat}
							</Button>
						))}
					</div>
					<CommandList className="max-h-[300px]">
						<CommandEmpty>
							{t.mapDevice?.noScarabsFound || "No scarabs found."}
						</CommandEmpty>
						{Object.entries(groupedScarabs).map(
							([category, scarabs]) => (
								<CommandGroup
									key={category}
									heading={
										category.charAt(0).toUpperCase() +
										category.slice(1)
									}
								>
									{scarabs.map((s) => (
										<CommandItem
											key={s.id}
											value={`${s.name} ${s.effect} ${s.category}`}
											onSelect={() => {
												onSelect(
													s.id === scarabId
														? null
														: s.id,
												);
												setOpen(false);
											}}
										>
											<Check
												className={cn(
													"mr-2 h-4 w-4 shrink-0",
													scarabId === s.id
														? "opacity-100"
														: "opacity-0",
												)}
											/>
											<img
												src={s.image}
												alt=""
												className="mr-2 h-6 w-6 object-contain"
											/>
											<div className="flex flex-col">
												<span className="text-sm">
													{s.name}
												</span>
												<span className="line-clamp-1 text-muted-foreground text-xs">
													{s.effect}
												</span>
											</div>
										</CommandItem>
									))}
								</CommandGroup>
							),
						)}
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}

export function MapDeviceComponent({
	mapDevice,
	onSlotChange,
}: MapDeviceProps) {
	const t = useTranslations();

	const usedScarabIds = useMemo(() => {
		return mapDevice.slots
			.map((slot) => slot.scarabId)
			.filter((id): id is string => id !== null);
	}, [mapDevice.slots]);

	const selectedScarabs = useMemo(() => {
		return mapDevice.slots
			.map((slot) =>
				slot.scarabId ? getScarabById(slot.scarabId) : null,
			)
			.filter((s): s is Scarab => s !== null);
	}, [mapDevice.slots]);

	return (
		<Card>
			<CardHeader className="pb-2">
				<div className="flex items-center justify-between">
					<CardTitle className="text-lg">
						{t.mapDevice?.title || "Map Device"}
					</CardTitle>
					<span className="text-muted-foreground text-sm">
						{selectedScarabs.length}/5 scarabs
					</span>
				</div>
			</CardHeader>
			<CardContent>
				<div className="flex justify-center gap-2">
					{mapDevice.slots.map((slot) => (
						<ScarabSlot
							key={slot.slotIndex}
							slotIndex={slot.slotIndex}
							scarabId={slot.scarabId}
							onSelect={(scarabId) =>
								onSlotChange(slot.slotIndex, scarabId)
							}
							usedScarabIds={usedScarabIds}
						/>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
