import { parseHTML } from "linkedom";
import type {
	Locale,
	ParsedPage,
	RawModifier,
	UniqueIdol,
	ValueRange,
} from "./types.ts";
import { IDOL_BASE_TYPES, type IdolBaseType } from "./types.ts";

function extractValues(text: string): ValueRange[] {
	const values: ValueRange[] = [];
	const rangePattern = /\((\d+(?:\.\d+)?)[—–-](\d+(?:\.\d+)?)\)/g;
	const _modValuePattern =
		/<span[^>]*class=['"]mod-value['"][^>]*>\((\d+(?:\.\d+)?)[—–-](\d+(?:\.\d+)?)\)<\/span>/gi;

	const plainText = text.replace(/<[^>]*>/g, "");

	for (const match of plainText.matchAll(rangePattern)) {
		values.push({
			min: Number.parseFloat(match[1]),
			max: Number.parseFloat(match[2]),
		});
	}

	if (values.length === 0) {
		const singlePattern = /(?<![0-9])(\d+(?:\.\d+)?)(?![0-9])/g;
		for (const match of plainText.matchAll(singlePattern)) {
			const val = Number.parseFloat(match[1]);
			if (val > 0 && val < 10000) {
				values.push({ min: val, max: val });
			}
		}
	}

	return values;
}

function normalizeModText(text: string): string {
	return text
		.replace(/<span[^>]*class=['"]mod-value['"][^>]*>/gi, "")
		.replace(/<\/span>/gi, "")
		.replace(/<br\s*\/?>/gi, "\n")
		.replace(/<span[^>]*class=['"]secondary['"][^>]*>.*?<\/span>/gi, "")
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

function generateModId(levelReq: number, type: string, text: string): string {
	const slug = text
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "_")
		.replace(/^_|_$/g, "")
		.slice(0, 50);
	return `${type}_${levelReq}_${slug}`;
}

export function parseModifiersPage(
	html: string,
	_locale: Locale,
): RawModifier[] {
	const { document } = parseHTML(html);
	const modifiers: RawModifier[] = [];

	const tables = document.querySelectorAll("table.table tbody");

	for (const tbody of tables) {
		const rows = tbody.querySelectorAll("tr");

		for (const row of rows) {
			const cells = row.querySelectorAll("td");
			if (cells.length < 3) continue;

			const levelReqText = cells[0]?.textContent?.trim() || "";
			const typeText = cells[1]?.textContent?.trim().toLowerCase() || "";
			const modHtml = cells[2]?.innerHTML || "";
			const modText = normalizeModText(modHtml);

			const levelReq = Number.parseInt(levelReqText, 10) || 0;

			if (!modText || (typeText !== "prefix" && typeText !== "suffix")) {
				continue;
			}

			const type = typeText as "prefix" | "suffix";
			const mechanic = detectMechanic(modText);
			const values = extractValues(modHtml);

			modifiers.push({
				modId: generateModId(levelReq, type, modText),
				type,
				name: modText.slice(0, 100),
				tier: 1,
				levelReq,
				mechanic,
				text: modText,
				values,
				weight: 1000,
				tags: [mechanic],
			});
		}
	}

	return modifiers;
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

export function parsePoedbPage(html: string, locale: Locale): ParsedPage {
	return {
		modifiers: parseModifiersPage(html, locale),
		uniqueIdols: parseUniquesPage(html, locale),
	};
}
