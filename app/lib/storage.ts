import type { IdolModifier } from "~/schemas/idol";
import type { IdolPlacement, IdolSet } from "~/schemas/idol-set";
import type { InventoryIdol } from "~/schemas/inventory";
import {
	createEmptyStorage,
	STORAGE_VERSION,
	type StorageData,
	StorageSchema,
} from "~/schemas/storage";

const STORAGE_KEY = "poe-idol-planner-data";

interface LegacyModifier extends IdolModifier {
	valueRange?: { min: number; max: number };
	mechanic?: string;
}

interface LegacyPlacement extends IdolPlacement {
	tab?: string;
}

interface LegacySet extends Omit<IdolSet, "placements" | "inventory"> {
	activeTab?: string;
	placements: LegacyPlacement[];
	inventory: Array<{
		id: string;
		idol: {
			id: string;
			baseType: string;
			itemLevel: number;
			rarity: string;
			name?: string;
			implicit?: { text: string; value: number };
			prefixes: LegacyModifier[];
			suffixes: LegacyModifier[];
			corrupted: boolean;
		};
		importedAt: number;
		source: string;
		usageCount: number;
	}>;
}

function migrateModifier(mod: LegacyModifier): IdolModifier {
	const isMatchedMod =
		mod.modId.startsWith("prefix_") ||
		mod.modId.startsWith("suffix_") ||
		mod.modId.startsWith("unique_");

	return {
		modId: mod.modId,
		type: mod.type,
		text: isMatchedMod ? undefined : mod.text,
		rolledValue: mod.rolledValue,
		tier: mod.tier,
	};
}

function migratePlacement(placement: LegacyPlacement): IdolPlacement {
	return {
		id: placement.id,
		inventoryIdolId: placement.inventoryIdolId,
		position: placement.position,
	};
}

function migrateInventoryIdol(
	invIdol: LegacySet["inventory"][number],
): InventoryIdol {
	return {
		id: invIdol.id,
		idol: {
			id: invIdol.idol.id,
			baseType: invIdol.idol.baseType,
			itemLevel: invIdol.idol.itemLevel,
			rarity: invIdol.idol.rarity,
			name: invIdol.idol.name,
			implicit: invIdol.idol.implicit,
			prefixes: invIdol.idol.prefixes.map(migrateModifier),
			suffixes: invIdol.idol.suffixes.map(migrateModifier),
		},
		importedAt: invIdol.importedAt,
		source: invIdol.source,
		usageCount: invIdol.usageCount,
	} as InventoryIdol;
}

function migrateSet(set: LegacySet): IdolSet {
	return {
		id: set.id,
		name: set.name,
		createdAt: set.createdAt,
		updatedAt: set.updatedAt,
		placements: set.placements.map(migratePlacement),
		inventory: set.inventory.map(migrateInventoryIdol),
		mapDevice: set.mapDevice,
		unlockedConditions: set.unlockedConditions,
	} as IdolSet;
}

function migrateStorage(parsed: unknown): StorageData | null {
	if (!parsed || typeof parsed !== "object") {
		return null;
	}

	const data = parsed as {
		version?: number;
		sets?: LegacySet[];
		activeSetId?: string | null;
	};

	if (data.version === STORAGE_VERSION) {
		return null;
	}

	if (data.version === 4) {
		console.log({ message: "Migrating storage from v4 to v5" });
		const migrated: StorageData = {
			version: STORAGE_VERSION,
			sets: data.sets?.map(migrateSet) ?? [],
			activeSetId: data.activeSetId ?? null,
		};
		return migrated;
	}

	return null;
}

export function loadStorage(): StorageData {
	if (typeof window === "undefined") {
		return createEmptyStorage();
	}

	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) {
			return createEmptyStorage();
		}

		const parsed = JSON.parse(raw);

		const migrated = migrateStorage(parsed);
		if (migrated) {
			const result = StorageSchema.safeParse(migrated);
			if (result.success) {
				saveStorage(result.data);
				return result.data;
			}
		}

		const result = StorageSchema.safeParse(parsed);

		if (!result.success) {
			console.warn("Storage validation failed, using empty storage");
			return createEmptyStorage();
		}

		return result.data;
	} catch (error) {
		console.error("Failed to load storage:", error);
		return createEmptyStorage();
	}
}

export type SaveStorageResult =
	| { success: true }
	| { success: false; error: string };

export function saveStorage(data: StorageData): SaveStorageResult {
	if (typeof window === "undefined") {
		return { success: true };
	}

	try {
		const result = StorageSchema.safeParse(data);
		if (!result.success) {
			const errorMessage = result.error.issues
				.map((issue) => `${issue.path.join(".")}: ${issue.message}`)
				.join(", ");
			console.error(
				"Storage validation failed, not saving:",
				result.error,
			);
			return { success: false, error: errorMessage };
		}

		localStorage.setItem(STORAGE_KEY, JSON.stringify(result.data));
		return { success: true };
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Unknown error";
		console.error("Failed to save storage:", error);
		return { success: false, error: message };
	}
}

export function clearStorage(): void {
	if (typeof window === "undefined") {
		return;
	}
	localStorage.removeItem(STORAGE_KEY);
}
