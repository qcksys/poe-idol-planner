import type { StorageData } from "~/schemas/storage";

/**
 * Valid storage fixture with 5 varied idol sets:
 * - Abyss Farmer: 2 Abyss-focused idols, 2 scarabs, crafting option
 * - Delirium Ritual: Mixed mechanics (Delirium/Ritual), 4 scarabs
 * - Legion Full Juice: Legion idols with all 5 scarab slots filled
 * - Empty Template: Empty set (edge case)
 * - Harvest Expedition: Harvest + Expedition with implicit, 3 scarabs
 *
 * NOTE: All modIds must match actual entries in idol-modifiers.json
 * Pattern: {type}_{idolType}_{mechanic}_{modifierType}
 */
export const VALID_STORAGE_FIXTURE: StorageData = {
	version: 5,
	sets: [
		{
			id: "set-abyss-focus",
			name: "Abyss Farmer",
			createdAt: 1770468116997,
			updatedAt: 1770550916997,
			placements: [
				{
					id: "528u1trjnzx",
					inventoryIdolId: "inv-abyss-1",
					position: { x: 0, y: 0 },
				},
				{
					id: "4hjvll3y73m",
					inventoryIdolId: "inv-abyss-2",
					position: { x: 2, y: 0 },
				},
			],
			inventory: [
				{
					id: "inv-abyss-1",
					idol: {
						id: "071uawd5ms9f",
						baseType: "conqueror",
						itemLevel: 83,
						rarity: "rare",
						name: "Grim Effigy",
						prefixes: [
							{
								modId: "prefix_conqueror_increased_abyss_chance",
								type: "prefix",
								rolledValue: 224,
								tier: 1,
							},
						],
						suffixes: [
							{
								modId: "suffix_conqueror_abyss_trove_drop_scarab_chance",
								type: "suffix",
								rolledValue: 3,
								tier: 1,
							},
						],
					},
					importedAt: 1770468116997,
					source: "clipboard",
					usageCount: 1,
				},
				{
					id: "inv-abyss-2",
					idol: {
						id: "4pd8bhvtgwq",
						baseType: "kamasan",
						itemLevel: 75,
						rarity: "magic",
						prefixes: [
							{
								modId: "prefix_kamasan_increased_abyss_chance",
								type: "prefix",
								rolledValue: 45,
								tier: 1,
							},
						],
						suffixes: [],
					},
					importedAt: 1770482516997,
					source: "manual",
					usageCount: 1,
				},
			],
			mapDevice: {
				slots: [
					{ slotIndex: 0, scarabId: "abyss_scarab" },
					{ slotIndex: 1, scarabId: "abyss_scarab" },
					{ slotIndex: 2, scarabId: null },
					{ slotIndex: 3, scarabId: null },
					{ slotIndex: 4, scarabId: null },
				],
				craftingOptionId: "fortune",
			},
			unlockedConditions: [
				"tier16",
				"elderGuardian",
				"shaperGuardian",
				"atlas100",
				"atlas115",
				"atlas20",
				"atlas60",
				"elderShaper",
				"maven",
				"eaterOfWorlds",
				"searingExarch",
				"shaper",
			],
		},
		{
			id: "set-delirium-ritual",
			name: "Delirium Ritual",
			createdAt: 1770381716997,
			updatedAt: 1770547316997,
			placements: [
				{
					id: "l512q25dfdp",
					inventoryIdolId: "inv-delirium-burial",
					position: { x: 0, y: 0 },
				},
				{
					id: "bxkn3fab0ym",
					inventoryIdolId: "inv-delirium-1",
					position: { x: 1, y: 2 },
				},
				{
					id: "pdj1q5jgye8",
					inventoryIdolId: "inv-mixed-1",
					position: { x: 3, y: 0 },
				},
			],
			inventory: [
				{
					id: "inv-delirium-burial",
					idol: {
						id: "0yl7xxnbrt3",
						baseType: "burial",
						itemLevel: 85,
						rarity: "rare",
						name: "Doom Idol",
						prefixes: [
							{
								modId: "prefix_burial_delirium_increased_chance",
								type: "prefix",
								rolledValue: 150,
								tier: 1,
							},
							{
								modId: "prefix_burial_delirium_additional_chance",
								type: "prefix",
								rolledValue: 40,
								tier: 1,
							},
						],
						suffixes: [
							{
								modId: "suffix_burial_delirium_additional_delirium_orb_chance",
								type: "suffix",
								rolledValue: 5,
								tier: 1,
							},
						],
					},
					importedAt: 1770381716997,
					source: "clipboard",
					usageCount: 1,
				},
				{
					id: "inv-delirium-1",
					idol: {
						id: "nk5zqivahxj",
						baseType: "noble",
						itemLevel: 80,
						rarity: "magic",
						prefixes: [
							{
								modId: "prefix_noble_delirium_increased_chance",
								type: "prefix",
								rolledValue: 80,
								tier: 1,
							},
						],
						suffixes: [
							{
								modId: "suffix_noble_delirium_secondary_wave_acceleration",
								type: "suffix",
								rolledValue: 15,
								tier: 1,
							},
						],
					},
					importedAt: 1770410516997,
					source: "manual",
					usageCount: 1,
				},
				{
					id: "inv-mixed-1",
					idol: {
						id: "76jgnx84qfa",
						baseType: "totemic",
						itemLevel: 72,
						rarity: "rare",
						name: "Spirit Charm",
						prefixes: [
							{
								modId: "prefix_totemic_ritual_increased_chance",
								type: "prefix",
								rolledValue: 60,
								tier: 1,
							},
						],
						suffixes: [
							{
								modId: "suffix_totemic_ritual_increased_tribute",
								type: "suffix",
								rolledValue: 10,
								tier: 1,
							},
						],
					},
					importedAt: 1770454516997,
					source: "shared",
					usageCount: 1,
				},
			],
			mapDevice: {
				slots: [
					{ slotIndex: 0, scarabId: "delirium_scarab" },
					{ slotIndex: 1, scarabId: "delirium_scarab" },
					{ slotIndex: 2, scarabId: "ritual_scarab" },
					{ slotIndex: 3, scarabId: "ritual_scarab" },
					{ slotIndex: 4, scarabId: null },
				],
				craftingOptionId: "anarchy",
			},
			unlockedConditions: [
				"tier16",
				"atlas100",
				"atlas20",
				"atlas60",
				"maven",
				"shaper",
			],
		},
		{
			id: "set-legion-full",
			name: "Legion Full Juice",
			createdAt: 1770295316997,
			updatedAt: 1770554516997,
			placements: [
				{
					id: "7oplv2qgz1x",
					inventoryIdolId: "inv-legion-1",
					position: { x: 0, y: 0 },
				},
			],
			inventory: [
				{
					id: "inv-legion-1",
					idol: {
						id: "h3nv8ap3mqr",
						baseType: "conqueror",
						itemLevel: 86,
						rarity: "rare",
						name: "War Monument",
						prefixes: [
							{
								modId: "prefix_conqueror_legion_increased_chance",
								type: "prefix",
								rolledValue: 200,
								tier: 1,
							},
							{
								modId: "prefix_conqueror_legion_additional_chance",
								type: "prefix",
								rolledValue: 60,
								tier: 1,
							},
						],
						suffixes: [
							{
								modId: "suffix_conqueror_legion_additional_num_sergeants",
								type: "suffix",
								rolledValue: 2,
								tier: 1,
							},
							{
								modId: "suffix_conqueror_legion_spawn_both_generals",
								type: "suffix",
								rolledValue: 25,
								tier: 2,
							},
						],
					},
					importedAt: 1770295316997,
					source: "clipboard",
					usageCount: 1,
				},
				{
					id: "inv-legion-unused",
					idol: {
						id: "pj375nqkj8",
						baseType: "minor",
						itemLevel: 68,
						rarity: "magic",
						prefixes: [
							{
								modId: "prefix_minor_legion_increased_chance",
								type: "prefix",
								rolledValue: 90,
								tier: 1,
							},
						],
						suffixes: [],
					},
					importedAt: 1770354516997,
					source: "manual",
					usageCount: 0,
				},
			],
			mapDevice: {
				slots: [
					{ slotIndex: 0, scarabId: "legion_scarab" },
					{ slotIndex: 1, scarabId: "legion_scarab" },
					{ slotIndex: 2, scarabId: "divination_scarab" },
					{ slotIndex: 3, scarabId: "cartography_scarab" },
					{ slotIndex: 4, scarabId: "ambush_scarab" },
				],
				craftingOptionId: "domination",
			},
			unlockedConditions: [
				"tier16",
				"elderGuardian",
				"shaperGuardian",
				"atlas100",
				"atlas115",
				"atlas20",
				"atlas60",
				"elderShaper",
				"maven",
				"eaterOfWorlds",
				"searingExarch",
				"shaper",
			],
		},
		{
			id: "set-empty",
			name: "Empty Template",
			createdAt: 1770254516997,
			updatedAt: 1770254516997,
			placements: [],
			inventory: [],
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
			unlockedConditions: ["tier16", "atlas20"],
		},
		{
			id: "set-harvest-expedition",
			name: "Harvest Expedition",
			createdAt: 1770154516997,
			updatedAt: 1770504516997,
			placements: [
				{
					id: "16g5t3xznsv",
					inventoryIdolId: "inv-harvest-1",
					position: { x: 0, y: 0 },
				},
				{
					id: "097jxbh6bcbg",
					inventoryIdolId: "inv-expedition-1",
					position: { x: 2, y: 1 },
				},
			],
			inventory: [
				{
					id: "inv-harvest-1",
					idol: {
						id: "5hy7baj9afg",
						baseType: "burial",
						itemLevel: 84,
						rarity: "rare",
						name: "Growth Effigy",
						implicit: {
							text: "8% increased Maps found in Area",
							value: 8,
						},
						prefixes: [
							{
								modId: "prefix_burial_harvest_increased_chance",
								type: "prefix",
								rolledValue: 140,
								tier: 1,
							},
						],
						suffixes: [
							{
								modId: "suffix_burial_harvest_additional_plot_chance",
								type: "suffix",
								rolledValue: 12,
								tier: 1,
							},
						],
					},
					importedAt: 1770154516997,
					source: "clipboard",
					usageCount: 1,
				},
				{
					id: "inv-expedition-1",
					idol: {
						id: "vfia931bcd",
						baseType: "kamasan",
						itemLevel: 78,
						rarity: "rare",
						name: "Explorer Token",
						prefixes: [
							{
								modId: "prefix_kamasan_expedition_increased_chance",
								type: "prefix",
								rolledValue: 50,
								tier: 1,
							},
						],
						suffixes: [
							{
								modId: "suffix_kamasan_expedition_artifact_quantity",
								type: "suffix",
								rolledValue: 20,
								tier: 1,
							},
						],
					},
					importedAt: 1770204516997,
					source: "shared",
					usageCount: 1,
				},
			],
			mapDevice: {
				slots: [
					{ slotIndex: 0, scarabId: "harvest_scarab" },
					{ slotIndex: 1, scarabId: "expedition_scarab" },
					{ slotIndex: 2, scarabId: "expedition_scarab" },
					{ slotIndex: 3, scarabId: null },
					{ slotIndex: 4, scarabId: null },
				],
				craftingOptionId: "beyond",
			},
			unlockedConditions: [
				"tier16",
				"elderGuardian",
				"atlas100",
				"atlas115",
				"atlas20",
				"atlas60",
				"maven",
				"eaterOfWorlds",
			],
		},
	],
	activeSetId: "set-delirium-ritual",
};

/**
 * Creates a deep copy of the valid fixture with optional modifications
 */
export function createStorageFixture(
	overrides?: Partial<StorageData>,
): StorageData {
	const base = JSON.parse(JSON.stringify(VALID_STORAGE_FIXTURE));
	return { ...base, ...overrides };
}

/**
 * Creates a storage fixture with one invalid set among valid ones
 */
export function createFixtureWithInvalidSet(): unknown {
	const fixture = createStorageFixture();
	// Insert an invalid set (missing required fields)
	(fixture.sets as unknown[]).splice(2, 0, {
		id: "",
		name: "Invalid Set",
	});
	return fixture;
}

/**
 * Creates a storage fixture with one invalid inventory item
 */
export function createFixtureWithInvalidInventoryItem(): unknown {
	const fixture = createStorageFixture();
	// Add invalid inventory item to first set
	(fixture.sets[0].inventory as unknown[]).push({
		id: "invalid-inv",
		idol: null, // Invalid - idol should be an object
		importedAt: Date.now(),
		source: "invalid_source", // Invalid source
		usageCount: -1, // Invalid - should be >= 0
	});
	return fixture;
}

/**
 * Creates a storage fixture with orphaned placements
 */
export function createFixtureWithOrphanedPlacements(): StorageData {
	const fixture = createStorageFixture();
	// Add placement referencing non-existent inventory
	fixture.sets[0].placements.push({
		id: "orphaned-placement",
		inventoryIdolId: "non-existent-inv-id",
		position: { x: 4, y: 4 },
	});
	return fixture;
}

/**
 * Creates a storage fixture with invalid placements
 */
export function createFixtureWithInvalidPlacements(): unknown {
	const fixture = createStorageFixture();
	// Add invalid placement (empty id)
	(fixture.sets[0].placements as unknown[]).push({
		id: "",
		inventoryIdolId: fixture.sets[0].inventory[0].id,
		position: { x: 5, y: 5 },
	});
	return fixture;
}

/**
 * Creates a storage fixture with wrong version
 */
export function createFixtureWithWrongVersion(): unknown {
	const fixture = createStorageFixture();
	(fixture as { version: number }).version = 999;
	return fixture;
}

/**
 * Creates a storage fixture with activeSetId referencing invalid set
 */
export function createFixtureWithInvalidActiveSetId(): unknown {
	const fixture = createStorageFixture();
	fixture.activeSetId = "non-existent-set-id";
	return fixture;
}
