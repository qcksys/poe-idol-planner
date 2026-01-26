import { Check, ChevronsUpDown, Star } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
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
	TooltipTrigger,
} from "~/components/ui/tooltip";
import { useFavorites } from "~/context/favorites-context";
import { LEAGUE_MECHANICS, type LeagueMechanic } from "~/data/idol-bases";
import idolModifiers from "~/data/idol-modifiers.json";
import { useTranslations } from "~/i18n";
import { cn } from "~/lib/utils";

export interface ModifierOption {
	id: string;
	type: "prefix" | "suffix";
	name: string;
	mechanic: LeagueMechanic;
	applicableIdols: string[];
	tiers: {
		tier: number;
		levelReq: number;
		text: string;
		values: { min: number; max: number }[];
	}[];
}

interface ModSearchProps {
	type?: "prefix" | "suffix";
	mechanicFilter?: LeagueMechanic | null;
	idolType?: string | null;
	selectedModId?: string | null;
	excludedModIds?: string[];
	onSelect: (mod: ModifierOption | null) => void;
	disabled?: boolean;
	placeholder?: string;
}

export function getModifierOptions(): ModifierOption[] {
	// Dedupe mods by tier text, merging applicableIdols for identical mods
	const modsByText = new Map<string, ModifierOption>();

	for (const mod of idolModifiers) {
		const tierText = mod.tiers[0]?.text?.en || "";
		const key = `${mod.type}:${mod.mechanic}:${tierText}`;

		const existing = modsByText.get(key);
		if (existing) {
			// Merge applicableIdols from duplicate
			const newIdols = mod.applicableIdols.filter(
				(idol) => !existing.applicableIdols.includes(idol),
			);
			existing.applicableIdols.push(...newIdols);
		} else {
			modsByText.set(key, {
				id: mod.id,
				type: mod.type as "prefix" | "suffix",
				name: mod.name.en || tierText || mod.id,
				mechanic: mod.mechanic as LeagueMechanic,
				applicableIdols: [...mod.applicableIdols],
				tiers: mod.tiers.map((tier) => ({
					tier: tier.tier,
					levelReq: tier.levelReq,
					text: tier.text.en || "",
					values: tier.values || [],
				})),
			});
		}
	}

	return Array.from(modsByText.values());
}

export function ModSearch({
	type,
	mechanicFilter,
	idolType,
	selectedModId,
	excludedModIds = [],
	onSelect,
	disabled = false,
	placeholder,
}: ModSearchProps) {
	const t = useTranslations();
	const [open, setOpen] = useState(false);
	const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
	const { favorites, toggleFavorite, isFavorite } = useFavorites();

	const allModifiers = useMemo(() => getModifierOptions(), []);

	const filteredModifiers = useMemo(() => {
		return allModifiers.filter((mod) => {
			if (type && mod.type !== type) return false;
			if (mechanicFilter && mod.mechanic !== mechanicFilter) return false;
			if (idolType) {
				const idolTypeName =
					idolType.charAt(0).toUpperCase() + idolType.slice(1);
				if (!mod.applicableIdols.includes(idolTypeName)) return false;
			}
			if (excludedModIds.includes(mod.id)) return false;
			if (showFavoritesOnly && !favorites.includes(mod.id)) return false;
			return true;
		});
	}, [
		allModifiers,
		type,
		mechanicFilter,
		idolType,
		excludedModIds,
		showFavoritesOnly,
		favorites,
	]);

	const groupedModifiers = useMemo(() => {
		const groups: Record<LeagueMechanic, ModifierOption[]> = {} as Record<
			LeagueMechanic,
			ModifierOption[]
		>;
		for (const mod of filteredModifiers) {
			if (!groups[mod.mechanic]) {
				groups[mod.mechanic] = [];
			}
			groups[mod.mechanic].push(mod);
		}
		return groups;
	}, [filteredModifiers]);

	const selectedMod = selectedModId
		? allModifiers.find((m) => m.id === selectedModId)
		: null;

	const displayText =
		selectedMod?.tiers[0]?.text ||
		selectedMod?.name ||
		placeholder ||
		t.editor.selectMod;

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					aria-expanded={open}
					className="h-auto min-h-9 w-full justify-between text-left font-normal"
					disabled={disabled}
				>
					<span className="whitespace-normal text-wrap">
						{displayText}
					</span>
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[500px] p-0" align="start">
				<Command>
					<CommandInput placeholder={t.editor.searchMods} />
					<div className="flex items-center gap-2 border-b px-3 py-2">
						<Checkbox
							id="favorites-filter"
							checked={showFavoritesOnly}
							onCheckedChange={(checked) =>
								setShowFavoritesOnly(checked === true)
							}
						/>
						<label
							htmlFor="favorites-filter"
							className="cursor-pointer text-sm"
						>
							{t.editor.favoritesOnly}
						</label>
					</div>
					<CommandList className="max-h-[300px]">
						<CommandEmpty>{t.editor.noModsFound}</CommandEmpty>
						{LEAGUE_MECHANICS.map((mechanic) => {
							const mods = groupedModifiers[mechanic];
							if (!mods || mods.length === 0) return null;

							return (
								<CommandGroup
									key={mechanic}
									heading={t.mechanics[mechanic] || mechanic}
								>
									{mods.map((mod) => {
										const modIsFavorite = isFavorite(
											mod.id,
										);
										return (
											<CommandItem
												key={mod.id}
												value={`${mod.name} ${mod.tiers[0]?.text || ""} ${mod.mechanic}`}
												onSelect={() => {
													onSelect(
														mod.id === selectedModId
															? null
															: mod,
													);
													setOpen(false);
												}}
											>
												<Check
													className={cn(
														"mr-2 h-4 w-4 shrink-0",
														selectedModId === mod.id
															? "opacity-100"
															: "opacity-0",
													)}
												/>
												<div className="flex flex-1 flex-col">
													<span className="text-sm">
														{mod.tiers[0]?.text ||
															mod.name}
													</span>
												</div>
												<Tooltip>
													<TooltipTrigger asChild>
														<button
															type="button"
															onClick={(e) => {
																e.stopPropagation();
																toggleFavorite(
																	mod.id,
																);
															}}
															className="ml-2 shrink-0 rounded p-1 hover:bg-accent"
														>
															<Star
																className={cn(
																	"h-4 w-4",
																	modIsFavorite
																		? "fill-yellow-400 text-yellow-400"
																		: "text-muted-foreground",
																)}
															/>
														</button>
													</TooltipTrigger>
													<TooltipContent>
														{modIsFavorite
															? t.editor
																	.removeFromFavorites
															: t.editor
																	.addToFavorites}
													</TooltipContent>
												</Tooltip>
											</CommandItem>
										);
									})}
								</CommandGroup>
							);
						})}
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}

interface MechanicFilterProps {
	value: LeagueMechanic | null;
	onChange: (mechanic: LeagueMechanic | null) => void;
	showAll?: boolean;
}

export function MechanicFilter({
	value,
	onChange,
	showAll = true,
}: MechanicFilterProps) {
	const t = useTranslations();
	const [open, setOpen] = useState(false);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					aria-expanded={open}
					className="w-full justify-between"
					size="sm"
				>
					<span>
						{value ? t.mechanics[value] : t.editor.allMechanics}
					</span>
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[200px] p-0" align="start">
				<Command>
					<CommandInput placeholder={t.editor.searchMechanic} />
					<CommandList className="max-h-[200px]">
						<CommandEmpty>{t.editor.noMechanicsFound}</CommandEmpty>
						<CommandGroup>
							{showAll && (
								<CommandItem
									value="all"
									onSelect={() => {
										onChange(null);
										setOpen(false);
									}}
								>
									<Check
										className={cn(
											"mr-2 h-4 w-4",
											value === null
												? "opacity-100"
												: "opacity-0",
										)}
									/>
									{t.editor.allMechanics}
								</CommandItem>
							)}
							{LEAGUE_MECHANICS.map((mechanic) => {
								const displayText =
									t.mechanics[mechanic] || mechanic;
								return (
									<CommandItem
										key={mechanic}
										value={`${mechanic} ${displayText}`}
										onSelect={() => {
											onChange(mechanic);
											setOpen(false);
										}}
									>
										<Check
											className={cn(
												"mr-2 h-4 w-4",
												value === mechanic
													? "opacity-100"
													: "opacity-0",
											)}
										/>
										{displayText}
									</CommandItem>
								);
							})}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
