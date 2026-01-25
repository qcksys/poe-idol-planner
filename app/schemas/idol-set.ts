import { z } from "zod";

export const GridPositionSchema = z.object({
	x: z.number().int().min(0).max(5),
	y: z.number().int().min(0).max(6),
});

export const GridTabSchema = z.enum(["tab1", "tab2", "tab3"]);

export const IdolPlacementSchema = z.object({
	id: z.string().uuid(),
	inventoryIdolId: z.string().uuid(),
	position: GridPositionSchema,
	tab: GridTabSchema,
});

export const IdolSetSchema = z.object({
	id: z.string().uuid(),
	name: z.string().min(1).max(50),
	createdAt: z.number(),
	updatedAt: z.number(),
	placements: z.array(IdolPlacementSchema),
	activeTab: GridTabSchema.default("tab1"),
});

export type GridPosition = z.infer<typeof GridPositionSchema>;
export type GridTab = z.infer<typeof GridTabSchema>;
export type IdolPlacement = z.infer<typeof IdolPlacementSchema>;
export type IdolSet = z.infer<typeof IdolSetSchema>;
