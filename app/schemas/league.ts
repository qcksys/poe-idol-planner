import { z } from "zod";

export const RealmSchema = z.enum(["pc", "xbox", "sony"]);
export type Realm = z.infer<typeof RealmSchema>;

export const LeagueSchema = z.object({
	id: z.string(),
	realm: RealmSchema,
	text: z.string(),
});

export type League = z.infer<typeof LeagueSchema>;

export const LeaguesDataSchema = z.object({
	result: z.array(LeagueSchema),
});

export type LeaguesData = z.infer<typeof LeaguesDataSchema>;

export const DEFAULT_LEAGUE = "Keepers";
export const DEFAULT_REALM: Realm = "pc";
