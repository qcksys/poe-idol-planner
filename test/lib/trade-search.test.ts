import { describe, expect, it } from "vitest";
import {
	generateTradeUrl,
	generateTradeUrlForBaseType,
	generateTradeUrlForMod,
	getTradeStatId,
	hasTradeStatMapping,
	IDOL_TYPE_MAP,
} from "~/lib/trade-search";
import type { IdolInstance, IdolModifier } from "~/schemas/idol";
import { DEFAULT_LEAGUE } from "~/schemas/league";

describe("trade-search", () => {
	describe("getTradeStatId", () => {
		it("should find stat ID for exact match", () => {
			const statId = getTradeStatId(
				"Your Maps have +25% chance to contain an Abyss",
			);
			expect(statId).toMatchInlineSnapshot(`"explicit.stat_4278144676"`);
		});

		it("should find stat ID for text with different value", () => {
			const statId = getTradeStatId(
				"Your Maps have +45% chance to contain an Abyss",
			);
			expect(statId).toMatchInlineSnapshot(`"explicit.stat_4278144676"`);
		});

		it("should find stat ID for text with value range", () => {
			const statId = getTradeStatId(
				"Your Maps have +(15—25)% chance to contain an Abyss",
			);
			expect(statId).toMatchInlineSnapshot(`"explicit.stat_4278144676"`);
		});

		it("should return null for unknown mod text", () => {
			const statId = getTradeStatId("Some unknown modifier text");
			expect(statId).toBeNull();
		});

		it("should handle Legion encounter mods", () => {
			const statId = getTradeStatId(
				"Your Maps have +30% chance to contain a Legion Encounter",
			);
			expect(statId).toMatchInlineSnapshot(`"explicit.stat_1981273563"`);
		});

		it("should handle Breach mods", () => {
			const statId = getTradeStatId(
				"Your Maps have +20% chance to contain Breaches",
			);
			expect(statId).toMatchInlineSnapshot(`"explicit.stat_1133841298"`);
		});

		it("should handle Delirium mods", () => {
			const statId = getTradeStatId(
				"Delirium Monsters in your Maps have 50% increased chance to drop Cluster Jewels",
			);
			expect(statId).toMatchInlineSnapshot(`"explicit.stat_3580714718"`);
		});
	});

	describe("hasTradeStatMapping", () => {
		it("should return true for known mods", () => {
			expect(
				hasTradeStatMapping(
					"Your Maps have +25% chance to contain an Abyss",
				),
			).toBe(true);
		});

		it("should return false for unknown mods", () => {
			expect(hasTradeStatMapping("Unknown modifier")).toBe(false);
		});
	});

	describe("generateTradeUrl", () => {
		const createTestIdol = (
			overrides?: Partial<IdolInstance>,
		): IdolInstance => ({
			id: "test-idol-1",
			baseType: "minor",
			itemLevel: 83,
			rarity: "rare",
			prefixes: [],
			suffixes: [],
			corrupted: false,
			...overrides,
		});

		it("should generate a valid trade URL", () => {
			const idol = createTestIdol();
			const url = generateTradeUrl(idol);

			expect(url).toContain("https://www.pathofexile.com/trade/search/");
			expect(url).toContain(DEFAULT_LEAGUE);
			expect(url).toContain("?q=");
		});

		it("should include idol base type in query", () => {
			const idol = createTestIdol({ baseType: "conqueror" });
			const url = generateTradeUrl(idol);

			const queryParam = decodeURIComponent(url.split("?q=")[1]);
			const query = JSON.parse(queryParam);

			expect(query.query.type).toBe("Conqueror Idol");
		});

		it("should include mod filters when idol has mods with known stat IDs", () => {
			const mod: IdolModifier = {
				modId: "test-mod",
				type: "prefix",
				text: "Your Maps have +25% chance to contain an Abyss",
				rolledValue: 25,
				tier: 1,
				mechanic: "abyss",
			};
			const idol = createTestIdol({ prefixes: [mod] });
			const url = generateTradeUrl(idol);

			const queryParam = decodeURIComponent(url.split("?q=")[1]);
			const query = JSON.parse(queryParam);

			expect(query.query.stats[0].filters).toHaveLength(1);
			expect(query.query.stats[0].filters[0].id).toMatchInlineSnapshot(
				`"explicit.stat_4278144676"`,
			);
		});

		it("should respect league option", () => {
			const idol = createTestIdol();
			const url = generateTradeUrl(idol, { league: "Standard" });

			expect(url).toContain("/Standard?");
		});

		it("should respect onlineOnly option", () => {
			const idol = createTestIdol();
			const url = generateTradeUrl(idol, { onlineOnly: true });

			const queryParam = decodeURIComponent(url.split("?q=")[1]);
			const query = JSON.parse(queryParam);

			expect(query.query.status.option).toBe("online");
		});
	});

	describe("generateTradeUrlForBaseType", () => {
		it("should generate URL for base type search", () => {
			const url = generateTradeUrlForBaseType("burial");

			const queryParam = decodeURIComponent(url.split("?q=")[1]);
			const query = JSON.parse(queryParam);

			expect(query.query.type).toBe("Burial Idol");
		});

		it("should include minItemLevel filter when specified", () => {
			const url = generateTradeUrlForBaseType("noble", {
				minItemLevel: 80,
			});

			const queryParam = decodeURIComponent(url.split("?q=")[1]);
			const query = JSON.parse(queryParam);

			expect(query.query.filters.misc_filters.filters.ilvl.min).toBe(80);
		});
	});

	describe("generateTradeUrlForMod", () => {
		it("should generate URL for specific mod search", () => {
			const mod: IdolModifier = {
				modId: "test-mod",
				type: "prefix",
				text: "Your Maps have +30% chance to contain a Legion Encounter",
				rolledValue: 30,
				tier: 1,
				mechanic: "legion",
			};
			const url = generateTradeUrlForMod(mod);

			const queryParam = decodeURIComponent(url.split("?q=")[1]);
			const query = JSON.parse(queryParam);

			expect(query.query.stats[0].filters).toHaveLength(1);
			expect(query.query.stats[0].filters[0].id).toMatchInlineSnapshot(
				`"explicit.stat_1981273563"`,
			);
			expect(
				query.query.stats[0].filters[0].value.min,
			).toMatchInlineSnapshot(`30`);
		});

		it("should include base type when specified", () => {
			const mod: IdolModifier = {
				modId: "test-mod",
				type: "prefix",
				text: "Your Maps have +30% chance to contain a Legion Encounter",
				rolledValue: 30,
				tier: 1,
				mechanic: "legion",
			};
			const url = generateTradeUrlForMod(mod, { baseType: "totemic" });

			const queryParam = decodeURIComponent(url.split("?q=")[1]);
			const query = JSON.parse(queryParam);

			expect(query.query.type).toMatchInlineSnapshot(`"Totemic Idol"`);
		});
	});

	describe("IDOL_TYPE_MAP", () => {
		it("should have correct mappings for all idol types", () => {
			expect(IDOL_TYPE_MAP.minor).toBe("Minor Idol");
			expect(IDOL_TYPE_MAP.kamasan).toBe("Kamasan Idol");
			expect(IDOL_TYPE_MAP.totemic).toBe("Totemic Idol");
			expect(IDOL_TYPE_MAP.noble).toBe("Noble Idol");
			expect(IDOL_TYPE_MAP.burial).toBe("Burial Idol");
			expect(IDOL_TYPE_MAP.conqueror).toBe("Conqueror Idol");
		});
	});
});
