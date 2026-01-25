export const IDOL_BASES = {
	minor: { name: "Minor Idol", width: 1, height: 1, implicit: 2 },
	kamasan: { name: "Kamasan Idol", width: 1, height: 2, implicit: 4 },
	totemic: { name: "Totemic Idol", width: 1, height: 3, implicit: 6 },
	noble: { name: "Noble Idol", width: 2, height: 1, implicit: 4 },
	burial: { name: "Burial Idol", width: 3, height: 1, implicit: 6 },
	conqueror: { name: "Conqueror Idol", width: 2, height: 2, implicit: 8 },
} as const;

export type IdolBaseKey = keyof typeof IDOL_BASES;
export type IdolBase = (typeof IDOL_BASES)[IdolBaseKey];

export const IDOL_BASE_KEYS = Object.keys(IDOL_BASES) as IdolBaseKey[];

export const RARITY_TYPES = ["normal", "magic", "rare", "unique"] as const;
export type Rarity = (typeof RARITY_TYPES)[number];

export const LEAGUE_MECHANICS = [
	"abyss",
	"affliction",
	"bestiary",
	"betrayal",
	"beyond",
	"blight",
	"breach",
	"crucible",
	"delirium",
	"delve",
	"elder",
	"essence",
	"expedition",
	"harvest",
	"heist",
	"incursion",
	"legion",
	"map",
	"maven",
	"metamorph",
	"necropolis",
	"ritual",
	"sanctum",
	"shrine",
	"strongbox",
	"ultimatum",
	"generic",
] as const;

export type LeagueMechanic = (typeof LEAGUE_MECHANICS)[number];

export function getIdolBase(key: IdolBaseKey): IdolBase {
	return IDOL_BASES[key];
}

export function getIdolSize(key: IdolBaseKey): {
	width: number;
	height: number;
} {
	const base = IDOL_BASES[key];
	return { width: base.width, height: base.height };
}
