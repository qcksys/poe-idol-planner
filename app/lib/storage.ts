import {
	createEmptyStorage,
	parseAndMigrateStorage,
	STORAGE_VERSION,
	type StorageData,
	StorageSchema,
} from "~/schemas/storage";

const STORAGE_KEY = "poe-idol-planner-data";

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
		const migrated = parseAndMigrateStorage(parsed);

		if (!migrated) {
			console.warn("Storage migration failed, using empty storage");
			return createEmptyStorage();
		}

		// If migration happened, save the new format
		if (migrated.version === STORAGE_VERSION) {
			saveStorage(migrated);
		}

		return migrated;
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
