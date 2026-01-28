import type { IdolModifier } from "~/schemas/idol";
import type { IdolSet } from "~/schemas/idol-set";
import type { InventoryIdol } from "~/schemas/inventory";
import {
	createEmptyStorage,
	STORAGE_VERSION,
	type StorageData,
	StorageSchema,
} from "~/schemas/storage";

const STORAGE_KEY = "poe-idol-planner-data";

function migrateModifier(mod: IdolModifier & { text?: string }): IdolModifier {
	const isMatchedMod =
		mod.modId.startsWith("prefix_") ||
		mod.modId.startsWith("suffix_") ||
		mod.modId.startsWith("unique_");

	return {
		...mod,
		text: isMatchedMod ? undefined : mod.text,
	};
}

function migrateInventoryIdol(invIdol: InventoryIdol): InventoryIdol {
	return {
		...invIdol,
		idol: {
			...invIdol.idol,
			prefixes: invIdol.idol.prefixes.map(migrateModifier),
			suffixes: invIdol.idol.suffixes.map(migrateModifier),
		},
	};
}

function migrateSet(set: IdolSet): IdolSet {
	return {
		...set,
		inventory: set.inventory.map(migrateInventoryIdol),
	};
}

function migrateStorage(parsed: unknown): StorageData | null {
	if (!parsed || typeof parsed !== "object") {
		return null;
	}

	const data = parsed as {
		version?: number;
		sets?: unknown[];
		activeSetId?: string | null;
	};

	if (data.version === STORAGE_VERSION) {
		return null;
	}

	if (data.version === 4) {
		console.log("Migrating storage from v4 to v5");
		const migrated: StorageData = {
			version: STORAGE_VERSION,
			sets: (data.sets as IdolSet[])?.map(migrateSet) ?? [],
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

export function saveStorage(data: StorageData): void {
	if (typeof window === "undefined") {
		return;
	}

	try {
		const result = StorageSchema.safeParse(data);
		if (!result.success) {
			console.error(
				"Storage validation failed, not saving:",
				result.error,
			);
			return;
		}

		localStorage.setItem(STORAGE_KEY, JSON.stringify(result.data));
	} catch (error) {
		console.error("Failed to save storage:", error);
	}
}

export function clearStorage(): void {
	if (typeof window === "undefined") {
		return;
	}
	localStorage.removeItem(STORAGE_KEY);
}
