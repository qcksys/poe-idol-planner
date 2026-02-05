import { describe, expect, it } from "vitest";
import { computeSetHash, findDuplicateSet } from "~/lib/set-hash";
import type { IdolSet } from "~/schemas/idol-set";
import type { InventoryIdol } from "~/schemas/inventory";

function createTestIdol(overrides: Partial<InventoryIdol> = {}): InventoryIdol {
	return {
		id: "inv-1",
		idol: {
			id: "idol-1",
			baseType: "minor",
			itemLevel: 80,
			rarity: "rare",
			prefixes: [
				{
					modId: "prefix_abyss_1",
					type: "prefix",
					rolledValue: 10,
					tier: 1,
				},
			],
			suffixes: [
				{
					modId: "suffix_breach_1",
					type: "suffix",
					rolledValue: 5,
					tier: 2,
				},
			],
		},
		importedAt: Date.now(),
		source: "clipboard",
		usageCount: 0,
		...overrides,
	};
}

function createTestSet(overrides: Partial<IdolSet> = {}): IdolSet {
	const inventory = overrides.inventory ?? [createTestIdol()];
	return {
		id: "set-1",
		name: "Test Set",
		createdAt: Date.now(),
		updatedAt: Date.now(),
		placements: [
			{
				id: "placement-1",
				inventoryIdolId: inventory[0]?.id ?? "inv-1",
				position: { x: 0, y: 0 },
			},
		],
		inventory,
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
		unlockedConditions: ["condition_1", "condition_2"],
		...overrides,
	};
}

describe("computeSetHash", () => {
	it("returns the same hash for identical sets", () => {
		const set1 = createTestSet();
		const set2 = createTestSet();

		const hash1 = computeSetHash(set1);
		const hash2 = computeSetHash(set2);

		expect(hash1).toBe(hash2);
	});

	it("returns the same hash regardless of set name", () => {
		const set1 = createTestSet({ name: "Set A" });
		const set2 = createTestSet({ name: "Set B" });

		expect(computeSetHash(set1)).toBe(computeSetHash(set2));
	});

	it("returns the same hash regardless of IDs", () => {
		const idol1 = createTestIdol({ id: "different-id-1" });
		const idol2 = createTestIdol({ id: "different-id-2" });

		const set1 = createTestSet({
			id: "set-a",
			inventory: [idol1],
			placements: [
				{
					id: "placement-a",
					inventoryIdolId: idol1.id,
					position: { x: 0, y: 0 },
				},
			],
		});
		const set2 = createTestSet({
			id: "set-b",
			inventory: [idol2],
			placements: [
				{
					id: "placement-b",
					inventoryIdolId: idol2.id,
					position: { x: 0, y: 0 },
				},
			],
		});

		expect(computeSetHash(set1)).toBe(computeSetHash(set2));
	});

	it("returns the same hash regardless of timestamps", () => {
		const set1 = createTestSet({ createdAt: 1000, updatedAt: 2000 });
		const set2 = createTestSet({ createdAt: 3000, updatedAt: 4000 });

		expect(computeSetHash(set1)).toBe(computeSetHash(set2));
	});

	it("returns different hash for different idol base types", () => {
		const idol1 = createTestIdol();
		idol1.idol.baseType = "minor";

		const idol2 = createTestIdol();
		idol2.idol.baseType = "kamasan";

		const set1 = createTestSet({ inventory: [idol1] });
		const set2 = createTestSet({ inventory: [idol2] });

		expect(computeSetHash(set1)).not.toBe(computeSetHash(set2));
	});

	it("returns different hash for different placements", () => {
		const set1 = createTestSet({
			placements: [
				{
					id: "p1",
					inventoryIdolId: "inv-1",
					position: { x: 0, y: 0 },
				},
			],
		});
		const set2 = createTestSet({
			placements: [
				{
					id: "p1",
					inventoryIdolId: "inv-1",
					position: { x: 1, y: 1 },
				},
			],
		});

		expect(computeSetHash(set1)).not.toBe(computeSetHash(set2));
	});

	it("returns different hash for different map device configurations", () => {
		const set1 = createTestSet({
			mapDevice: {
				slots: [
					{ slotIndex: 0, scarabId: "scarab_1" },
					{ slotIndex: 1, scarabId: null },
					{ slotIndex: 2, scarabId: null },
					{ slotIndex: 3, scarabId: null },
					{ slotIndex: 4, scarabId: null },
				],
				craftingOptionId: null,
			},
		});
		const set2 = createTestSet({
			mapDevice: {
				slots: [
					{ slotIndex: 0, scarabId: "scarab_2" },
					{ slotIndex: 1, scarabId: null },
					{ slotIndex: 2, scarabId: null },
					{ slotIndex: 3, scarabId: null },
					{ slotIndex: 4, scarabId: null },
				],
				craftingOptionId: null,
			},
		});

		expect(computeSetHash(set1)).not.toBe(computeSetHash(set2));
	});

	it("returns different hash for different unlocked conditions", () => {
		const set1 = createTestSet({ unlockedConditions: ["condition_1"] });
		const set2 = createTestSet({
			unlockedConditions: ["condition_1", "condition_2"],
		});

		expect(computeSetHash(set1)).not.toBe(computeSetHash(set2));
	});

	it("returns same hash regardless of modifier order in prefixes/suffixes", () => {
		const idol1 = createTestIdol();
		idol1.idol.prefixes = [
			{ modId: "prefix_a", type: "prefix", rolledValue: 10, tier: 1 },
			{ modId: "prefix_b", type: "prefix", rolledValue: 5, tier: 2 },
		];

		const idol2 = createTestIdol();
		idol2.idol.prefixes = [
			{ modId: "prefix_b", type: "prefix", rolledValue: 5, tier: 2 },
			{ modId: "prefix_a", type: "prefix", rolledValue: 10, tier: 1 },
		];

		const set1 = createTestSet({ inventory: [idol1] });
		const set2 = createTestSet({ inventory: [idol2] });

		expect(computeSetHash(set1)).toBe(computeSetHash(set2));
	});
});

describe("findDuplicateSet", () => {
	it("returns null when no duplicate exists", () => {
		const incoming = createTestSet();
		const existing = [
			createTestSet({
				inventory: [
					createTestIdol({
						idol: {
							...createTestIdol().idol,
							baseType: "kamasan",
						},
					}),
				],
			}),
		];

		expect(findDuplicateSet(incoming, existing)).toBeNull();
	});

	it("returns the matching set when duplicate exists", () => {
		const incoming = createTestSet({ name: "Incoming Set" });
		const duplicate = createTestSet({ name: "Existing Duplicate" });
		const other = createTestSet({
			inventory: [
				createTestIdol({
					idol: {
						...createTestIdol().idol,
						baseType: "kamasan",
					},
				}),
			],
		});

		const existing = [other, duplicate];

		const result = findDuplicateSet(incoming, existing);
		expect(result).toBe(duplicate);
	});

	it("uses cached contentHash when available", () => {
		const incoming = createTestSet();
		const incomingHash = computeSetHash(incoming);

		const existingWithHash = createTestSet({ name: "With Hash" });
		existingWithHash.contentHash = incomingHash;

		const result = findDuplicateSet(incoming, [existingWithHash]);
		expect(result).toBe(existingWithHash);
	});

	it("computes hash for existing sets without contentHash", () => {
		const incoming = createTestSet();
		const existingWithoutHash = createTestSet({ name: "Without Hash" });
		delete existingWithoutHash.contentHash;

		const result = findDuplicateSet(incoming, [existingWithoutHash]);
		expect(result).toBe(existingWithoutHash);
	});
});
