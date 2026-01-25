import { useState } from "react";
import { AppHeader } from "~/components/app-header";
import { IdolGrid } from "~/components/idol-grid";
import { ImportModal } from "~/components/import-modal";
import { InventoryPanel } from "~/components/inventory-panel";
import { SetTabs } from "~/components/set-tabs";
import { ShareModal } from "~/components/share-modal";
import { StatsSummary } from "~/components/stats-summary";
import { DndProvider } from "~/context/dnd-context";
import { usePlannerState } from "~/hooks/use-planner-state";
import { useTranslations } from "~/i18n";
import type { Route } from "./+types/home";

export function meta() {
	return [
		{ title: "POE Idol Planner - Legacy of Phrecia" },
		{
			name: "description",
			content:
				"Plan your idol configurations for Path of Exile Legacy of Phrecia event",
		},
	];
}

export function loader(_args: Route.LoaderArgs) {
	return {};
}

export default function Home(_props: Route.ComponentProps) {
	const t = useTranslations();
	const { isHydrated, inventory, sets, removeIdolFromInventory } =
		usePlannerState();
	const [importModalOpen, setImportModalOpen] = useState(false);
	const [shareModalOpen, setShareModalOpen] = useState(false);

	if (!isHydrated) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="text-muted-foreground">Loading...</div>
			</div>
		);
	}

	const activeSet = sets.activeSet;

	return (
		<DndProvider>
			<div className="flex min-h-screen flex-col">
				<AppHeader onShareClick={() => setShareModalOpen(true)} />

				<main className="container mx-auto flex-1 p-4">
					<SetTabs
						sets={sets.sets}
						activeSetId={sets.activeSetId}
						onSelectSet={sets.selectSet}
						onCreateSet={() =>
							sets.createSet(t.idolSet.defaultName)
						}
						onRenameSet={sets.renameSet}
						onDuplicateSet={sets.duplicateSet}
						onDeleteSet={sets.deleteSet}
					/>

					<div className="mt-4 grid gap-4 lg:grid-cols-[300px_1fr_300px]">
						<aside className="h-[calc(100vh-180px)]">
							<InventoryPanel
								inventory={inventory.inventory}
								onImportClick={() => setImportModalOpen(true)}
								onRemoveIdol={removeIdolFromInventory}
								onClearAll={inventory.clearInventory}
							/>
						</aside>

						<section className="flex items-start justify-center">
							{activeSet && (
								<IdolGrid
									placements={activeSet.placements}
									inventory={inventory.inventory}
									activeTab={activeSet.activeTab}
									onTabChange={(tab) =>
										sets.setActiveTab(activeSet.id, tab)
									}
									onPlaceIdol={(inventoryIdolId, x, y, tab) =>
										sets.placeIdol(
											inventoryIdolId,
											{ x, y },
											tab,
										)
									}
									onRemoveIdol={sets.removeIdolFromSet}
								/>
							)}
						</section>

						<aside className="h-[calc(100vh-180px)]">
							<StatsSummary
								placements={activeSet?.placements ?? []}
								inventory={inventory.inventory}
							/>
						</aside>
					</div>
				</main>

				<ImportModal
					open={importModalOpen}
					onOpenChange={setImportModalOpen}
					onImport={(idols) => inventory.addIdols(idols, "clipboard")}
				/>

				<ShareModal
					open={shareModalOpen}
					onOpenChange={setShareModalOpen}
					set={activeSet}
					inventory={inventory.inventory}
				/>
			</div>
		</DndProvider>
	);
}
