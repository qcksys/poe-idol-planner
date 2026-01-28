import { nanoid } from "nanoid";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { useTranslations } from "~/i18n";
import { loadStorage, saveStorage } from "~/lib/storage";
import type { InventoryIdol } from "~/schemas/inventory";
import { type SharedSet, SharedSetSchema } from "~/schemas/share";
import type { Route } from "./+types/share.$id";

export function meta(_args: Route.MetaArgs) {
	return [
		{ title: "Shared Set - POE Idol Planner" },
		{ name: "description", content: "View and import a shared idol set" },
	];
}

type LoadState =
	| { status: "loading" }
	| { status: "error"; message: string }
	| { status: "loaded"; data: SharedSet };

export default function SharePage() {
	const t = useTranslations();
	const navigate = useNavigate();
	const params = useParams<{ id: string }>();
	const [loadState, setLoadState] = useState<LoadState>({
		status: "loading",
	});
	const [importing, setImporting] = useState(false);

	useEffect(() => {
		if (!params.id) {
			setLoadState({ status: "error", message: "No share ID provided" });
			return;
		}

		async function fetchShare() {
			try {
				const response = await fetch(`/api/share/${params.id}`);
				if (!response.ok) {
					const errorData = (await response
						.json()
						.catch(() => ({}))) as {
						error?: string;
					};
					throw new Error(
						errorData.error || `HTTP ${response.status}`,
					);
				}

				const data = await response.json();
				const result = SharedSetSchema.safeParse(data);
				if (!result.success) {
					throw new Error("Invalid share data");
				}

				setLoadState({ status: "loaded", data: result.data });
			} catch (error) {
				setLoadState({
					status: "error",
					message:
						error instanceof Error
							? error.message
							: "Failed to load share",
				});
			}
		}

		fetchShare();
	}, [params.id]);

	const handleImport = () => {
		if (loadState.status !== "loaded") return;

		setImporting(true);
		try {
			const storage = loadStorage();
			const { set: sharedSet, idols: sharedIdols } = loadState.data;

			// Create new inventory items with new IDs
			const idolIdMap = new Map<string, string>();
			const newInventory: InventoryIdol[] = [];

			for (const idol of sharedIdols) {
				const newId = nanoid();
				idolIdMap.set(idol.id, newId);
				newInventory.push({
					...idol,
					id: newId,
					source: "shared",
					importedAt: Date.now(),
					usageCount: 0,
				});
			}

			const newSetId = nanoid();
			const importedSet = {
				...sharedSet,
				id: newSetId,
				name: `${sharedSet.name} (Shared)`,
				createdAt: Date.now(),
				updatedAt: Date.now(),
				inventory: newInventory,
				placements: sharedSet.placements.map((p) => ({
					...p,
					id: nanoid(),
					inventoryIdolId:
						idolIdMap.get(p.inventoryIdolId) || p.inventoryIdolId,
				})),
			};

			storage.sets.push(importedSet);
			storage.activeSetId = newSetId;

			saveStorage(storage);

			navigate("/", { replace: true });
		} catch (error) {
			console.log({
				message: "Import failed",
				error: error instanceof Error ? error.message : "Unknown error",
			});
			setImporting(false);
		}
	};

	if (loadState.status === "loading") {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background">
				<Card className="w-full max-w-md">
					<CardHeader>
						<CardTitle>{t.actions.loading}</CardTitle>
						<CardDescription>{t.share.fetching}</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="flex justify-center py-8">
							<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (loadState.status === "error") {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background">
				<Card className="w-full max-w-md">
					<CardHeader>
						<CardTitle className="text-destructive">
							{t.errors.title}
						</CardTitle>
						<CardDescription>{loadState.message}</CardDescription>
					</CardHeader>
					<CardContent>
						<Button
							onClick={() => navigate("/")}
							className="w-full"
						>
							{t.share.goToPlanner}
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	const { set, idols } = loadState.data;

	return (
		<div className="flex min-h-screen items-center justify-center bg-background p-4">
			<Card className="w-full max-w-lg">
				<CardHeader>
					<CardTitle>{t.share.sharedSetTitle}</CardTitle>
					<CardDescription>
						{t.share.sharedSetDescription}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="rounded-lg border border-border bg-muted/50 p-4">
						<h3 className="mb-2 font-semibold text-accent text-lg">
							{set.name}
						</h3>
						<div className="space-y-1 text-muted-foreground text-sm">
							<p>
								{idols.length} idol{idols.length !== 1 && "s"}
							</p>
							<p>
								{set.placements.length} placement
								{set.placements.length !== 1 && "s"}
							</p>
						</div>
					</div>

					<div className="space-y-2">
						<h4 className="font-medium text-foreground text-sm">
							{t.share.idolsInSet}
						</h4>
						<ul className="max-h-40 space-y-1 overflow-y-auto">
							{idols.map((idol) => (
								<li
									key={idol.id}
									className="text-muted-foreground text-sm"
								>
									• {idol.idol.name || idol.idol.baseType} (
									{idol.idol.prefixes.length}P/
									{idol.idol.suffixes.length}S)
								</li>
							))}
						</ul>
					</div>

					<div className="flex gap-3 pt-4">
						<Button
							variant="outline"
							onClick={() => navigate("/")}
							className="flex-1"
						>
							{t.actions.cancel}
						</Button>
						<Button
							onClick={handleImport}
							disabled={importing}
							className="flex-1"
						>
							{importing ? t.share.importing : t.share.importSet}
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
