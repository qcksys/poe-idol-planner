import { parseHTML } from "linkedom";
import type {
	IdolBaseType,
	Locale,
	ParsedPage,
	RawModifier,
	UniqueIdol,
	ValueRange,
} from "./types.ts";
import { IDOL_BASE_TYPES } from "./types.ts";

interface PoedbModifier {
	Name: string;
	Level: string;
	ModGenerationTypeID: string;
	ModFamilyList: string[];
	DropChance: number;
	str: string;
	hover?: string;
}

interface ModsViewData {
	baseitem?: {
		Code?: string;
	};
	normal?: PoedbModifier[];
}

const IDOL_PAGE_TO_TYPE: Record<string, IdolBaseType> = {
	Minor_Idol: "Minor",
	Noble_Idol: "Noble",
	Kamasan_Idol: "Kamasan",
	Burial_Idol: "Burial",
	Totemic_Idol: "Totemic",
	Conqueror_Idol: "Conqueror",
};

function extractValues(text: string): ValueRange[] {
	const values: ValueRange[] = [];
	const plainText = text.replace(/<[^>]*>/g, "");

	const rangePattern = /\((\d+(?:\.\d+)?)[—–-](\d+(?:\.\d+)?)\)/g;
	for (const match of plainText.matchAll(rangePattern)) {
		values.push({
			min: Number.parseFloat(match[1]),
			max: Number.parseFloat(match[2]),
		});
	}

	return values;
}

function normalizeModText(html: string): string {
	return html
		.replace(/<span[^>]*class=['"]mod-value['"][^>]*>/gi, "")
		.replace(/<\/span>/gi, "")
		.replace(/<br\s*\/?>/gi, "\n")
		.replace(/<[^>]*>/g, "")
		.replace(/\s+/g, " ")
		.trim();
}

function detectMechanic(text: string): string {
	const mechanicKeywords: Record<string, string[]> = {
		abyss: ["abyss", "abyssal"],
		legion: ["legion", "incubator", "splinter"],
		ultimatum: ["ultimatum"],
		harvest: ["harvest", "lifeforce"],
		ritual: ["ritual", "tribute"],
		delirium: ["delirium", "simulacrum", "delirious"],
		blight: ["blight", "tower", "blighted"],
		metamorph: ["metamorph", "organ"],
		expedition: ["expedition", "artifact", "logbook"],
		heist: ["heist", "blueprint", "contract", "rogue"],
		breach: ["breach", "breachstone"],
		beyond: ["beyond", "demon"],
		essence: ["essence"],
		bestiary: ["bestiary", "einhar", "beast"],
		incursion: ["incursion", "temple", "alva"],
		betrayal: ["betrayal", "syndicate", "safehouse", "jun"],
		delve: ["delve", "sulphite", "darkness", "niko"],
		sanctum: ["sanctum", "resolve"],
		crucible: ["crucible"],
		affliction: ["affliction", "wildwood", "wisp"],
		necropolis: ["necropolis", "corpse", "lantern"],
		strongbox: ["strongbox"],
		shrine: ["shrine"],
		maven: ["maven", "witnessed"],
		conqueror: ["conqueror", "influenced", "elderslayer"],
		elder: ["elder", "shaper"],
		map: ["map", "maps", "atlas"],
	};

	const lowerText = text.toLowerCase();

	for (const [mechanic, keywords] of Object.entries(mechanicKeywords)) {
		for (const keyword of keywords) {
			if (lowerText.includes(keyword)) {
				return mechanic;
			}
		}
	}

	return "generic";
}

function extractModsViewJson(html: string): ModsViewData | null {
	const startMarker = "new ModsView(";
	const startIdx = html.indexOf(startMarker);
	if (startIdx === -1) {
		return null;
	}

	const jsonStart = startIdx + startMarker.length;
	let depth = 0;
	let endIdx = jsonStart;

	for (let i = jsonStart; i < html.length; i++) {
		const char = html[i];
		if (char === "{") {
			depth++;
		} else if (char === "}") {
			depth--;
			if (depth === 0) {
				endIdx = i + 1;
				break;
			}
		}
	}

	const jsonStr = html.substring(jsonStart, endIdx);

	try {
		return JSON.parse(jsonStr) as ModsViewData;
	} catch {
		console.error("Failed to parse ModsView JSON");
		return null;
	}
}

function generateModId(modFamily: string, type: string): string {
	const slug = modFamily
		.replace(/^MapRelic/, "")
		.replace(/([A-Z])/g, "_$1")
		.toLowerCase()
		.replace(/^_/, "")
		.replace(/_+/g, "_");
	return `${type}_${slug}`;
}

export function parseIdolPage(
	html: string,
	_locale: Locale,
	idolPage: string,
): ParsedPage {
	const modsViewData = extractModsViewJson(html);

	if (!modsViewData || !modsViewData.normal) {
		console.warn(`No ModsView data found for ${idolPage}`);
		return { modifiers: [], uniqueIdols: [] };
	}

	const idolType = IDOL_PAGE_TO_TYPE[idolPage];
	if (!idolType) {
		console.warn(`Unknown idol page: ${idolPage}`);
		return { modifiers: [], uniqueIdols: [] };
	}

	const modifiers: RawModifier[] = [];

	for (const mod of modsViewData.normal) {
		const type = mod.ModGenerationTypeID === "1" ? "prefix" : "suffix";
		const modText = normalizeModText(mod.str);
		const values = extractValues(mod.str);
		const mechanic = detectMechanic(modText);
		const levelReq = Number.parseInt(mod.Level, 10) || 68;
		const modFamily = mod.ModFamilyList?.[0] || mod.Name;

		modifiers.push({
			modId: generateModId(modFamily, type),
			type,
			name: mod.Name,
			tier: 1,
			levelReq,
			mechanic,
			text: modText,
			values,
			weight: mod.DropChance || 1000,
			tags: [mechanic],
			idolSource: idolType,
			modFamily,
		});
	}

	return {
		modifiers,
		uniqueIdols: [],
	};
}

export function parseUniquesPage(html: string, locale: Locale): UniqueIdol[] {
	const { document } = parseHTML(html);
	const uniques: UniqueIdol[] = [];

	const itemBoxes = document.querySelectorAll(".itembox, .unique-item");

	for (const box of itemBoxes) {
		const nameEl = box.querySelector(".itemName, .name, h3, h4");
		const name = nameEl?.textContent?.trim() || "";

		if (!name) continue;

		let baseType: IdolBaseType = "Minor";
		const baseText = box.textContent?.toLowerCase() || "";
		for (const type of IDOL_BASE_TYPES) {
			if (baseText.includes(type.toLowerCase())) {
				baseType = type;
				break;
			}
		}

		const modElements = box.querySelectorAll(
			".mod, .explicitMod, .implicitMod, li",
		);
		const mods: { text: Record<Locale, string>; values: ValueRange[] }[] =
			[];

		for (const modEl of modElements) {
			const modText = modEl.textContent?.trim() || "";
			if (modText && !modText.includes("Requires Level")) {
				mods.push({
					text: { [locale]: modText } as Record<Locale, string>,
					values: extractValues(modText),
				});
			}
		}

		const flavourEl = box.querySelector(".flavourText, .flavour");
		const flavourText = flavourEl?.textContent?.trim();

		const uniqueId = name
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "_")
			.replace(/^_|_$/g, "");

		uniques.push({
			id: uniqueId,
			name: { [locale]: name } as Record<Locale, string>,
			baseType,
			modifiers: mods,
			...(flavourText && {
				flavourText: { [locale]: flavourText } as Record<
					Locale,
					string
				>,
			}),
		});
	}

	return uniques;
}
