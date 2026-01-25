import { Check, ChevronsUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "~/components/ui/button";
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
import { LEAGUE_MECHANICS, type LeagueMechanic } from "~/data/idol-bases";
import idolModifiers from "~/data/idol-modifiers.json";
import { useTranslations } from "~/i18n";
import { cn } from "~/lib/utils";

export interface ModifierOption {
	id: string;
	type: "prefix" | "suffix";
	name: string;
	mechanic: LeagueMechanic;
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
	selectedModId?: string | null;
	onSelect: (mod: ModifierOption | null) => void;
	disabled?: boolean;
	placeholder?: string;
}

export function getModifierOptions(): ModifierOption[] {
	return idolModifiers.map((mod) => ({
		id: mod.id,
		type: mod.type as "prefix" | "suffix",
		name: mod.name.en || mod.tiers[0]?.text?.en || mod.id,
		mechanic: mod.mechanic as LeagueMechanic,
		tiers: mod.tiers.map((tier) => ({
			tier: tier.tier,
			levelReq: tier.levelReq,
			text: tier.text.en || "",
			values: tier.values || [],
		})),
	}));
}

export function ModSearch({
	type,
	mechanicFilter,
	selectedModId,
	onSelect,
	disabled = false,
	placeholder,
}: ModSearchProps) {
	const t = useTranslations();
	const [open, setOpen] = useState(false);

	const allModifiers = useMemo(() => getModifierOptions(), []);

	const filteredModifiers = useMemo(() => {
		return allModifiers.filter((mod) => {
			if (type && mod.type !== type) return false;
			if (mechanicFilter && mod.mechanic !== mechanicFilter) return false;
			return true;
		});
	}, [allModifiers, type, mechanicFilter]);

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
									{mods.map((mod) => (
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
											<div className="flex flex-col">
												<span className="text-sm">
													{mod.tiers[0]?.text ||
														mod.name}
												</span>
											</div>
										</CommandItem>
									))}
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
							{LEAGUE_MECHANICS.map((mechanic) => (
								<CommandItem
									key={mechanic}
									value={mechanic}
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
									{t.mechanics[mechanic] || mechanic}
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
