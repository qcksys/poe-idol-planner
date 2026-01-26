import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { ScrollArea } from "~/components/ui/scroll-area";
import { IDOL_BASES, LEAGUE_MECHANICS } from "~/data/idol-bases";
import { getMapCraftingOptionById } from "~/data/map-crafting-options";
import { getScarabById } from "~/data/scarab-data";
import { useScarabPrices } from "~/hooks/use-scarab-prices";
import { useTranslations } from "~/i18n";
import { highlightNumbers } from "~/lib/highlight-numbers";
import type { IdolBaseKey, LeagueMechanic } from "~/schemas/idol";
import type { IdolPlacement } from "~/schemas/idol-set";
import type { InventoryIdol } from "~/schemas/inventory";
import type { MapCraftingOption, MapDevice, Scarab } from "~/schemas/scarab";

interface StatsSummaryProps {
	placements: IdolPlacement[];
	inventory: InventoryIdol[];
	mapDevice?: MapDevice;
}

type IdolSizeCategory = "minor" | "small" | "medium" | "large";

interface IdolContribution {
	baseType: IdolBaseKey;
	sizeCategory: IdolSizeCategory;
}

interface AggregatedStat {
	template: string;
	totalValue: number;
	mechanic: LeagueMechanic;
	hasPercent: boolean;
	contributions: IdolContribution[];
}

function getIdolSizeCategory(baseType: IdolBaseKey): IdolSizeCategory {
	const base = IDOL_BASES[baseType];
	const cells = base.width * base.height;
	if (cells === 1) return "minor";
	if (cells === 2) return "small";
	if (cells === 3) return "medium";
	return "large";
}

function formatContributions(contributions: IdolContribution[]): string {
	const counts: Record<IdolSizeCategory, number> = {
		minor: 0,
		small: 0,
		medium: 0,
		large: 0,
	};

	for (const c of contributions) {
		counts[c.sizeCategory]++;
	}

	const parts: string[] = [];
	if (counts.minor > 0) parts.push(`${counts.minor}x minor`);
	if (counts.small > 0) parts.push(`${counts.small}x small`);
	if (counts.medium > 0) parts.push(`${counts.medium}x medium`);
	if (counts.large > 0) parts.push(`${counts.large}x large`);

	return parts.join(", ");
}

interface StatsByMechanic {
	mechanic: LeagueMechanic;
	stats: AggregatedStat[];
}

// Create a template by replacing the rolled value with a placeholder
function createTemplate(
	text: string,
	rolledValue: number,
): {
	template: string;
	hasPercent: boolean;
} {
	// First, try to match range format like (10—8)% or (15—25)% (using em-dash or regular dash)
	// The range format is (min—max) where rolled value falls within
	const rangePattern = /\((\d+(?:\.\d+)?)[—\-–](\d+(?:\.\d+)?)\)(%?)/g;
	let rangeMatch: RegExpExecArray | null;
	let bestRangeMatch: {
		match: string;
		index: number;
		hasPercent: boolean;
	} | null = null;

	// biome-ignore lint/suspicious/noAssignInExpressions: standard regex exec pattern
	while ((rangeMatch = rangePattern.exec(text)) !== null) {
		const num1 = Number.parseFloat(rangeMatch[1]);
		const num2 = Number.parseFloat(rangeMatch[2]);
		const min = Math.min(num1, num2);
		const max = Math.max(num1, num2);
		// Check if rolled value is within or close to this range
		if (rolledValue >= min - 1 && rolledValue <= max + 1) {
			bestRangeMatch = {
				match: rangeMatch[0],
				index: rangeMatch.index,
				hasPercent: rangeMatch[3] === "%",
			};
			break;
		}
	}

	if (bestRangeMatch) {
		const template =
			text.substring(0, bestRangeMatch.index) +
			"{value}" +
			(bestRangeMatch.hasPercent ? "" : "") +
			text.substring(bestRangeMatch.index + bestRangeMatch.match.length);
		return { template, hasPercent: bestRangeMatch.hasPercent };
	}

	// Try to match the specific rolled value (with optional % suffix)
	const valueStr = Number.isInteger(rolledValue)
		? String(rolledValue)
		: rolledValue.toFixed(1);

	// Try to match the exact value with optional %
	const exactPattern = new RegExp(`(${valueStr.replace(".", "\\.")}%?)`);
	const exactMatch = text.match(exactPattern);

	if (exactMatch) {
		const hasPercent = exactMatch[1].includes("%");
		const template = text.replace(exactPattern, "{value}");
		return { template, hasPercent };
	}

	// Fallback: find the first number that could be the value
	// Look for numbers that are close to the rolled value (within the value range)
	const numberPattern = /(\d+(?:\.\d+)?%?)/g;
	let match: RegExpExecArray | null;
	let bestMatch: { match: string; index: number } | null = null;

	// biome-ignore lint/suspicious/noAssignInExpressions: standard regex exec pattern
	while ((match = numberPattern.exec(text)) !== null) {
		const numStr = match[1].replace("%", "");
		const num = Number.parseFloat(numStr);
		// If this number is close to the rolled value, it's likely the right one
		if (Math.abs(num - rolledValue) <= Math.max(rolledValue * 0.5, 5)) {
			bestMatch = { match: match[1], index: match.index };
			break;
		}
	}

	if (bestMatch) {
		const hasPercent = bestMatch.match.includes("%");
		const template =
			text.substring(0, bestMatch.index) +
			"{value}" +
			text.substring(bestMatch.index + bestMatch.match.length);
		return { template, hasPercent };
	}

	// Last resort: just use the first number
	const firstMatch = text.match(/(\d+(?:\.\d+)?%?)/);
	const hasPercent = firstMatch ? firstMatch[1].includes("%") : false;
	const template = text.replace(/(\d+(?:\.\d+)?%?)/, "{value}");
	return { template, hasPercent };
}

// Replace the placeholder with the actual summed value
function formatStatText(
	template: string,
	value: number,
	hasPercent: boolean,
): string {
	const formattedValue = Number.isInteger(value)
		? value.toString()
		: value.toFixed(1);
	const displayValue = hasPercent ? `${formattedValue}%` : formattedValue;
	return template.replace("{value}", displayValue);
}

function aggregateStats(
	placements: IdolPlacement[],
	inventory: InventoryIdol[],
): StatsByMechanic[] {
	const statMap = new Map<string, AggregatedStat>();

	for (const placement of placements) {
		const inventoryIdol = inventory.find(
			(i) => i.id === placement.inventoryIdolId,
		);
		if (!inventoryIdol) continue;

		const idol = inventoryIdol.idol;
		const allMods = [...idol.prefixes, ...idol.suffixes];
		const contribution: IdolContribution = {
			baseType: idol.baseType,
			sizeCategory: getIdolSizeCategory(idol.baseType),
		};

		for (const mod of allMods) {
			const { template, hasPercent } = createTemplate(
				mod.text,
				mod.rolledValue,
			);
			const key = `${mod.mechanic}:${template}`;
			const existing = statMap.get(key);
			if (existing) {
				existing.totalValue += mod.rolledValue;
				existing.contributions.push(contribution);
			} else {
				statMap.set(key, {
					template,
					totalValue: mod.rolledValue,
					mechanic: mod.mechanic,
					hasPercent,
					contributions: [contribution],
				});
			}
		}
	}

	const statsByMechanic: StatsByMechanic[] = [];
	for (const mechanic of LEAGUE_MECHANICS) {
		const stats = Array.from(statMap.values()).filter(
			(s) => s.mechanic === mechanic,
		);
		if (stats.length > 0) {
			statsByMechanic.push({ mechanic, stats });
		}
	}

	return statsByMechanic;
}

function MechanicSection({ data }: { data: StatsByMechanic }) {
	const t = useTranslations();
	const mechanicName = t.mechanics[data.mechanic] || data.mechanic;

	return (
		<div className="mb-4">
			<h4 className="mb-2 font-semibold text-primary text-sm">
				{mechanicName}
			</h4>
			<div className="space-y-1">
				{data.stats.map((stat, index) => {
					const displayText = formatStatText(
						stat.template,
						stat.totalValue,
						stat.hasPercent,
					);
					const contributionText = formatContributions(
						stat.contributions,
					);
					return (
						<div
							key={`${stat.template}-${index}`}
							className="text-secondary-foreground text-sm"
						>
							<div>{highlightNumbers(displayText)}</div>
							{contributionText && (
								<div className="text-muted-foreground text-xs">
									({contributionText})
								</div>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}

function CraftingOptionSection({
	craftingOption,
}: {
	craftingOption: MapCraftingOption | null;
}) {
	const t = useTranslations();

	if (!craftingOption) return null;

	return (
		<div className="mb-4 border-border border-t pt-4">
			<h4 className="mb-2 font-semibold text-primary text-sm">
				{t.mapDevice?.craftingOptionEffect || "Map Device"}
			</h4>
			<div className="mb-1 text-muted-foreground text-xs">
				{craftingOption.name}
				{craftingOption.cost > 0 && ` (${craftingOption.cost}c)`}
				{craftingOption.imbued && " - Imbued"}
			</div>
			<div className="text-secondary-foreground text-sm">
				{highlightNumbers(craftingOption.effect)}
			</div>
		</div>
	);
}

function ScarabsSection({ scarabs }: { scarabs: Scarab[] }) {
	const t = useTranslations();

	if (scarabs.length === 0) return null;

	// Group scarabs by category
	const scarabsByCategory = scarabs.reduce(
		(acc, scarab) => {
			const category = scarab.category;
			if (!acc[category]) {
				acc[category] = [];
			}
			acc[category].push(scarab);
			return acc;
		},
		{} as Record<string, Scarab[]>,
	);

	return (
		<div className="mb-4 border-border border-t pt-4">
			<h4 className="mb-2 font-semibold text-primary text-sm">
				{t.mapDevice?.scarabEffects || "Scarab Effects"}
			</h4>
			{Object.entries(scarabsByCategory).map(([category, catScarabs]) => (
				<div key={category} className="mb-2">
					<div className="mb-1 text-muted-foreground text-xs capitalize">
						{category}
					</div>
					<div className="space-y-1">
						{catScarabs.map((scarab) => (
							<div
								key={scarab.id}
								className="text-secondary-foreground text-sm"
							>
								{highlightNumbers(scarab.effect)}
							</div>
						))}
					</div>
				</div>
			))}
		</div>
	);
}

function formatChaosPrice(price: number): string {
	if (price >= 1000) {
		return `${(price / 1000).toFixed(1)}k`;
	}
	if (price >= 10) {
		return Math.round(price).toString();
	}
	if (price >= 1) {
		return price.toFixed(1);
	}
	return price.toFixed(2);
}

export function StatsSummary({
	placements,
	inventory,
	mapDevice,
}: StatsSummaryProps) {
	const t = useTranslations();
	const { getPrice } = useScarabPrices();

	const statsByMechanic = useMemo(
		() => aggregateStats(placements, inventory),
		[placements, inventory],
	);

	const selectedScarabs = useMemo(() => {
		if (!mapDevice) return [];
		return mapDevice.slots
			.map((slot) =>
				slot.scarabId ? getScarabById(slot.scarabId) : null,
			)
			.filter((s): s is Scarab => s !== null);
	}, [mapDevice]);

	const selectedCraftingOption = useMemo(() => {
		if (!mapDevice?.craftingOptionId) return null;
		return getMapCraftingOptionById(mapDevice.craftingOptionId) ?? null;
	}, [mapDevice?.craftingOptionId]);

	const totalStats = useMemo(
		() => statsByMechanic.reduce((sum, m) => sum + m.stats.length, 0),
		[statsByMechanic],
	);

	const totalCost = useMemo(() => {
		let cost = 0;

		// Add scarab costs
		for (const scarab of selectedScarabs) {
			const price = getPrice(scarab.id);
			if (price !== null) {
				cost += price;
			}
		}

		// Add crafting option cost
		if (selectedCraftingOption?.cost) {
			cost += selectedCraftingOption.cost;
		}

		return cost;
	}, [selectedScarabs, selectedCraftingOption, getPrice]);

	const hasContent =
		statsByMechanic.length > 0 ||
		selectedScarabs.length > 0 ||
		selectedCraftingOption !== null;

	return (
		<Card className="flex h-full flex-col">
			<CardHeader className="pb-2">
				<div className="flex flex-col gap-1">
					<div className="flex items-center justify-between">
						<CardTitle className="text-lg">
							{t.stats.totalStats}
						</CardTitle>
						<span className="text-muted-foreground text-sm">
							{totalStats} modifier(s)
							{selectedScarabs.length > 0 &&
								` + ${selectedScarabs.length} scarab(s)`}
						</span>
					</div>
					{totalCost > 0 && (
						<div className="text-right text-sm text-yellow-600 dark:text-yellow-400">
							Total Cost: {formatChaosPrice(totalCost)}c
						</div>
					)}
				</div>
			</CardHeader>

			<CardContent className="min-h-0 flex-1 overflow-hidden">
				{!hasContent ? (
					<div className="py-8 text-center text-muted-foreground">
						{t.stats.noStats}
					</div>
				) : (
					<ScrollArea className="h-full">
						<div className="space-y-2 pr-2">
							{statsByMechanic.map((data) => (
								<MechanicSection
									key={data.mechanic}
									data={data}
								/>
							))}
							<CraftingOptionSection
								craftingOption={selectedCraftingOption}
							/>
							<ScarabsSection scarabs={selectedScarabs} />
						</div>
					</ScrollArea>
				)}
			</CardContent>
		</Card>
	);
}
