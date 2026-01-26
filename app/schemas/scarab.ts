import { z } from "zod";

export const ScarabSchema = z.object({
	id: z.string(),
	name: z.string(),
	effect: z.string(),
	category: z.string(),
	image: z.string(),
	limit: z.number().int().positive(),
});

export type Scarab = z.infer<typeof ScarabSchema>;

export const ScarabsDataSchema = z.object({
	scarabs: z.array(ScarabSchema),
	categories: z.array(z.string()),
	generatedAt: z.string(),
	version: z.number(),
});

export type ScarabsData = z.infer<typeof ScarabsDataSchema>;

export const MapDeviceSlotSchema = z.object({
	slotIndex: z.number().int().min(0).max(4),
	scarabId: z.string().nullable(),
});

export type MapDeviceSlot = z.infer<typeof MapDeviceSlotSchema>;

export const MapCraftingOptionSchema = z.object({
	id: z.string(),
	name: z.string(),
	effect: z.string(),
	cost: z.number().int().min(0),
	imbued: z.boolean().default(false),
});

export type MapCraftingOption = z.infer<typeof MapCraftingOptionSchema>;

export const MapDeviceSchema = z.object({
	slots: z.array(MapDeviceSlotSchema).length(5),
	craftingOptionId: z.string().nullable().default(null),
});

export type MapDevice = z.infer<typeof MapDeviceSchema>;

export function createEmptyMapDevice(): MapDevice {
	return {
		slots: [
			{ slotIndex: 0, scarabId: null },
			{ slotIndex: 1, scarabId: null },
			{ slotIndex: 2, scarabId: null },
			{ slotIndex: 3, scarabId: null },
			{ slotIndex: 4, scarabId: null },
		],
		craftingOptionId: null,
	};
}

export const HORNED_SCARAB_OF_AWAKENING_ID = "horned_scarab_of_awakening";
