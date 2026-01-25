import { z } from "zod";
import { IdolSetSchema } from "./idol-set";
import { InventoryIdolSchema } from "./inventory";

export const STORAGE_VERSION = 1;

export const StorageSchema = z.object({
	version: z.literal(STORAGE_VERSION),
	inventory: z.array(InventoryIdolSchema),
	sets: z.array(IdolSetSchema),
	activeSetId: z.string().nullable(),
});

export type StorageData = z.infer<typeof StorageSchema>;

export function createEmptyStorage(): StorageData {
	return {
		version: STORAGE_VERSION,
		inventory: [],
		sets: [],
		activeSetId: null,
	};
}
