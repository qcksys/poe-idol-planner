import { z } from "zod";
import {
	IDOL_BASE_KEYS,
	LEAGUE_MECHANICS,
	RARITY_TYPES,
} from "~/data/idol-bases";

export const ValueRangeSchema = z.object({
	min: z.number(),
	max: z.number(),
});

export const IdolBaseKeySchema = z.enum(IDOL_BASE_KEYS);

export const RaritySchema = z.enum(RARITY_TYPES);

export const LeagueMechanicSchema = z.enum(LEAGUE_MECHANICS);

export const IdolModifierSchema = z.object({
	modId: z.string(),
	type: z.enum(["prefix", "suffix", "unique"]),
	text: z.string(),
	rolledValue: z.number(),
	valueRange: ValueRangeSchema.optional(),
	tier: z.number().int().min(1).max(10).nullable(),
	mechanic: LeagueMechanicSchema.optional(),
});

export const IdolImplicitSchema = z.object({
	text: z.string(),
	value: z.number(),
});

export const IdolInstanceSchema = z.object({
	id: z.string().min(1),
	baseType: IdolBaseKeySchema,
	itemLevel: z.number().int().min(1).max(100),
	rarity: RaritySchema,
	name: z.string().optional(),
	implicit: IdolImplicitSchema.optional(),
	prefixes: z.array(IdolModifierSchema).max(2),
	suffixes: z.array(IdolModifierSchema).max(2),
	corrupted: z.boolean().default(false),
});

export type ValueRange = z.infer<typeof ValueRangeSchema>;
export type IdolBaseKey = z.infer<typeof IdolBaseKeySchema>;
export type Rarity = z.infer<typeof RaritySchema>;
export type LeagueMechanic = z.infer<typeof LeagueMechanicSchema>;
export type IdolModifier = z.infer<typeof IdolModifierSchema>;
export type IdolImplicit = z.infer<typeof IdolImplicitSchema>;
export type IdolInstance = z.infer<typeof IdolInstanceSchema>;
