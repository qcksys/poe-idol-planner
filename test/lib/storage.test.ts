import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock localStorage before importing storage module
const localStorageMock = {
	store: {} as Record<string, string>,
	getItem: vi.fn((key: string) => localStorageMock.store[key] ?? null),
	setItem: vi.fn((key: string, value: string) => {
		localStorageMock.store[key] = value;
	}),
	removeItem: vi.fn((key: string) => {
		delete localStorageMock.store[key];
	}),
	clear: vi.fn(() => {
		localStorageMock.store = {};
	}),
};

vi.stubGlobal("localStorage", localStorageMock);

const { loadStorage } = await import("~/lib/storage");
const { STORAGE_VERSION } = await import("~/schemas/storage");

const {
	VALID_STORAGE_FIXTURE,
	createStorageFixture,
	createFixtureWithInvalidSet,
	createFixtureWithInvalidInventoryItem,
	createFixtureWithOrphanedPlacements,
	createFixtureWithInvalidPlacements,
	createFixtureWithWrongVersion,
	createFixtureWithInvalidActiveSetId,
} = await import("~test/fixtures/storage-fixtures");

describe("storage granular validation", () => {
	beforeEach(() => {
		localStorageMock.clear();
		vi.clearAllMocks();
	});

	afterEach(() => {
		localStorageMock.clear();
	});

	describe("valid storage", () => {
		it("loads valid storage with multiple sets without changes", () => {
			localStorageMock.store["poe-idol-planner-data"] = JSON.stringify(
				VALID_STORAGE_FIXTURE,
			);

			const result = loadStorage();

			expect(result.version).toBe(STORAGE_VERSION);
			expect(result.sets).toHaveLength(5);
			expect(result.activeSetId).toBe("set-delirium-ritual");

			// Verify set details
			expect(result.sets.map((s) => s.name)).toEqual([
				"Abyss Farmer",
				"Delirium Ritual",
				"Legion Full Juice",
				"Empty Template",
				"Harvest Expedition",
			]);
		});

		it("preserves all inventory items in valid storage", () => {
			localStorageMock.store["poe-idol-planner-data"] = JSON.stringify(
				VALID_STORAGE_FIXTURE,
			);

			const result = loadStorage();

			// Check Abyss Farmer set
			const abyssSet = result.sets.find(
				(s) => s.id === "set-abyss-focus",
			);
			expect(abyssSet?.inventory).toHaveLength(2);
			expect(abyssSet?.inventory[0].idol.baseType).toBe("conqueror");
			expect(abyssSet?.inventory[1].idol.baseType).toBe("kamasan");

			// Check Delirium Ritual set
			const deliriumSet = result.sets.find(
				(s) => s.id === "set-delirium-ritual",
			);
			expect(deliriumSet?.inventory).toHaveLength(3);
			expect(deliriumSet?.inventory.map((i) => i.source)).toEqual([
				"clipboard",
				"manual",
				"shared",
			]);
		});

		it("preserves all placements in valid storage", () => {
			localStorageMock.store["poe-idol-planner-data"] = JSON.stringify(
				VALID_STORAGE_FIXTURE,
			);

			const result = loadStorage();

			// Check Legion set with placements
			const legionSet = result.sets.find(
				(s) => s.id === "set-legion-full",
			);
			expect(legionSet?.placements).toHaveLength(1);
			expect(legionSet?.placements[0].inventoryIdolId).toBe(
				"inv-legion-1",
			);

			// Check empty set has no placements
			const emptySet = result.sets.find((s) => s.id === "set-empty");
			expect(emptySet?.placements).toHaveLength(0);
		});

		it("preserves map device configuration", () => {
			localStorageMock.store["poe-idol-planner-data"] = JSON.stringify(
				VALID_STORAGE_FIXTURE,
			);

			const result = loadStorage();

			// Check Legion set with all scarab slots filled
			const legionSet = result.sets.find(
				(s) => s.id === "set-legion-full",
			);
			expect(
				legionSet?.mapDevice.slots.filter((s) => s.scarabId),
			).toHaveLength(5);
			expect(legionSet?.mapDevice.craftingOptionId).toBe("domination");

			// Check empty set with no scarabs
			const emptySet = result.sets.find((s) => s.id === "set-empty");
			expect(
				emptySet?.mapDevice.slots.filter((s) => s.scarabId),
			).toHaveLength(0);
			expect(emptySet?.mapDevice.craftingOptionId).toBeNull();
		});

		it("preserves idol implicits", () => {
			localStorageMock.store["poe-idol-planner-data"] = JSON.stringify(
				VALID_STORAGE_FIXTURE,
			);

			const result = loadStorage();

			// Check Harvest set has idol with implicit
			const harvestSet = result.sets.find(
				(s) => s.id === "set-harvest-expedition",
			);
			const harvestIdol = harvestSet?.inventory.find(
				(i) => i.id === "inv-harvest-1",
			);
			expect(harvestIdol?.idol.implicit).toEqual({
				text: "8% increased Maps found in Area",
				value: 8,
			});
		});
	});

	describe("granular validation", () => {
		it("removes only invalid sets, keeping valid ones", () => {
			const fixture = createFixtureWithInvalidSet();
			localStorageMock.store["poe-idol-planner-data"] =
				JSON.stringify(fixture);

			const result = loadStorage();

			// Should have 5 valid sets (invalid one removed)
			expect(result.sets).toHaveLength(5);
			expect(result.sets.map((s) => s.name)).toEqual([
				"Abyss Farmer",
				"Delirium Ritual",
				"Legion Full Juice",
				"Empty Template",
				"Harvest Expedition",
			]);
		});

		it("removes only invalid inventory items within a set", () => {
			const fixture = createFixtureWithInvalidInventoryItem();
			localStorageMock.store["poe-idol-planner-data"] =
				JSON.stringify(fixture);

			const result = loadStorage();

			// First set should still have its 2 valid inventory items
			const abyssSet = result.sets.find(
				(s) => s.id === "set-abyss-focus",
			);
			expect(abyssSet?.inventory).toHaveLength(2);
			expect(abyssSet?.inventory.map((i) => i.id)).toEqual([
				"inv-abyss-1",
				"inv-abyss-2",
			]);
		});

		it("removes placements referencing invalid inventory items", () => {
			const fixture = createFixtureWithOrphanedPlacements();
			localStorageMock.store["poe-idol-planner-data"] =
				JSON.stringify(fixture);

			const result = loadStorage();

			// First set should have only 2 valid placements (orphaned one removed)
			const abyssSet = result.sets.find(
				(s) => s.id === "set-abyss-focus",
			);
			expect(abyssSet?.placements).toHaveLength(2);
			expect(abyssSet?.placements.map((p) => p.inventoryIdolId)).toEqual([
				"inv-abyss-1",
				"inv-abyss-2",
			]);
		});

		it("removes only invalid placements, keeping valid ones", () => {
			const fixture = createFixtureWithInvalidPlacements();
			localStorageMock.store["poe-idol-planner-data"] =
				JSON.stringify(fixture);

			const result = loadStorage();

			// First set should have only its 2 valid placements
			const abyssSet = result.sets.find(
				(s) => s.id === "set-abyss-focus",
			);
			expect(abyssSet?.placements).toHaveLength(2);
		});

		it("clears activeSetId if it references a removed set", () => {
			const fixture = createFixtureWithInvalidActiveSetId();
			localStorageMock.store["poe-idol-planner-data"] =
				JSON.stringify(fixture);

			const result = loadStorage();

			// activeSetId should be cleared since it references non-existent set
			expect(result.activeSetId).toBeNull();
			// All sets should still be present
			expect(result.sets).toHaveLength(5);
		});
	});

	describe("edge cases", () => {
		it("returns empty storage for wrong version", () => {
			const fixture = createFixtureWithWrongVersion();
			localStorageMock.store["poe-idol-planner-data"] =
				JSON.stringify(fixture);

			const result = loadStorage();

			expect(result.sets).toHaveLength(0);
			expect(result.activeSetId).toBeNull();
		});

		it("returns empty storage when localStorage is empty", () => {
			const result = loadStorage();

			expect(result.version).toBe(STORAGE_VERSION);
			expect(result.sets).toHaveLength(0);
			expect(result.activeSetId).toBeNull();
		});

		it("returns empty storage for invalid JSON", () => {
			localStorageMock.store["poe-idol-planner-data"] =
				"not valid json {{{";

			const result = loadStorage();

			expect(result.sets).toHaveLength(0);
		});

		it("handles storage with empty sets array", () => {
			const fixture = createStorageFixture({
				sets: [],
				activeSetId: null,
			});
			localStorageMock.store["poe-idol-planner-data"] =
				JSON.stringify(fixture);

			const result = loadStorage();

			expect(result.sets).toHaveLength(0);
			expect(result.activeSetId).toBeNull();
		});

		it("preserves unused inventory items (usageCount: 0)", () => {
			localStorageMock.store["poe-idol-planner-data"] = JSON.stringify(
				VALID_STORAGE_FIXTURE,
			);

			const result = loadStorage();

			// Legion set has an unused inventory item
			const legionSet = result.sets.find(
				(s) => s.id === "set-legion-full",
			);
			const unusedIdol = legionSet?.inventory.find(
				(i) => i.id === "inv-legion-unused",
			);
			expect(unusedIdol).toBeDefined();
			expect(unusedIdol?.usageCount).toBe(0);
		});
	});

	describe("complex scenarios", () => {
		it("handles multiple invalid items across different sets", () => {
			// Start with valid fixture
			const fixture = JSON.parse(JSON.stringify(VALID_STORAGE_FIXTURE));

			// Add invalid inventory to first set
			fixture.sets[0].inventory.push({
				id: "bad-inv",
				idol: "not an object",
				importedAt: "not a number",
				source: "invalid",
				usageCount: -5,
			});

			// Add orphaned placement to second set
			fixture.sets[1].placements.push({
				id: "orphan-p",
				inventoryIdolId: "does-not-exist",
				position: { x: 0, y: 0 },
			});

			// Add invalid set
			fixture.sets.push({
				id: "",
				name: "",
			});

			localStorageMock.store["poe-idol-planner-data"] =
				JSON.stringify(fixture);

			const result = loadStorage();

			// Should have 5 valid sets (invalid one removed)
			expect(result.sets).toHaveLength(5);

			// First set should have 2 valid inventory items
			const abyssSet = result.sets.find(
				(s) => s.id === "set-abyss-focus",
			);
			expect(abyssSet?.inventory).toHaveLength(2);

			// Second set should have 3 valid placements (orphan removed)
			const deliriumSet = result.sets.find(
				(s) => s.id === "set-delirium-ritual",
			);
			expect(deliriumSet?.placements).toHaveLength(3);
		});

		it("preserves data integrity across all idol types", () => {
			localStorageMock.store["poe-idol-planner-data"] = JSON.stringify(
				VALID_STORAGE_FIXTURE,
			);

			const result = loadStorage();

			// Collect all idol base types
			const allBaseTypes = result.sets.flatMap((s) =>
				s.inventory.map((i) => i.idol.baseType),
			);

			// Should have variety of idol types
			expect(allBaseTypes).toContain("conqueror");
			expect(allBaseTypes).toContain("kamasan");
			expect(allBaseTypes).toContain("burial");
			expect(allBaseTypes).toContain("noble");
			expect(allBaseTypes).toContain("totemic");
			expect(allBaseTypes).toContain("minor");
		});

		it("preserves modifier tiers and values", () => {
			localStorageMock.store["poe-idol-planner-data"] = JSON.stringify(
				VALID_STORAGE_FIXTURE,
			);

			const result = loadStorage();

			// Check Legion idol has multiple prefixes and suffixes
			const legionSet = result.sets.find(
				(s) => s.id === "set-legion-full",
			);
			const legionIdol = legionSet?.inventory.find(
				(i) => i.id === "inv-legion-1",
			);

			expect(legionIdol?.idol.prefixes).toHaveLength(2);
			expect(legionIdol?.idol.suffixes).toHaveLength(2);

			// Check tiers are preserved
			expect(legionIdol?.idol.prefixes[0].tier).toBe(1);
			expect(legionIdol?.idol.suffixes[1].tier).toBe(2);

			// Check values are preserved
			expect(legionIdol?.idol.prefixes[0].rolledValue).toBe(200);
		});
	});
});
