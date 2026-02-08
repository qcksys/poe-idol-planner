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
const { createEmptyMapDevice } = await import("~/schemas/scarab");

interface TestInventoryItem {
	id: string;
	idol: {
		id: string;
		baseType: string;
		itemLevel: number;
		rarity: string;
		prefixes: unknown[];
		suffixes: unknown[];
	};
	importedAt: number;
	source: string;
	usageCount: number;
}

interface TestPlacement {
	id: string;
	inventoryIdolId: string;
	position: { x: number; y: number };
}

interface TestSet {
	id: string;
	name: string;
	createdAt: number;
	updatedAt: number;
	placements: TestPlacement[];
	inventory: TestInventoryItem[];
	mapDevice: ReturnType<typeof createEmptyMapDevice>;
	unlockedConditions: string[];
}

describe("storage granular validation", () => {
	beforeEach(() => {
		localStorageMock.clear();
		vi.clearAllMocks();
	});

	afterEach(() => {
		localStorageMock.clear();
	});

	const createValidSet = (id: string, name: string): TestSet => ({
		id,
		name,
		createdAt: Date.now(),
		updatedAt: Date.now(),
		placements: [],
		inventory: [],
		mapDevice: createEmptyMapDevice(),
		unlockedConditions: [],
	});

	const createValidInventoryItem = (id: string): TestInventoryItem => ({
		id,
		idol: {
			id: `idol-${id}`,
			baseType: "minor",
			itemLevel: 85,
			rarity: "rare",
			prefixes: [],
			suffixes: [],
		},
		importedAt: Date.now(),
		source: "clipboard",
		usageCount: 0,
	});

	const createValidPlacement = (
		id: string,
		inventoryIdolId: string,
		x: number,
		y: number,
	): TestPlacement => ({
		id,
		inventoryIdolId,
		position: { x, y },
	});

	it("loads valid storage without changes", () => {
		const validStorage = {
			version: STORAGE_VERSION,
			sets: [createValidSet("set1", "My Set")],
			activeSetId: "set1",
		};
		localStorageMock.store["poe-idol-planner-data"] =
			JSON.stringify(validStorage);

		const result = loadStorage();
		expect(result.sets).toHaveLength(1);
		expect(result.sets[0].id).toBe("set1");
		expect(result.activeSetId).toBe("set1");
	});

	it("removes only invalid sets, keeping valid ones", () => {
		const storage = {
			version: STORAGE_VERSION,
			sets: [
				createValidSet("set1", "Valid Set"),
				{ id: "", name: "Invalid - empty ID" }, // Invalid: empty id
				createValidSet("set3", "Another Valid"),
			],
			activeSetId: "set1",
		};
		localStorageMock.store["poe-idol-planner-data"] =
			JSON.stringify(storage);

		const result = loadStorage();
		expect(result.sets).toHaveLength(2);
		expect(result.sets.map((s) => s.id)).toEqual(["set1", "set3"]);
	});

	it("removes only invalid inventory items within a set", () => {
		const set = createValidSet("set1", "My Set");
		set.inventory = [
			createValidInventoryItem("inv1"),
			{ id: "", idol: null } as unknown as TestInventoryItem, // Invalid: empty id and null idol
			createValidInventoryItem("inv3"),
		];

		const storage = {
			version: STORAGE_VERSION,
			sets: [set],
			activeSetId: "set1",
		};
		localStorageMock.store["poe-idol-planner-data"] =
			JSON.stringify(storage);

		const result = loadStorage();
		expect(result.sets).toHaveLength(1);
		expect(result.sets[0].inventory).toHaveLength(2);
		expect(result.sets[0].inventory.map((i) => i.id)).toEqual([
			"inv1",
			"inv3",
		]);
	});

	it("removes placements referencing invalid inventory items", () => {
		const set = createValidSet("set1", "My Set");
		set.inventory = [createValidInventoryItem("inv1")];
		set.placements = [
			createValidPlacement("p1", "inv1", 0, 0), // Valid - references inv1
			createValidPlacement("p2", "inv-deleted", 1, 0), // Invalid - references non-existent
		];

		const storage = {
			version: STORAGE_VERSION,
			sets: [set],
			activeSetId: "set1",
		};
		localStorageMock.store["poe-idol-planner-data"] =
			JSON.stringify(storage);

		const result = loadStorage();
		expect(result.sets).toHaveLength(1);
		expect(result.sets[0].placements).toHaveLength(1);
		expect(result.sets[0].placements[0].inventoryIdolId).toBe("inv1");
	});

	it("removes only invalid placements, keeping valid ones", () => {
		const set = createValidSet("set1", "My Set");
		set.inventory = [
			createValidInventoryItem("inv1"),
			createValidInventoryItem("inv2"),
		];
		set.placements = [
			createValidPlacement("p1", "inv1", 0, 0), // Valid
			{ id: "", inventoryIdolId: "inv2", position: { x: 1, y: 0 } }, // Invalid: empty id
			createValidPlacement("p3", "inv2", 2, 0), // Valid
		];

		const storage = {
			version: STORAGE_VERSION,
			sets: [set],
			activeSetId: "set1",
		};
		localStorageMock.store["poe-idol-planner-data"] =
			JSON.stringify(storage);

		const result = loadStorage();
		expect(result.sets[0].placements).toHaveLength(2);
		expect(result.sets[0].placements.map((p) => p.id)).toEqual([
			"p1",
			"p3",
		]);
	});

	it("clears activeSetId if it references a removed set", () => {
		const storage = {
			version: STORAGE_VERSION,
			sets: [
				createValidSet("set1", "Valid Set"),
				{ id: "set2", name: "" }, // Invalid: empty name
			],
			activeSetId: "set2", // References the invalid set
		};
		localStorageMock.store["poe-idol-planner-data"] =
			JSON.stringify(storage);

		const result = loadStorage();
		expect(result.sets).toHaveLength(1);
		expect(result.sets[0].id).toBe("set1");
		expect(result.activeSetId).toBeNull();
	});

	it("returns empty storage when all data is invalid", () => {
		const storage = {
			version: STORAGE_VERSION,
			sets: [
				{ id: "", name: "Invalid1" },
				{ id: "set2", name: "" },
			],
			activeSetId: null,
		};
		localStorageMock.store["poe-idol-planner-data"] =
			JSON.stringify(storage);

		const result = loadStorage();
		expect(result.sets).toHaveLength(0);
		expect(result.activeSetId).toBeNull();
	});

	it("returns empty storage for wrong version", () => {
		const storage = {
			version: 999,
			sets: [createValidSet("set1", "My Set")],
			activeSetId: "set1",
		};
		localStorageMock.store["poe-idol-planner-data"] =
			JSON.stringify(storage);

		const result = loadStorage();
		expect(result.sets).toHaveLength(0);
	});

	it("handles complex scenario with multiple invalid items across sets", () => {
		const set1 = createValidSet("set1", "Set 1");
		set1.inventory = [
			createValidInventoryItem("inv1"),
			createValidInventoryItem("inv2"),
		];
		set1.placements = [
			createValidPlacement("p1", "inv1", 0, 0),
			createValidPlacement("p2", "inv2", 1, 0),
		];

		const set2 = createValidSet("set2", "Set 2");
		set2.inventory = [
			createValidInventoryItem("inv3"),
			{ id: "inv4", idol: "invalid" } as unknown as TestInventoryItem, // Invalid idol
		];
		set2.placements = [
			createValidPlacement("p3", "inv3", 0, 0),
			createValidPlacement("p4", "inv4", 1, 0), // References invalid inventory
		];

		const storage = {
			version: STORAGE_VERSION,
			sets: [set1, set2],
			activeSetId: "set1",
		};
		localStorageMock.store["poe-idol-planner-data"] =
			JSON.stringify(storage);

		const result = loadStorage();

		// Set 1 should be unchanged
		expect(result.sets[0].id).toBe("set1");
		expect(result.sets[0].inventory).toHaveLength(2);
		expect(result.sets[0].placements).toHaveLength(2);

		// Set 2 should have inv4 and p4 removed
		expect(result.sets[1].id).toBe("set2");
		expect(result.sets[1].inventory).toHaveLength(1);
		expect(result.sets[1].inventory[0].id).toBe("inv3");
		expect(result.sets[1].placements).toHaveLength(1);
		expect(result.sets[1].placements[0].id).toBe("p3");
	});
});
