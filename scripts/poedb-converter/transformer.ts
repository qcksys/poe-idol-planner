import type {
	ConvertedData,
	Locale,
	ModifierData,
	ModifierTier,
	ParsedPage,
	RawModifier,
	UniqueIdol,
} from "./types.ts";
import { LOCALES } from "./types.ts";

function createEmptyLocaleRecord(): Record<Locale, string> {
	const record: Partial<Record<Locale, string>> = {};
	for (const locale of LOCALES) {
		record[locale] = "";
	}
	return record as Record<Locale, string>;
}

function generateModifierId(
	name: string,
	type: "prefix" | "suffix",
	mechanic: string,
): string {
	const slug = name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "_")
		.replace(/^_|_$/g, "");
	return `${type}_${mechanic}_${slug}`;
}

export function mergeModifiers(
	modifiersByLocale: Map<Locale, RawModifier[]>,
): ModifierData[] {
	const modifierMap = new Map<string, ModifierData>();
	const enModifiers = modifiersByLocale.get("en") || [];

	for (const rawMod of enModifiers) {
		const baseId = generateModifierId(
			rawMod.name,
			rawMod.type,
			rawMod.mechanic,
		);

		let modifier = modifierMap.get(baseId);
		if (!modifier) {
			modifier = {
				id: baseId,
				type: rawMod.type,
				name: createEmptyLocaleRecord(),
				tiers: [],
				mechanic: rawMod.mechanic,
				applicableIdols: [],
			};
			modifierMap.set(baseId, modifier);
		}

		modifier.name.en = rawMod.name;

		const existingTier = modifier.tiers.find((t) => t.tier === rawMod.tier);
		if (!existingTier) {
			const tier: ModifierTier = {
				tier: rawMod.tier,
				levelReq: rawMod.levelReq,
				text: createEmptyLocaleRecord(),
				values: rawMod.values,
				weight: rawMod.weight,
			};
			tier.text.en = rawMod.text;
			modifier.tiers.push(tier);
		}
	}

	for (const [locale, rawMods] of modifiersByLocale) {
		if (locale === "en") continue;

		for (const rawMod of rawMods) {
			const baseId = generateModifierId(
				rawMod.name,
				rawMod.type,
				rawMod.mechanic,
			);
			let modifier = modifierMap.get(baseId);

			if (!modifier) {
				for (const [_id, mod] of modifierMap) {
					if (
						mod.type === rawMod.type &&
						mod.tiers.some(
							(t) =>
								t.tier === rawMod.tier &&
								JSON.stringify(t.values) ===
									JSON.stringify(rawMod.values),
						)
					) {
						modifier = mod;
						break;
					}
				}
			}

			if (modifier) {
				modifier.name[locale] = rawMod.name;
				const tier = modifier.tiers.find((t) => t.tier === rawMod.tier);
				if (tier) {
					tier.text[locale] = rawMod.text;
				}
			}
		}
	}

	for (const modifier of modifierMap.values()) {
		modifier.tiers.sort((a, b) => a.tier - b.tier);
	}

	return Array.from(modifierMap.values());
}

export function mergeUniqueIdols(
	uniquesByLocale: Map<Locale, UniqueIdol[]>,
): UniqueIdol[] {
	const uniqueMap = new Map<string, UniqueIdol>();
	const enUniques = uniquesByLocale.get("en") || [];

	for (const unique of enUniques) {
		uniqueMap.set(unique.id, { ...unique });
	}

	for (const [locale, uniques] of uniquesByLocale) {
		if (locale === "en") continue;

		for (const unique of uniques) {
			const existingUnique = uniqueMap.get(unique.id);
			if (existingUnique) {
				existingUnique.name[locale] = unique.name[locale] || "";
				if (unique.flavourText) {
					existingUnique.flavourText =
						existingUnique.flavourText || createEmptyLocaleRecord();
					existingUnique.flavourText[locale] =
						unique.flavourText[locale] || "";
				}
				for (
					let i = 0;
					i < unique.modifiers.length &&
					i < existingUnique.modifiers.length;
					i++
				) {
					existingUnique.modifiers[i].text[locale] =
						unique.modifiers[i].text[locale] || "";
				}
			}
		}
	}

	return Array.from(uniqueMap.values());
}

export function transform(
	dataByLocale: Map<Locale, ParsedPage>,
): ConvertedData {
	const modifiersByLocale = new Map<Locale, RawModifier[]>();
	const uniquesByLocale = new Map<Locale, UniqueIdol[]>();

	for (const [locale, data] of dataByLocale) {
		modifiersByLocale.set(locale, data.modifiers);
		uniquesByLocale.set(locale, data.uniqueIdols);
	}

	return {
		modifiers: mergeModifiers(modifiersByLocale),
		uniqueIdols: mergeUniqueIdols(uniquesByLocale),
		generatedAt: new Date().toISOString(),
		version: 1,
	};
}
