import {
	createEmptyStorage,
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
