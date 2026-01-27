import { beforeEach, describe, expect, it } from "vitest";
import {
	clearModifierCache,
	matchModifierToDefinition,
	normalizeModText,
} from "~/lib/mod-matcher";

describe("mod-matcher", () => {
	beforeEach(() => {
		clearModifierCache();
	});

	describe("normalizeModText", () => {
		it("normalizes value with range format: 65(45-70)", () => {
			const input =
				"Your Maps have +65(45-70)% chance to contain a Legion Encounter";
			// The range format gets replaced, but +% are preserved
			const expected =
				"Your Maps have +#% chance to contain a Legion Encounter";
			expect(normalizeModText(input)).toBe(expected);
		});

		it("normalizes range-only format: (45-70)", () => {
			const input =
				"Your Maps have +(45-70)% chance to contain a Legion Encounter";
			const expected =
				"Your Maps have +#% chance to contain a Legion Encounter";
			expect(normalizeModText(input)).toBe(expected);
		});

		it("normalizes em-dash ranges: (45—70)", () => {
			const input =
				"Your Maps have +(45—70)% chance to contain a Legion Encounter";
			const expected =
				"Your Maps have +#% chance to contain a Legion Encounter";
			expect(normalizeModText(input)).toBe(expected);
		});

		it("normalizes plain numbers preserving + and %", () => {
			const input =
				"Your Maps have +65% chance to contain a Legion Encounter";
			const expected =
				"Your Maps have +#% chance to contain a Legion Encounter";
			expect(normalizeModText(input)).toBe(expected);
		});

		it("normalizes multiple values preserving separators", () => {
			const input =
				"Tier 1-5 Maps found have 35% chance to become 1 tier higher";
			const expected =
				"Tier #-# Maps found have #% chance to become # tier higher";
			expect(normalizeModText(input)).toBe(expected);
		});

		it("normalizes decimal numbers", () => {
			const input = "+0.5% chance for something";
			const expected = "+#% chance for something";
			expect(normalizeModText(input)).toBe(expected);
		});

		it("normalizes whitespace", () => {
			const input = "Your  Maps   have  +65%  chance";
			const expected = "Your Maps have +#% chance";
			expect(normalizeModText(input)).toBe(expected);
		});

		it("handles numbers without percent sign", () => {
			const input = "Your Maps contain an additional 2 Shrines";
			const expected = "Your Maps contain an additional # Shrines";
			expect(normalizeModText(input)).toBe(expected);
		});
	});

	describe("matchModifierToDefinition", () => {
		it("matches a Legion prefix modifier from simple format", () => {
			const text =
				"Your Maps have +65% chance to contain a Legion Encounter";
			const result = matchModifierToDefinition(
				text,
				65,
				undefined,
				"conqueror",
			);

			expect(result).not.toBeNull();
			expect(result?.type).toBe("prefix");
			expect(result?.mechanic).toBe("legion");
			expect(result?.modId).toContain("legion");
		});

		it("matches with type hint from advanced format", () => {
			const text =
				"Your Maps have +65% chance to contain a Legion Encounter";
			const result = matchModifierToDefinition(
				text,
				65,
				"prefix",
				"conqueror",
			);

			expect(result).not.toBeNull();
			expect(result?.type).toBe("prefix");
		});

		it("returns null for unmatched text", () => {
			const text = "This is not a real modifier text";
			const result = matchModifierToDefinition(
				text,
				0,
				undefined,
				"minor",
			);

			expect(result).toBeNull();
		});

		it("prefers modifiers applicable to the idol type", () => {
			const text = "Your Maps have +20% chance to contain an Abyss";
			const resultMinor = matchModifierToDefinition(
				text,
				20,
				undefined,
				"minor",
			);
			const resultConqueror = matchModifierToDefinition(
				text,
				20,
				undefined,
				"conqueror",
			);

			// Both should find a match
			expect(resultMinor).not.toBeNull();
			expect(resultConqueror).not.toBeNull();

			// The minor result should have higher confidence when matching minor idol
			if (resultMinor && resultConqueror) {
				// Check that it finds the correct modifier for the idol type
				expect(resultMinor.modId).toContain("minor");
			}
		});

		it("finds the best tier based on rolled value", () => {
			// This modifier should have multiple tiers
			const text = "Your Maps have +20% chance to contain an Abyss";
			const result = matchModifierToDefinition(
				text,
				20,
				"prefix",
				"minor",
			);

			expect(result).not.toBeNull();
			expect(result?.tier).toBeGreaterThanOrEqual(1);
			// Value should be within the tier's range
			if (result?.valueRange) {
				expect(result.valueRange.min).toBeLessThanOrEqual(20);
				expect(result.valueRange.max).toBeGreaterThanOrEqual(20);
			}
		});

		it("matches pack size modifier", () => {
			const text = "4% increased Pack Size in your Maps";
			const result = matchModifierToDefinition(
				text,
				4,
				undefined,
				"conqueror",
			);

			expect(result).not.toBeNull();
			expect(result?.modId).toBeDefined();
			expect(result?.mechanic).toBe("map");
		});

		it("matches harbinger suffix modifier", () => {
			const text =
				"Currency Shards dropped by Harbingers in your Maps can drop as Currency Items instead";
			const result = matchModifierToDefinition(
				text,
				0,
				"suffix",
				"conqueror",
			);

			expect(result).not.toBeNull();
			expect(result?.type).toBe("suffix");
		});

		it("matches ultimatum modifier", () => {
			const text =
				"Ultimatum Boss drops a full stack of a random Catalyst";
			const result = matchModifierToDefinition(
				text,
				0,
				undefined,
				"conqueror",
			);

			expect(result).not.toBeNull();
			expect(result?.mechanic).toBe("ultimatum");
		});

		it("includes confidence score in result", () => {
			const text =
				"Your Maps have +65% chance to contain a Legion Encounter";
			const result = matchModifierToDefinition(
				text,
				65,
				"prefix",
				"conqueror",
			);

			expect(result).not.toBeNull();
			expect(result?.confidence).toBeGreaterThan(0);
			expect(result?.confidence).toBeLessThanOrEqual(1);
		});
	});
});
