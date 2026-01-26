import { z } from "zod";
import { getAllUnlockIds } from "~/data/map-device-unlocks";
import { IdolSetSchema } from "./idol-set";
import { InventoryIdolSchema } from "./inventory";
import { createEmptyMapDevice } from "./scarab";

export const STORAGE_VERSION = 4;

// V1 schema - global inventory
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

// V2 schema - inventory moved to sets (no mapDevice)
const StorageSchemaV2 = z.object({
	version: z.literal(2),
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
			inventory: z.array(InventoryIdolSchema).default([]),
		}),
	),
	activeSetId: z.string().nullable(),
});

// V3 schema - adds mapDevice to sets (no unlockedConditions)
const StorageSchemaV3 = z.object({
	version: z.literal(3),
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
			inventory: z.array(InventoryIdolSchema).default([]),
			mapDevice: z
				.object({
					slots: z.array(
						z.object({
							slotIndex: z.number().int().min(0).max(4),
							scarabId: z.string().nullable(),
						}),
					),
					craftingOptionId: z.string().nullable(),
				})
				.default(createEmptyMapDevice()),
		}),
	),
	activeSetId: z.string().nullable(),
});

// Current V4 schema - adds unlockedConditions to sets
export const StorageSchema = z.object({
	version: z.literal(STORAGE_VERSION),
	sets: z.array(IdolSetSchema),
	activeSetId: z.string().nullable(),
});

export type StorageData = z.infer<typeof StorageSchema>;
type StorageDataV1 = z.infer<typeof StorageSchemaV1>;
type StorageDataV2 = z.infer<typeof StorageSchemaV2>;
type StorageDataV3 = z.infer<typeof StorageSchemaV3>;

export function createEmptyStorage(): StorageData {
	return {
		version: STORAGE_VERSION,
		sets: [],
		activeSetId: null,
	};
}

export function migrateV1ToV2(v1Data: StorageDataV1): StorageDataV2 {
	// Copy global inventory to each set
	const migratedSets = v1Data.sets.map((set) => ({
		...set,
		inventory: [...v1Data.inventory],
	}));

	return {
		version: 2,
		sets: migratedSets,
		activeSetId: v1Data.activeSetId,
	};
}

export function migrateV2ToV3(v2Data: StorageDataV2): StorageDataV3 {
	// Add mapDevice to each set
	const migratedSets = v2Data.sets.map((set) => ({
		...set,
		mapDevice: createEmptyMapDevice(),
	}));

	return {
		version: 3,
		sets: migratedSets,
		activeSetId: v2Data.activeSetId,
	};
}

export function migrateV3ToV4(v3Data: StorageDataV3): StorageData {
	// Add unlockedConditions to each set (default to all unlocked)
	const migratedSets = v3Data.sets.map((set) => ({
		...set,
		unlockedConditions: getAllUnlockIds(),
	}));

	return {
		version: STORAGE_VERSION,
		sets: migratedSets,
		activeSetId: v3Data.activeSetId,
	};
}

export function parseAndMigrateStorage(data: unknown): StorageData | null {
	// Try parsing as current version first
	const v4Result = StorageSchema.safeParse(data);
	if (v4Result.success) {
		return v4Result.data;
	}

	// Try parsing as V3 and migrate
	const v3Result = StorageSchemaV3.safeParse(data);
	if (v3Result.success) {
		return migrateV3ToV4(v3Result.data);
	}

	// Try parsing as V2 and migrate through V3
	const v2Result = StorageSchemaV2.safeParse(data);
	if (v2Result.success) {
		const v3Data = migrateV2ToV3(v2Result.data);
		return migrateV3ToV4(v3Data);
	}

	// Try parsing as V1 and migrate through V2, V3
	const v1Result = StorageSchemaV1.safeParse(data);
	if (v1Result.success) {
		const v2Data = migrateV1ToV2(v1Result.data);
		const v3Data = migrateV2ToV3(v2Data);
		return migrateV3ToV4(v3Data);
	}

	return null;
}
