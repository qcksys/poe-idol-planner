import { describe, expect, it } from "vitest";
import { normalizeModText } from "../../scripts/poedb-idol-converter/trade-stats";

describe("trade-stats", () => {
	describe("normalizeModText", () => {
		describe("number replacement", () => {
			it("replaces integer ranges with #", () => {
				expect(normalizeModText("(3—5)% increased")).toBe(
					"#% increased",
				);
			});

			it("replaces decimal ranges with #", () => {
				expect(normalizeModText("(0.8—1.2)% chance")).toBe("#% chance");
			});

			it("replaces single integers with #", () => {
				expect(normalizeModText("contains 2 additional")).toBe(
					"contains # additional",
				);
			});

			it("preserves + prefix", () => {
				expect(normalizeModText("+(15—25)% chance")).toBe("+#% chance");
			});

			it("preserves % suffix", () => {
				expect(normalizeModText("(80—100)% increased")).toBe(
					"#% increased",
				);
			});
		});

		describe("whitespace normalization", () => {
			it("collapses multiple spaces", () => {
				expect(normalizeModText("Maps  have   increased")).toBe(
					"Maps have increased",
				);
			});

			it("replaces newlines with spaces", () => {
				expect(normalizeModText("Maps\nhave")).toBe("Maps have");
			});

			it("trims leading and trailing whitespace", () => {
				expect(normalizeModText("  Maps have  ")).toBe("Maps have");
			});
		});

		describe("direction word canonicalization", () => {
			it("canonicalizes reduced to increased", () => {
				expect(normalizeModText("#% reduced Cost")).toBe(
					"#% increased Cost",
				);
			});

			it("canonicalizes less to more", () => {
				expect(normalizeModText("#% less Damage")).toBe(
					"#% more Damage",
				);
			});

			it("canonicalizes slower to faster", () => {
				expect(normalizeModText("dissipates #% slower")).toBe(
					"dissipates #% faster",
				);
			});

			it("canonicalizes fewer to additional", () => {
				expect(normalizeModText("# fewer monsters")).toBe(
					"# additional monsters",
				);
			});

			it("does not affect words containing direction words", () => {
				expect(normalizeModText("Timeless Conflict")).toBe(
					"Timeless Conflict",
				);
			});

			it("handles case-insensitive matching", () => {
				expect(normalizeModText("REDUCED damage")).toBe(
					"increased damage",
				);
				expect(normalizeModText("Slower attack")).toBe("faster attack");
			});
		});

		describe("full mod text examples", () => {
			it("matches ultimatum reduced/increased example", () => {
				const idol =
					"Ultimatum Encounters in your Maps requiring you to Defeat waves of Enemies require killing (3—5)% reduced number of Enemies";
				const trade =
					"Ultimatum Encounters in your Maps requiring you to Defeat waves of Enemies\nrequire killing #% increased number of Enemies";

				expect(normalizeModText(idol)).toBe(normalizeModText(trade));
			});

			it("matches delirium slower/faster example", () => {
				const idol =
					"Delirium Fog in your Maps dissipates (2—5)% slower";
				const trade = "Delirium Fog in your Maps dissipates #% faster";

				expect(normalizeModText(idol)).toBe(normalizeModText(trade));
			});

			it("matches ritual reroll reduced/increased example", () => {
				const idol =
					"Rerolling Favours at Ritual Altars in your Maps costs (8—12)% reduced Tribute";
				const trade =
					"Rerolling Favours at Ritual Altars in your Maps costs #% increased Tribute";

				expect(normalizeModText(idol)).toBe(normalizeModText(trade));
			});

			it("matches decimal chance example", () => {
				const idol =
					"Favours Rerolled at Ritual Altars in your Maps have (0.8—1.2)% chance to cost no Tribute";
				const trade =
					"Favours Rerolled at Ritual Altars in your Maps have #% chance to cost no Tribute";

				expect(normalizeModText(idol)).toBe(normalizeModText(trade));
			});
		});
	});
});
