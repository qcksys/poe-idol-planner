import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { ScrollArea } from "~/components/ui/scroll-area";
import { LEAGUE_MECHANICS } from "~/data/idol-bases";
import { useTranslations } from "~/i18n";
import { highlightNumbers } from "~/lib/highlight-numbers";
import type { LeagueMechanic } from "~/schemas/idol";
import type { IdolPlacement } from "~/schemas/idol-set";
import type { InventoryIdol } from "~/schemas/inventory";

interface StatsSummaryProps {
	placements: IdolPlacement[];
	inventory: InventoryIdol[];
}

interface AggregatedStat {
	template: string;
	totalValue: number;
	mechanic: LeagueMechanic;
	hasPercent: boolean;
}

interface StatsByMechanic {
	mechanic: LeagueMechanic;
	stats: AggregatedStat[];
}

// Number pattern: matches integers, decimals, and percentages (e.g., 65, 65.5, 65%)
const NUMBER_PATTERN = /(\d+(?:\.\d+)?%?)/;

// Create a template by replacing the first number with a placeholder
function createTemplate(text: string): {
	template: string;
	hasPercent: boolean;
} {
	const match = text.match(NUMBER_PATTERN);
	const hasPercent = match ? match[1].includes("%") : false;
	const template = text.replace(NUMBER_PATTERN, "{value}");
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

		for (const mod of allMods) {
			const { template, hasPercent } = createTemplate(mod.text);
			const key = `${mod.mechanic}:${template}`;
			const existing = statMap.get(key);
			if (existing) {
				existing.totalValue += mod.rolledValue;
			} else {
				statMap.set(key, {
					template,
					totalValue: mod.rolledValue,
					mechanic: mod.mechanic,
					hasPercent,
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
			<h4 className="mb-2 font-semibold text-blue-400 text-sm">
				{mechanicName}
			</h4>
			<div className="space-y-1">
				{data.stats.map((stat, index) => {
					const displayText = formatStatText(
						stat.template,
						stat.totalValue,
						stat.hasPercent,
					);
					return (
						<div
							key={`${stat.template}-${index}`}
							className="text-gray-300 text-sm"
						>
							{highlightNumbers(displayText)}
						</div>
					);
				})}
			</div>
		</div>
	);
}

export function StatsSummary({ placements, inventory }: StatsSummaryProps) {
	const t = useTranslations();

	const statsByMechanic = useMemo(
		() => aggregateStats(placements, inventory),
		[placements, inventory],
	);

	const totalStats = useMemo(
		() => statsByMechanic.reduce((sum, m) => sum + m.stats.length, 0),
		[statsByMechanic],
	);

	return (
		<Card className="flex h-full flex-col">
			<CardHeader className="pb-2">
				<div className="flex items-center justify-between">
					<CardTitle className="text-lg">
						{t.stats.totalStats}
					</CardTitle>
					<span className="text-gray-400 text-sm">
						{totalStats} modifier(s)
					</span>
				</div>
			</CardHeader>

			<CardContent className="flex-1 overflow-hidden">
				{statsByMechanic.length === 0 ? (
					<div className="py-8 text-center text-gray-400">
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
						</div>
					</ScrollArea>
				)}
			</CardContent>
		</Card>
	);
}
