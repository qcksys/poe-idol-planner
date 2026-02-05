import { describe, expect, it } from "vitest";
import {
	normalizeExchangeId,
	parseScarabPricesFromExchangeResponse,
} from "~/scheduled/poeninja";
import {
	PoeNinjaExchangeResponseSchema,
	ScarabPricesDataSchema,
} from "~/schemas/scarab";
import fixtureData from "~test/fixtures/poeninja-exchange-scarabs.json";

describe("poeninja exchange API", () => {
	describe("PoeNinjaExchangeResponseSchema", () => {
		it("validates the fixture data", () => {
			const result =
				PoeNinjaExchangeResponseSchema.safeParse(fixtureData);
			expect(result.success).toBe(true);
		});

		it("parses lines with correct structure", () => {
			const result = PoeNinjaExchangeResponseSchema.parse(fixtureData);
			expect(result.lines.length).toBeGreaterThan(0);

			const firstLine = result.lines[0];
			expect(firstLine).toHaveProperty("id");
			expect(firstLine).toHaveProperty("primaryValue");
			expect(typeof firstLine.id).toBe("string");
			expect(typeof firstLine.primaryValue).toBe("number");
		});

		it("parses items with correct structure", () => {
			const result = PoeNinjaExchangeResponseSchema.parse(fixtureData);
			expect(result.items.length).toBeGreaterThan(0);

			const firstItem = result.items[0];
			expect(firstItem).toHaveProperty("id");
			expect(firstItem).toHaveProperty("name");
			expect(typeof firstItem.id).toBe("string");
			expect(typeof firstItem.name).toBe("string");
		});

		it("has matching ids between lines and items", () => {
			const result = PoeNinjaExchangeResponseSchema.parse(fixtureData);
			const lineIds = new Set(result.lines.map((l) => l.id));
			const itemIds = new Set(result.items.map((i) => i.id));

			for (const lineId of lineIds) {
				expect(itemIds.has(lineId)).toBe(true);
			}
		});
	});

	describe("normalizeExchangeId", () => {
		it("converts hyphens to underscores", () => {
			expect(normalizeExchangeId("ambush-scarab")).toBe("ambush_scarab");
			expect(normalizeExchangeId("horned-scarab-of-bloodlines")).toBe(
				"horned_scarab_of_bloodlines",
			);
		});

		it("handles ids without hyphens", () => {
			expect(normalizeExchangeId("scarab")).toBe("scarab");
		});

		it("handles empty string", () => {
			expect(normalizeExchangeId("")).toBe("");
		});
	});

	describe("parseScarabPricesFromExchangeResponse", () => {
		it("parses fixture data successfully", () => {
			const result = parseScarabPricesFromExchangeResponse(
				fixtureData,
				"TestLeague",
			);
			expect(result).not.toBeNull();
			expect(result?.league).toBe("TestLeague");
			expect(result?.updatedAt).toBeDefined();
			expect(Object.keys(result?.prices ?? {}).length).toBeGreaterThan(0);
		});

		it("returns valid ScarabPricesData structure", () => {
			const result = parseScarabPricesFromExchangeResponse(
				fixtureData,
				"TestLeague",
			);
			expect(result).not.toBeNull();

			const validation = ScarabPricesDataSchema.safeParse(result);
			expect(validation.success).toBe(true);
		});

		it("normalizes scarab ids to underscore format", () => {
			const result = parseScarabPricesFromExchangeResponse(
				fixtureData,
				"TestLeague",
			);
			expect(result).not.toBeNull();

			const ids = Object.keys(result?.prices ?? {});
			for (const id of ids) {
				expect(id).not.toContain("-");
				expect(id).toContain("scarab");
			}
		});

		it("extracts correct price values", () => {
			const result = parseScarabPricesFromExchangeResponse(
				fixtureData,
				"TestLeague",
			);
			expect(result).not.toBeNull();

			const ambushScarab = result?.prices.ambush_scarab;
			expect(ambushScarab).toBeDefined();
			expect(ambushScarab?.name).toBe("Ambush Scarab");
			expect(typeof ambushScarab?.chaosValue).toBe("number");
			expect(ambushScarab?.chaosValue).toBeGreaterThan(0);
		});

		it("maps display names from items array", () => {
			const result = parseScarabPricesFromExchangeResponse(
				fixtureData,
				"TestLeague",
			);
			expect(result).not.toBeNull();

			for (const price of Object.values(result?.prices ?? {})) {
				expect(price.name).not.toContain("-");
				expect(price.name.charAt(0)).toBe(
					price.name.charAt(0).toUpperCase(),
				);
			}
		});

		it("returns null for invalid data", () => {
			expect(
				parseScarabPricesFromExchangeResponse({}, "TestLeague"),
			).toBeNull();
			expect(
				parseScarabPricesFromExchangeResponse(
					{ lines: [] },
					"TestLeague",
				),
			).toBeNull();
			expect(
				parseScarabPricesFromExchangeResponse("invalid", "TestLeague"),
			).toBeNull();
			expect(
				parseScarabPricesFromExchangeResponse(null, "TestLeague"),
			).toBeNull();
		});

		it("filters to only include scarab items", () => {
			const dataWithNonScarab = {
				lines: [
					{ id: "ambush-scarab", primaryValue: 5 },
					{ id: "chaos-orb", primaryValue: 1 },
					{ id: "divine-orb", primaryValue: 150 },
				],
				items: [
					{ id: "ambush-scarab", name: "Ambush Scarab" },
					{ id: "chaos-orb", name: "Chaos Orb" },
					{ id: "divine-orb", name: "Divine Orb" },
				],
			};

			const result = parseScarabPricesFromExchangeResponse(
				dataWithNonScarab,
				"TestLeague",
			);
			expect(result).not.toBeNull();
			expect(Object.keys(result?.prices ?? {})).toHaveLength(1);
			expect(result?.prices.ambush_scarab).toBeDefined();
			expect(result?.prices.chaos_orb).toBeUndefined();
			expect(result?.prices.divine_orb).toBeUndefined();
		});
	});
});
