import { z } from "zod";
import { IdolSetSchema } from "./idol-set";
import { InventoryIdolSchema } from "./inventory";

export const SharedSetSchema = z.object({
	version: z.literal(1),
	set: IdolSetSchema,
	idols: z.array(InventoryIdolSchema),
	createdAt: z.number(),
	expiresAt: z.number(),
});

export type SharedSet = z.infer<typeof SharedSetSchema>;

export const SHARE_TTL_DAYS = 30;
export const SHARE_TTL_MS = SHARE_TTL_DAYS * 24 * 60 * 60 * 1000;
