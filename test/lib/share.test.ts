import { describe, expect, it } from "vitest";
import {
	buildShareUrl,
	calculateScarabCost,
	extractMechanics,
	extractScarabIds,
	formatMetaDescription,
} from "~/lib/share";
import type { ScarabPricesData } from "~/schemas/scarab";
import type { SharedSet } from "~/schemas/share";

const createMockSharedSet = (overrides: Partial<SharedSet> = {}): SharedSet => {
	return {
		version: 1,
		set: {
			id: "test-set",
			name: "Test Set",
			createdAt: Date.now(),
			updatedAt: Date.now(),
			placements: [],
			inventory: [],
			unlockedConditions: [],
			mapDevice: {
				slots: [
					{ slotIndex: 0, scarabId: null },
					{ slotIndex: 1, scarabId: null },
					{ slotIndex: 2, scarabId: null },
					{ slotIndex: 3, scarabId: null },
					{ slotIndex: 4, scarabId: null },
				],
				craftingOptionId: null,
			},
		},
		idols: [],
		createdAt: Date.now(),
		...overrides,
	};
};

describe("share helpers", () => {
	describe("extractMechanics", () => {
		it("returns empty array when no idols", () => {
			const sharedSet = createMockSharedSet();
			expect(extractMechanics(sharedSet)).toEqual([]);
		});

		it("extracts unique mechanics from idol modifiers using real mod IDs", () => {
			const sharedSet = createMockSharedSet({
				idols: [
					{
						id: "idol-1",
						source: "clipboard",
						importedAt: Date.now(),
						usageCount: 0,
						idol: {
							id: "idol-1",
							baseType: "minor",
							itemLevel: 80,
							rarity: "rare",
							prefixes: [
								{
									modId: "prefix_minor_additional_abyss_chance",
									type: "prefix",
									rolledValue: 20,
									tier: 1,
								},
							],
							suffixes: [
								{
									modId: "suffix_minor_breach_increased_magic_packs",
									type: "suffix",
									rolledValue: 10,
									tier: 1,
								},
							],
						},
					},
					{
						id: "idol-2",
						source: "clipboard",
						importedAt: Date.now(),
						usageCount: 0,
						idol: {
							id: "idol-2",
							baseType: "minor",
							itemLevel: 80,
							rarity: "rare",
							prefixes: [
								{
									modId: "prefix_minor_additional_abyss_chance",
									type: "prefix",
									rolledValue: 15,
									tier: 1,
								},
							],
							suffixes: [
								{
									modId: "suffix_minor_legion_general_chance",
									type: "suffix",
									rolledValue: 5,
									tier: 1,
								},
							],
						},
					},
				],
			});
			const mechanics = extractMechanics(sharedSet);
			expect(mechanics).toEqual(["abyss", "breach", "legion"]);
		});

		it("ignores modifiers without mechanics (unknown mod IDs)", () => {
			const sharedSet = createMockSharedSet({
				idols: [
					{
						id: "idol-1",
						source: "clipboard",
						importedAt: Date.now(),
						usageCount: 0,
						idol: {
							id: "idol-1",
							baseType: "minor",
							itemLevel: 80,
							rarity: "rare",
							prefixes: [
								{
									modId: "unknown_mod_id",
									type: "prefix",
									rolledValue: 10,
									tier: 1,
								},
							],
							suffixes: [],
						},
					},
				],
			});
			expect(extractMechanics(sharedSet)).toEqual([]);
		});
	});

	describe("extractScarabIds", () => {
		it("returns empty array when no scarabs equipped", () => {
			const sharedSet = createMockSharedSet();
			expect(extractScarabIds(sharedSet)).toEqual([]);
		});

		it("extracts scarab IDs from map device slots", () => {
			const sharedSet = createMockSharedSet({
				set: {
					id: "test-set",
					name: "Test Set",
					createdAt: Date.now(),
					updatedAt: Date.now(),
					placements: [],
					inventory: [],
					unlockedConditions: [],
					mapDevice: {
						slots: [
							{ slotIndex: 0, scarabId: "divination_scarab" },
							{ slotIndex: 1, scarabId: null },
							{ slotIndex: 2, scarabId: "breach_scarab" },
							{ slotIndex: 3, scarabId: null },
							{ slotIndex: 4, scarabId: "legion_scarab" },
						],
						craftingOptionId: null,
					},
				},
			});
			expect(extractScarabIds(sharedSet)).toEqual([
				"divination_scarab",
				"breach_scarab",
				"legion_scarab",
			]);
		});
	});

	describe("calculateScarabCost", () => {
		it("returns null when prices is null", () => {
			expect(calculateScarabCost(["scarab-1"], null)).toBeNull();
		});

		it("returns null when no matching prices found", () => {
			const prices: ScarabPricesData = {
				league: "Keepers",
				prices: {},
				updatedAt: new Date().toISOString(),
			};
			expect(calculateScarabCost(["scarab-1"], prices)).toBeNull();
		});

		it("calculates total cost from matching prices", () => {
			const prices: ScarabPricesData = {
				league: "Keepers",
				prices: {
					"scarab-1": { name: "Scarab 1", chaosValue: 10 },
					"scarab-2": { name: "Scarab 2", chaosValue: 25.5 },
				},
				updatedAt: new Date().toISOString(),
			};
			expect(calculateScarabCost(["scarab-1", "scarab-2"], prices)).toBe(
				35.5,
			);
		});

		it("rounds to one decimal place", () => {
			const prices: ScarabPricesData = {
				league: "Keepers",
				prices: {
					"scarab-1": { name: "Scarab 1", chaosValue: 10.333 },
					"scarab-2": { name: "Scarab 2", chaosValue: 5.666 },
				},
				updatedAt: new Date().toISOString(),
			};
			expect(calculateScarabCost(["scarab-1", "scarab-2"], prices)).toBe(
				16,
			);
		});
	});

	describe("formatMetaDescription", () => {
		it("returns default message when no data", () => {
			expect(formatMetaDescription([], [], null)).toBe(
				"View and import this shared idol set",
			);
		});

		it("formats mechanics only", () => {
			expect(
				formatMetaDescription(["delirium", "breach"], [], null),
			).toBe("Delirium, Breach");
		});

		it("formats scarabs only", () => {
			expect(
				formatMetaDescription(
					[],
					["Divination Scarab", "Breach Scarab"],
					null,
				),
			).toBe("Divination Scarab, Breach Scarab");
		});

		it("formats scarabs with cost", () => {
			expect(
				formatMetaDescription(
					[],
					["Divination Scarab", "Breach Scarab"],
					45,
				),
			).toBe("Divination Scarab, Breach Scarab (45c)");
		});

		it("formats mechanics and scarabs with cost", () => {
			expect(
				formatMetaDescription(
					["delirium", "breach"],
					["Divination Scarab"],
					30.5,
				),
			).toBe("Delirium, Breach | Divination Scarab (30.5c)");
		});
	});

	describe("buildShareUrl", () => {
		it("builds correct share URL", () => {
			expect(buildShareUrl("https://example.com", "abc123")).toBe(
				"https://example.com/share/abc123",
			);
		});

		it("handles URL with path", () => {
			expect(
				buildShareUrl("https://example.com/some/path", "abc123"),
			).toBe("https://example.com/share/abc123");
		});
	});
});
