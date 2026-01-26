import { z } from "zod";
import { IdolSetSchema } from "./idol-set";
import { InventoryIdolSchema } from "./inventory";

export const STORAGE_VERSION = 2;

// V1 schema for migration
const StorageSchemaV1 = z.object({
	version: z.literal(1),
	inventory: z.array(InventoryIdolSchema),
	sets: z.array(
		z.object({
			id: z.string().min(1),
			name: z.string().min(1).max(50),
			createdAt: z.number(),
			updatedAt: z.number(),
			placements: z.array(
				z.object({
					id: z.string().min(1),
					inventoryIdolId: z.string().min(1),
					position: z.object({
						x: z.number().int().min(0).max(5),
						y: z.number().int().min(0).max(6),
					}),
					tab: z.enum(["tab1", "tab2", "tab3"]),
				}),
			),
			activeTab: z.enum(["tab1", "tab2", "tab3"]).default("tab1"),
		}),
	),
	activeSetId: z.string().nullable(),
});

// Current V2 schema - inventory moved to sets
export const StorageSchema = z.object({
	version: z.literal(STORAGE_VERSION),
	sets: z.array(IdolSetSchema),
	activeSetId: z.string().nullable(),
});

export type StorageData = z.infer<typeof StorageSchema>;
type StorageDataV1 = z.infer<typeof StorageSchemaV1>;

export function createEmptyStorage(): StorageData {
	return {
		version: STORAGE_VERSION,
		sets: [],
		activeSetId: null,
	};
}

export function migrateV1ToV2(v1Data: StorageDataV1): StorageData {
	// Copy global inventory to each set
	const migratedSets = v1Data.sets.map((set) => ({
		...set,
		inventory: [...v1Data.inventory],
	}));

	return {
		version: STORAGE_VERSION,
		sets: migratedSets,
		activeSetId: v1Data.activeSetId,
	};
}

export function parseAndMigrateStorage(data: unknown): StorageData | null {
	// Try parsing as current version first
	const v2Result = StorageSchema.safeParse(data);
	if (v2Result.success) {
		return v2Result.data;
	}

	// Try parsing as V1 and migrate
	const v1Result = StorageSchemaV1.safeParse(data);
	if (v1Result.success) {
		return migrateV1ToV2(v1Result.data);
	}

	return null;
}
