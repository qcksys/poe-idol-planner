import { nanoid } from "nanoid";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
	getModifierOptions,
	MechanicFilter,
	type ModifierOption,
	ModSearch,
} from "~/components/mod-search";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { ScrollArea } from "~/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { Slider } from "~/components/ui/slider";
import {
	IDOL_BASE_KEYS,
	IDOL_BASES,
	type IdolBaseKey,
	type LeagueMechanic,
} from "~/data/idol-bases";
import { useTranslations } from "~/i18n";
import { highlightNumbers } from "~/lib/highlight-numbers";
import type { IdolInstance, IdolModifier } from "~/schemas/idol";

interface IdolEditorProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSave: (idol: IdolInstance) => void;
	initialIdol?: IdolInstance | null;
}

interface ModSlotProps {
	type: "prefix" | "suffix";
	index: number;
	mod: SelectedMod | null;
	mechanicFilter: LeagueMechanic | null;
	idolType: IdolBaseKey;
	excludedModIds: string[];
	onModChange: (mod: SelectedMod | null) => void;
	onTierChange: (tier: number) => void;
	onValueChange: (value: number) => void;
}

interface SelectedMod {
	modOption: ModifierOption;
	tier: number;
	rolledValue: number;
}

function ModSlot({
	type,
	index,
	mod,
	mechanicFilter,
	idolType,
	excludedModIds,
	onModChange,
	onTierChange,
	onValueChange,
}: ModSlotProps) {
	const t = useTranslations();
	const selectedTier = mod?.modOption.tiers.find((t) => t.tier === mod.tier);
	const valueRange = selectedTier?.values?.[0];

	const handleModSelect = (modOption: ModifierOption | null) => {
		if (!modOption) {
			onModChange(null);
			return;
		}
		const firstTier = modOption.tiers[0];
		const defaultValue = firstTier?.values?.[0]?.min ?? 0;
		onModChange({
			modOption,
			tier: firstTier?.tier ?? 1,
			rolledValue: defaultValue,
		});
	};

	return (
		<div className="space-y-2 rounded-lg border p-3">
			<div className="flex items-center gap-2">
				<span className="w-16 text-muted-foreground text-sm capitalize">
					{type} {index + 1}
				</span>
				<div className="flex-1">
					<ModSearch
						type={type}
						mechanicFilter={mechanicFilter}
						idolType={idolType}
						selectedModId={mod?.modOption.id ?? null}
						excludedModIds={excludedModIds}
						onSelect={handleModSelect}
					/>
				</div>
			</div>

			{mod && (
				<div className="ml-16 space-y-2">
					<div className="flex gap-2">
						{mod.modOption.tiers.length > 1 && (
							<Select
								value={String(mod.tier)}
								onValueChange={(v) => onTierChange(Number(v))}
							>
								<SelectTrigger className="w-24">
									<SelectValue placeholder={t.editor.tier} />
								</SelectTrigger>
								<SelectContent>
									{mod.modOption.tiers.map((tier) => (
										<SelectItem
											key={tier.tier}
											value={String(tier.tier)}
										>
											T{tier.tier}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}

						{valueRange && valueRange.min !== valueRange.max && (
							<div className="flex flex-1 items-center gap-3">
								<Slider
									value={[mod.rolledValue]}
									min={valueRange.min}
									max={valueRange.max}
									step={1}
									onValueChange={([value]) =>
										onValueChange(value)
									}
									className="flex-1"
								/>
								<span className="w-16 text-right text-sm tabular-nums">
									{mod.rolledValue}
								</span>
							</div>
						)}
					</div>
					{selectedTier?.text && (
						<div
							className={
								type === "prefix"
									? "text-blue-700 text-sm dark:text-blue-300"
									: "text-green-700 text-sm dark:text-green-300"
							}
						>
							{highlightNumbers(selectedTier.text)}
						</div>
					)}
				</div>
			)}
		</div>
	);
}

export function IdolEditor({
	open,
	onOpenChange,
	onSave,
	initialIdol,
}: IdolEditorProps) {
	const t = useTranslations();
	const [baseType, setBaseType] = useState<IdolBaseKey>("minor");
	const [itemLevel, setItemLevel] = useState(68);
	const [name, setName] = useState("");
	const [mechanicFilter, setMechanicFilter] = useState<LeagueMechanic | null>(
		null,
	);
	const [prefixes, setPrefixes] = useState<(SelectedMod | null)[]>([
		null,
		null,
	]);
	const [suffixes, setSuffixes] = useState<(SelectedMod | null)[]>([
		null,
		null,
	]);

	const allModifiers = useMemo(() => getModifierOptions(), []);

	useEffect(() => {
		if (initialIdol) {
			setBaseType(initialIdol.baseType);
			setItemLevel(initialIdol.itemLevel);
			setName(initialIdol.name || "");

			const convertToSelectedMod = (
				mod: import("~/schemas/idol").IdolModifier,
			): SelectedMod | null => {
				const modOption = allModifiers.find((m) => m.id === mod.modId);
				if (!modOption) return null;
				return {
					modOption,
					tier: mod.tier ?? 1,
					rolledValue: mod.rolledValue,
				};
			};

			const loadedPrefixes: (SelectedMod | null)[] = [null, null];
			initialIdol.prefixes.forEach((mod, i) => {
				if (i < 2) loadedPrefixes[i] = convertToSelectedMod(mod);
			});
			setPrefixes(loadedPrefixes);

			const loadedSuffixes: (SelectedMod | null)[] = [null, null];
			initialIdol.suffixes.forEach((mod, i) => {
				if (i < 2) loadedSuffixes[i] = convertToSelectedMod(mod);
			});
			setSuffixes(loadedSuffixes);
		} else {
			setBaseType("minor");
			setItemLevel(68);
			setName("");
			setPrefixes([null, null]);
			setSuffixes([null, null]);
		}
	}, [initialIdol, allModifiers]);

	useEffect(() => {
		const idolTypeName =
			baseType.charAt(0).toUpperCase() + baseType.slice(1);

		const isModValidForIdol = (mod: SelectedMod | null): boolean => {
			if (!mod) return true;
			return mod.modOption.applicableIdols.includes(idolTypeName);
		};

		setPrefixes((prev) =>
			prev.map((mod) => (isModValidForIdol(mod) ? mod : null)),
		);
		setSuffixes((prev) =>
			prev.map((mod) => (isModValidForIdol(mod) ? mod : null)),
		);
	}, [baseType]);

	const updateMod = useCallback(
		(type: "prefix" | "suffix", index: number, mod: SelectedMod | null) => {
			if (type === "prefix") {
				setPrefixes((prev) => {
					const next = [...prev];
					next[index] = mod;
					return next;
				});
			} else {
				setSuffixes((prev) => {
					const next = [...prev];
					next[index] = mod;
					return next;
				});
			}
		},
		[],
	);

	const updateTier = useCallback(
		(type: "prefix" | "suffix", index: number, tier: number) => {
			const update = (prev: (SelectedMod | null)[]) => {
				const next = [...prev];
				const mod = next[index];
				if (mod) {
					const tierData = mod.modOption.tiers.find(
						(t) => t.tier === tier,
					);
					next[index] = {
						...mod,
						tier,
						rolledValue:
							tierData?.values?.[0]?.min ?? mod.rolledValue,
					};
				}
				return next;
			};

			if (type === "prefix") {
				setPrefixes(update);
			} else {
				setSuffixes(update);
			}
		},
		[],
	);

	const updateValue = useCallback(
		(type: "prefix" | "suffix", index: number, value: number) => {
			const update = (prev: (SelectedMod | null)[]) => {
				const next = [...prev];
				const mod = next[index];
				if (mod) {
					next[index] = { ...mod, rolledValue: value };
				}
				return next;
			};

			if (type === "prefix") {
				setPrefixes(update);
			} else {
				setSuffixes(update);
			}
		},
		[],
	);

	const convertToIdolModifier = (mod: SelectedMod): IdolModifier => {
		const tierData = mod.modOption.tiers.find((t) => t.tier === mod.tier);
		return {
			modId: mod.modOption.id,
			type: mod.modOption.type,
			text: tierData?.text || mod.modOption.name,
			rolledValue: mod.rolledValue,
			valueRange: tierData?.values?.[0],
			tier: mod.tier,
			mechanic: mod.modOption.mechanic,
		};
	};

	const handleSave = () => {
		const prefixMods = prefixes
			.filter((p): p is SelectedMod => p !== null)
			.map(convertToIdolModifier);
		const suffixMods = suffixes
			.filter((s): s is SelectedMod => s !== null)
			.map(convertToIdolModifier);

		const hasAnyMods = prefixMods.length > 0 || suffixMods.length > 0;
		const rarity = hasAnyMods
			? prefixMods.length + suffixMods.length > 2
				? "rare"
				: "magic"
			: "normal";

		const idol: IdolInstance = {
			id: initialIdol?.id || nanoid(),
			baseType,
			itemLevel,
			rarity,
			name: name || undefined,
			prefixes: prefixMods,
			suffixes: suffixMods,
			corrupted: false,
		};

		onSave(idol);
		onOpenChange(false);
	};

	const hasAnyMods =
		prefixes.some((p) => p !== null) || suffixes.some((s) => s !== null);

	const allSelectedModIds = useMemo(() => {
		return [
			...prefixes.filter((p) => p !== null).map((p) => p.modOption.id),
			...suffixes.filter((s) => s !== null).map((s) => s.modOption.id),
		];
	}, [prefixes, suffixes]);

	const getExcludedModIds = useCallback(
		(currentModId: string | null) => {
			return allSelectedModIds.filter((id) => id !== currentModId);
		},
		[allSelectedModIds],
	);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="flex max-h-[85vh] max-w-[1000px] flex-col overflow-hidden">
				<DialogHeader>
					<DialogTitle>
						{initialIdol ? t.editor.editIdol : t.editor.createIdol}
					</DialogTitle>
					<DialogDescription>
						{t.editor.description}
					</DialogDescription>
				</DialogHeader>

				<ScrollArea className="min-h-0 flex-1 pr-4">
					<div className="space-y-6">
						<div className="space-y-2">
							<span className="font-medium text-sm">
								{t.editor.baseType}
							</span>
							<Select
								value={baseType}
								onValueChange={(v) =>
									setBaseType(v as IdolBaseKey)
								}
							>
								<SelectTrigger aria-label={t.editor.baseType}>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{IDOL_BASE_KEYS.map((key) => (
										<SelectItem key={key} value={key}>
											<div className="flex items-center gap-2">
												<img
													src={IDOL_BASES[key].image}
													alt=""
													className="h-5 w-5 object-contain"
												/>
												<span>
													{IDOL_BASES[key].name}
												</span>
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<label
								htmlFor="idol-editor-name"
								className="font-medium text-sm"
							>
								{t.editor.name} ({t.editor.optional})
							</label>
							<Input
								id="idol-editor-name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder={t.editor.namePlaceholder}
							/>
						</div>

						<div className="space-y-2">
							<span className="font-medium text-sm">
								{t.editor.filterByMechanic}
							</span>
							<MechanicFilter
								value={mechanicFilter}
								onChange={setMechanicFilter}
							/>
						</div>

						<div className="space-y-4">
							<h4 className="font-medium text-sm">
								{t.editor.prefixes}
							</h4>
							{prefixes.map((mod, i) => (
								<ModSlot
									key={`prefix-${i}`}
									type="prefix"
									index={i}
									mod={mod}
									mechanicFilter={mechanicFilter}
									idolType={baseType}
									excludedModIds={getExcludedModIds(
										mod?.modOption.id ?? null,
									)}
									onModChange={(m) =>
										updateMod("prefix", i, m)
									}
									onTierChange={(tier) =>
										updateTier("prefix", i, tier)
									}
									onValueChange={(value) =>
										updateValue("prefix", i, value)
									}
								/>
							))}
						</div>

						<div className="space-y-4">
							<h4 className="font-medium text-sm">
								{t.editor.suffixes}
							</h4>
							{suffixes.map((mod, i) => (
								<ModSlot
									key={`suffix-${i}`}
									type="suffix"
									index={i}
									mod={mod}
									mechanicFilter={mechanicFilter}
									idolType={baseType}
									excludedModIds={getExcludedModIds(
										mod?.modOption.id ?? null,
									)}
									onModChange={(m) =>
										updateMod("suffix", i, m)
									}
									onTierChange={(tier) =>
										updateTier("suffix", i, tier)
									}
									onValueChange={(value) =>
										updateValue("suffix", i, value)
									}
								/>
							))}
						</div>
					</div>
				</ScrollArea>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
					>
						{t.actions.cancel}
					</Button>
					<Button onClick={handleSave} disabled={!hasAnyMods}>
						{t.actions.save}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
