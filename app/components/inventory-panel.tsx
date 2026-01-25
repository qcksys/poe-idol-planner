import { Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { ScrollArea } from "~/components/ui/scroll-area";
import { useTranslations } from "~/i18n";
import type { InventoryIdol } from "~/schemas/inventory";
import { IdolCard } from "./idol-card";

interface InventoryPanelProps {
	inventory: InventoryIdol[];
	onImportClick: () => void;
	onIdolClick?: (idol: InventoryIdol) => void;
	onRemoveIdol?: (id: string) => void;
	onClearAll?: () => void;
}

export function InventoryPanel({
	inventory,
	onImportClick,
	onIdolClick,
	onRemoveIdol,
	onClearAll,
}: InventoryPanelProps) {
	const t = useTranslations();
	const [searchQuery, setSearchQuery] = useState("");

	const filteredInventory = inventory.filter((item) => {
		if (!searchQuery) return true;
		const query = searchQuery.toLowerCase();
		const idol = item.idol;
		const allMods = [...idol.prefixes, ...idol.suffixes];
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

				<div className="flex gap-2">
					<Button
						onClick={onImportClick}
						className="flex-1"
						size="sm"
					>
						<Plus className="mr-1 h-4 w-4" />
						{t.inventory.import}
					</Button>
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
								: "No matching idols found"}
						</div>
					) : (
						<div className="space-y-2 pr-2">
							{filteredInventory.map((item) => (
								<div key={item.id} className="group relative">
									<IdolCard
										idol={item.idol}
										compact
										onClick={() => onIdolClick?.(item)}
									/>
									{onRemoveIdol && (
										<Button
											variant="destructive"
											size="icon"
											className="absolute top-1 right-1 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
											onClick={(e) => {
												e.stopPropagation();
												onRemoveIdol(item.id);
											}}
										>
											<Trash2 className="h-3 w-3" />
										</Button>
									)}
									{item.usageCount > 0 && (
										<span className="absolute right-1 bottom-1 rounded bg-blue-600 px-1 text-xs">
											{t.inventory.usedInSets.replace(
												"{count}",
												String(item.usageCount),
											)}
										</span>
									)}
								</div>
							))}
						</div>
					)}
				</ScrollArea>
			</CardContent>
		</Card>
	);
}
