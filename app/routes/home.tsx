import { useState } from "react";
import { AppHeader } from "~/components/app-header";
import { IdolEditor } from "~/components/idol-editor";
import { IdolGrid } from "~/components/idol-grid";
import { ImportModal } from "~/components/import-modal";
import { InventoryPanel } from "~/components/inventory-panel";
import { MapDeviceComponent } from "~/components/map-device";
import { SetTabs } from "~/components/set-tabs";
import { ShareModal } from "~/components/share-modal";
import { StatsSummary } from "~/components/stats-summary";
import { ClipboardProvider, useClipboard } from "~/context/clipboard-context";
import { DndProvider } from "~/context/dnd-context";
import { FavoritesProvider } from "~/context/favorites-context";
import { usePlannerState } from "~/hooks/use-planner-state";
import { useTranslations } from "~/i18n";
import type { IdolInstance } from "~/schemas/idol";
import type { InventoryIdol } from "~/schemas/inventory";
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

function HomeContent() {
	const t = useTranslations();
	const { isHydrated, sets } = usePlannerState();
	const { clipboardIdol, copyToClipboard, clearClipboard } = useClipboard();
	const [importModalOpen, setImportModalOpen] = useState(false);
	const [shareModalOpen, setShareModalOpen] = useState(false);
	const [editorOpen, setEditorOpen] = useState(false);
	const [editingIdol, setEditingIdol] = useState<InventoryIdol | null>(null);

	const handleSaveIdol = (idol: IdolInstance) => {
		if (editingIdol) {
			sets.updateIdol(editingIdol.id, idol);
		} else {
			sets.addIdols([idol], "manual");
		}
	};

	const handleIdolClick = (item: InventoryIdol) => {
		setEditingIdol(item);
		setEditorOpen(true);
	};

	const handleEditorOpenChange = (open: boolean) => {
		setEditorOpen(open);
		if (!open) {
			setEditingIdol(null);
		}
	};

	const handleCopyIdol = (idol: IdolInstance) => {
		copyToClipboard(idol);
	};

	const handlePasteIdol = () => {
		if (clipboardIdol) {
			sets.addIdols([clipboardIdol], "manual");
			clearClipboard();
		}
	};

	if (!isHydrated) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="text-muted-foreground">Loading...</div>
			</div>
		);
	}

	const activeSet = sets.activeSet;
	const inventory = activeSet?.inventory ?? [];

	return (
		<div className="flex min-h-screen flex-col">
			<AppHeader onShareClick={() => setShareModalOpen(true)} />

			<main className="container mx-auto flex-1 p-4">
				<SetTabs
					sets={sets.sets}
					activeSetId={sets.activeSetId}
					onSelectSet={sets.selectSet}
					onCreateSet={() => sets.createSet(t.idolSet.defaultName)}
					onRenameSet={sets.renameSet}
					onDuplicateSet={sets.duplicateSet}
					onDeleteSet={sets.deleteSet}
				/>

				<div className="mt-4 grid gap-4 lg:grid-cols-[400px_1fr_300px]">
					<aside className="h-[calc(100vh-180px)]">
						<InventoryPanel
							inventory={inventory}
							onImportClick={() => setImportModalOpen(true)}
							onCreateClick={() => setEditorOpen(true)}
							onIdolClick={handleIdolClick}
							onDuplicateIdol={sets.duplicateIdol}
							onRemoveIdol={sets.removeIdol}
							onRemoveIdols={sets.removeIdols}
							onClearAll={sets.clearInventory}
							onPasteIdol={handlePasteIdol}
							hasClipboardIdol={!!clipboardIdol}
						/>
					</aside>

					<section className="flex items-start justify-center">
						{activeSet && (
							<IdolGrid
								placements={activeSet.placements}
								inventory={inventory}
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
								onMoveIdol={(placementId, x, y, tab) =>
									sets.moveIdol(placementId, { x, y }, tab)
								}
								onRemoveIdol={sets.removeIdolFromSet}
								onCopyIdol={handleCopyIdol}
							/>
						)}
					</section>

					<aside className="flex h-[calc(100vh-180px)] flex-col gap-4">
						{activeSet && (
							<MapDeviceComponent
								mapDevice={activeSet.mapDevice}
								onSlotChange={sets.updateMapDeviceSlot}
							/>
						)}
						<div className="min-h-0 flex-1 overflow-hidden">
							<StatsSummary
								placements={activeSet?.placements ?? []}
								inventory={inventory}
								mapDevice={activeSet?.mapDevice}
							/>
						</div>
					</aside>
				</div>
			</main>

			<ImportModal
				open={importModalOpen}
				onOpenChange={setImportModalOpen}
				onImport={(idols) => sets.addIdols(idols, "clipboard")}
			/>

			<ShareModal
				open={shareModalOpen}
				onOpenChange={setShareModalOpen}
				set={activeSet}
				inventory={inventory}
			/>

			<IdolEditor
				open={editorOpen}
				onOpenChange={handleEditorOpenChange}
				onSave={handleSaveIdol}
				initialIdol={editingIdol?.idol ?? null}
			/>
		</div>
	);
}

export default function Home(_props: Route.ComponentProps) {
	return (
		<FavoritesProvider>
			<ClipboardProvider>
				<DndProvider>
					<HomeContent />
				</DndProvider>
			</ClipboardProvider>
		</FavoritesProvider>
	);
}
