import { describe, expect, it } from "vitest";
import { parseIdolText, parseMultipleIdols } from "~/lib/idol-parser";

const SIMPLE_FORMAT_IDOL = `
Item Class: Idols
Rarity: Rare
Bramble Ornament
Conqueror Idol
--------
Item Level: 82
--------
8% increased Maps found in Area (implicit)
--------
Ultimatum Boss drops a full stack of a random Catalyst
Currency Shards dropped by Harbingers in your Maps can drop as Currency Items instead
Your Maps have +65% chance to contain a Legion Encounter
4% increased Pack Size in your Maps
--------
Place this item into the Idol inventory at a Map Device to affect Maps you open. Idols are not consumed when opening Maps.
--------
Unmodifiable

`;

const ADVANCED_FORMAT_IDOL = `
Item Class: Idols
Rarity: Rare
Bramble Ornament
Conqueror Idol
--------
Item Level: 82
--------
{ Implicit Modifier }
8% increased Maps found in Area (implicit)
--------
{ Prefix Modifier "General's" (Tier: 1) }
Your Maps have +65(45-70)% chance to contain a Legion Encounter

{ Prefix Modifier "Cartographer's" (Tier: 1) }
4(4-6)% increased Pack Size in your Maps

{ Suffix Modifier "of Ultimatum" (Tier: 1) }
Ultimatum Boss drops a full stack of a random Catalyst

{ Suffix Modifier "of the Harbinger" (Tier: 1) }
Currency Shards dropped by Harbingers in your Maps can drop as Currency Items instead

--------
Place this item into the Idol inventory at a Map Device to affect Maps you open. Idols are not consumed when opening Maps.
--------
Unmodifiable

`;

const MAGIC_IDOL = `
Item Class: Idols
Rarity: Magic
Bramble Ornament
Conqueror Idol
--------
Item Level: 82
--------
8% increased Maps found in Area (implicit)
--------
Ultimatum Boss drops a full stack of a random Catalyst
4% increased Pack Size in your Maps
--------
Place this item into the Idol inventory at a Map Device to affect Maps you open. Idols are not consumed when opening Maps.
--------
Unmodifiable
`;

describe("idol-parser", () => {
	describe("parseIdolText", () => {
		describe("simple format (Ctrl+C)", () => {
			it("parses basic idol data", () => {
				const result = parseIdolText(SIMPLE_FORMAT_IDOL);

				expect(result.success).toBe(true);
				expect(result.idol).toBeDefined();
				expect(result.idol?.baseType).toBe("conqueror");
				expect(result.idol?.rarity).toBe("rare");
				expect(result.idol?.itemLevel).toBe(82);
			});

			it("extracts modifiers from simple format", () => {
				const result = parseIdolText(SIMPLE_FORMAT_IDOL);

				expect(result.success).toBe(true);
				const idol = result.idol!;
				const allMods = [...idol.prefixes, ...idol.suffixes];
				expect(allMods.length).toBeGreaterThan(0);
			});

			it("extracts implicit modifier when present", () => {
				const result = parseIdolText(SIMPLE_FORMAT_IDOL);

				expect(result.success).toBe(true);
				expect(result.idol?.implicit).toBeDefined();
				expect(result.idol?.implicit?.text).toContain("Maps found");
				expect(result.idol?.implicit?.value).toBe(8);
			});

			it("parses magic rarity", () => {
				const result = parseIdolText(MAGIC_IDOL);

				expect(result.success).toBe(true);
				expect(result.idol?.rarity).toBe("magic");
				expect(result.idol?.baseType).toBe("conqueror");
			});
		});

		describe("advanced format (Ctrl+Alt+C)", () => {
			it("parses advanced format with tiers", () => {
				const result = parseIdolText(ADVANCED_FORMAT_IDOL);

				expect(result.success).toBe(true);
				expect(result.idol).toBeDefined();
				expect(result.idol?.baseType).toBe("conqueror");
				expect(result.idol?.itemLevel).toBe(82);
			});

			it("extracts modifier type (prefix/suffix) from advanced format", () => {
				const result = parseIdolText(ADVANCED_FORMAT_IDOL);

				expect(result.success).toBe(true);
				const idol = result.idol!;

				expect(idol.prefixes.length).toBe(2);
				expect(idol.suffixes.length).toBe(2);
			});

			it("extracts tier information", () => {
				const result = parseIdolText(ADVANCED_FORMAT_IDOL);

				expect(result.success).toBe(true);
				const idol = result.idol!;
				const allMods = [...idol.prefixes, ...idol.suffixes];

				const modWithTier = allMods.find((m) => m.tier !== null);
				expect(modWithTier).toBeDefined();
				expect(modWithTier?.tier).toBe(1);
			});

			it("parses advanced format successfully", () => {
				const result = parseIdolText(ADVANCED_FORMAT_IDOL);

				expect(result.success).toBe(true);
				const idol = result.idol!;
				const allMods = [...idol.prefixes, ...idol.suffixes];

				expect(allMods.length).toBe(4);
			});

			it("extracts rolled values", () => {
				const result = parseIdolText(ADVANCED_FORMAT_IDOL);

				expect(result.success).toBe(true);
				const idol = result.idol!;
				const legionMod = idol.prefixes.find((p) =>
					p.text.includes("Legion"),
				);
				expect(legionMod?.rolledValue).toBe(65);
			});
		});

		describe("error handling", () => {
			it("returns error for empty text", () => {
				const result = parseIdolText("");
				expect(result.success).toBe(false);
				expect(result.error).toBeDefined();
			});

			it("returns error for whitespace-only text", () => {
				const result = parseIdolText("   \n\t  ");
				expect(result.success).toBe(false);
			});

			it("returns error for invalid text", () => {
				const result = parseIdolText(
					"This is not an idol just some random text",
				);
				expect(result.success).toBe(false);
				expect(result.error).toBeDefined();
			});
		});

		describe("base type detection", () => {
			it("detects Conqueror Idol", () => {
				const result = parseIdolText(SIMPLE_FORMAT_IDOL);
				expect(result.idol?.baseType).toBe("conqueror");
			});

			it("detects Minor Idol", () => {
				const text = SIMPLE_FORMAT_IDOL.replace(
					"Conqueror Idol",
					"Minor Idol",
				);
				const result = parseIdolText(text);
				expect(result.idol?.baseType).toBe("minor");
			});

			it("detects Totemic Idol", () => {
				const text = SIMPLE_FORMAT_IDOL.replace(
					"Conqueror Idol",
					"Totemic Idol",
				);
				const result = parseIdolText(text);
				expect(result.idol?.baseType).toBe("totemic");
			});

			it("detects Kamasan Idol", () => {
				const text = SIMPLE_FORMAT_IDOL.replace(
					"Conqueror Idol",
					"Kamasan Idol",
				);
				const result = parseIdolText(text);
				expect(result.idol?.baseType).toBe("kamasan");
			});

			it("detects Noble Idol", () => {
				const text = SIMPLE_FORMAT_IDOL.replace(
					"Conqueror Idol",
					"Noble Idol",
				);
				const result = parseIdolText(text);
				expect(result.idol?.baseType).toBe("noble");
			});

			it("detects Burial Idol", () => {
				const text = SIMPLE_FORMAT_IDOL.replace(
					"Conqueror Idol",
					"Burial Idol",
				);
				const result = parseIdolText(text);
				expect(result.idol?.baseType).toBe("burial");
			});
		});

		describe("rarity detection", () => {
			it("detects normal rarity", () => {
				const text = SIMPLE_FORMAT_IDOL.replace(
					"Rarity: Rare",
					"Rarity: Normal",
				);
				const result = parseIdolText(text);
				expect(result.idol?.rarity).toBe("normal");
			});

			it("detects magic rarity", () => {
				const result = parseIdolText(MAGIC_IDOL);
				expect(result.idol?.rarity).toBe("magic");
			});

			it("detects rare rarity", () => {
				const result = parseIdolText(SIMPLE_FORMAT_IDOL);
				expect(result.idol?.rarity).toBe("rare");
			});

			it("detects unique rarity", () => {
				const text = SIMPLE_FORMAT_IDOL.replace(
					"Rarity: Rare",
					"Rarity: Unique",
				);
				const result = parseIdolText(text);
				expect(result.idol?.rarity).toBe("unique");
			});
		});
	});

	describe("parseMultipleIdols", () => {
		it("parses multiple idols from combined text", () => {
			const combinedText = `${SIMPLE_FORMAT_IDOL}\n${MAGIC_IDOL}`;
			const results = parseMultipleIdols(combinedText);

			// Should have at least 2 successful results
			const successfulResults = results.filter((r) => r.success);
			expect(successfulResults.length).toBeGreaterThanOrEqual(2);
		});

		it("handles single idol", () => {
			const results = parseMultipleIdols(SIMPLE_FORMAT_IDOL);

			// Should have at least 1 successful result
			const successfulResults = results.filter((r) => r.success);
			expect(successfulResults.length).toBeGreaterThanOrEqual(1);
		});

		it("handles empty input", () => {
			const results = parseMultipleIdols("");

			expect(results.length).toBe(0);
		});
	});
});
