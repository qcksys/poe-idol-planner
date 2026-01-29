import { describe, expect, it } from "vitest";
import { parseIdolPage } from "../../scripts/poedb-idol-converter/parser";

const MINOR_IDOL_HTML = `
<!DOCTYPE html>
<html>
<head><title>Minor Idol</title></head>
<body>
<script>
$(function() { new ModsView({"baseitem":{"Code":"Minor Idol"},"normal":[
{"Name":"Abyssal","Level":"68","ModGenerationTypeID":"1","ModFamilyList":["MapRelicAdditionalAbyssChance"],"DropChance":2000,"str":"Your Maps have <span class='mod-value'>+(15—25)</span>% chance to contain an Abyss"},
{"Name":"Abyssal","Level":"68","ModGenerationTypeID":"1","ModFamilyList":["MapRelicIncreasedAbyssChance"],"DropChance":2000,"str":"Your Maps have <span class='mod-value'>(80—100)</span>% increased chance to contain an Abyss"},
{"Name":"of the Abyss","Level":"68","ModGenerationTypeID":"2","ModFamilyList":["MapRelicAbyssTroveItemRarity"],"DropChance":1000,"str":"<span class='mod-value'>(300—350)</span>% increased Rarity of Items Dropped by Abyssal Troves and Stygian Spires in your Maps"},
{"Name":"of Incursion","Level":"68","ModGenerationTypeID":"2","ModFamilyList":["MapRelicIncursionMonstersAreMagic"],"DropChance":1500,"str":"Incursions in your Maps have <span class='mod-value'>(10—15)</span>% chance for all Monsters to be at least Magic"},
{"Name":"Cartographer's","Level":"73","ModGenerationTypeID":"1","ModFamilyList":["MapRelicPackSize"],"DropChance":500,"str":"<span class='mod-value'>(2—3)</span>% increased Pack Size in your Maps"}
]}); });
</script>
</body>
</html>
`;

const CONQUEROR_IDOL_HTML = `
<!DOCTYPE html>
<html>
<head><title>Conqueror Idol</title></head>
<body>
<script>
$(function() { new ModsView({"baseitem":{"Code":"Conqueror Idol"},"normal":[
{"Name":"Abyssal","Level":"68","ModGenerationTypeID":"1","ModFamilyList":["MapRelicAdditionalAbyssChance"],"DropChance":2000,"str":"Your Maps have <span class='mod-value'>+(45—70)</span>% chance to contain an Abyss"},
{"Name":"of the Abyss","Level":"68","ModGenerationTypeID":"2","ModFamilyList":["MapRelicAbyssJewelsCorruptedExtraMods"],"DropChance":200,"str":"Abyss Jewels found in Abyssal Troves in your Maps have <span class='mod-value'>(15—25)</span>% chance to be Corrupted with <span class='mod-value'>(1—2)</span> additional Modifiers"},
{"Name":"General's","Level":"68","ModGenerationTypeID":"1","ModFamilyList":["MapRelicAdditionalLegionChance"],"DropChance":2000,"str":"Your Maps have <span class='mod-value'>+(45—70)</span>% chance to contain a Legion Encounter"},
{"Name":"Cartographer's","Level":"73","ModGenerationTypeID":"1","ModFamilyList":["MapRelicPackSize"],"DropChance":500,"str":"<span class='mod-value'>(4—6)</span>% increased Pack Size in your Maps"}
]}); });
</script>
</body>
</html>
`;

const EMPTY_MODS_HTML = `
<!DOCTYPE html>
<html>
<head><title>Empty Idol</title></head>
<body>
<script>
$(function() { new ModsView({"baseitem":{"Code":"Test Idol"},"normal":[]}); });
</script>
</body>
</html>
`;

const NO_MODSVIEW_HTML = `
<!DOCTYPE html>
<html>
<head><title>No ModsView</title></head>
<body>
<p>This page has no ModsView data</p>
</body>
</html>
`;

const MINOR_IDOL_WITH_UNIQUES_HTML = `
<!DOCTYPE html>
<html>
<head><title>Minor Idol</title></head>
<body>
<script>
$(function() { new ModsView({"baseitem":{"Code":"Minor Idol"},"normal":[
{"Name":"Abyssal","Level":"68","ModGenerationTypeID":"1","ModFamilyList":["MapRelicAdditionalAbyssChance"],"DropChance":2000,"str":"Your Maps have <span class='mod-value'>+(15—25)</span>% chance to contain an Abyss"}
]}); });
</script>
<h5 class="card-header"> Unique /2 </h5>
<div class="row row-cols-1 row-cols-lg-2 g-2">
<div class="col">
<div class="d-flex border-top rounded">
<div class="flex-shrink-0">
<a class="UniqueItems uniqueitem" data-hover="?s=Data%5CUniqueItems%2FEye+of+the+Djinn" href="Eye_of_the_Djinn">
<img loading="lazy" src="https://cdn.poedb.tw/image/Art/2DItems/Relics/2UniqueAtlasRelic1x1.webp" class="panel-item-icon"/>
</a>
</div>
<div class="flex-grow-1 ms-2">
<div>
<a class="uniqueitem" data-hover="?s=Data%5CUniqueItems%2FEye+of+the+Djinn" href="/us/Eye_of_the_Djinn">
<span class="uniqueName">Eye of the Djinn</span>
<span class="uniqueTypeLine">Minor Idol</span>
</a>
</div>
<div class="implicitMod"><span class='mod-value'>2</span>% increased Maps found in Area</div>
<div class="separator"></div>
<div class="explicitMod">Scarabs have <span class='mod-value'>50</span>% increased Effect on your Maps per empty Map Device slot</div>
</div>
</div>
</div>
<div class="col">
<div class="d-flex border-top rounded">
<div class="flex-shrink-0">
<a class="UniqueItems uniqueitem" href="Wellspring_of_Creation">
<img loading="lazy" src="https://cdn.poedb.tw/image/Art/2DItems/Relics/2UniqueAtlasRelic1x1.webp" class="panel-item-icon"/>
</a>
</div>
<div class="flex-grow-1 ms-2">
<div>
<a class="uniqueitem" href="/us/Wellspring_of_Creation">
<span class="uniqueName">Wellspring of Creation</span>
<span class="uniqueTypeLine">Minor Idol</span>
</a>
</div>
<div class="implicitMod"><span class='mod-value'>2</span>% increased Maps found in Area</div>
<div class="separator"></div>
<div class="explicitMod">Monsters in your Maps deal <span class='mod-value'>(25—30)</span>% less Damage</div>
<div class="explicitMod">Monsters in your Maps have <span class='mod-value'>(40—50)</span>% more Life</div>
<div class="explicitMod"><span class="item_description">(This modifier does not affect things that check the life of corpses)</span></div>
</div>
</div>
</div>
</div>
</body>
</html>
`;

const MULTILINE_MOD_HTML = `
<!DOCTYPE html>
<html>
<body>
<script>
$(function() { new ModsView({"baseitem":{"Code":"Minor Idol"},"normal":[
{"Name":"of Delirium","Level":"68","ModGenerationTypeID":"2","ModFamilyList":["MapRelicDeliriumRewardType"],"DropChance":1000,"str":"Delirium Encounters in your Maps have <span class='mod-value'>(15—25)</span>% increased chance for an additional Reward type<br/>Delirium Monsters in your Maps drop <span class='mod-value'>(10—15)</span>% increased Simulacrum Splinters"}
]}); });
</script>
</body>
</html>
`;

describe("poedb-converter parser", () => {
	describe("parseIdolPage", () => {
		describe("basic parsing", () => {
			it("parses Minor Idol page with modifiers", () => {
				const result = parseIdolPage(
					MINOR_IDOL_HTML,
					"en",
					"Minor_Idol",
				);

				expect(result.modifiers.length).toBe(5);
				expect(result.uniqueIdols.length).toBe(0);
			});

			it("parses Conqueror Idol page with modifiers", () => {
				const result = parseIdolPage(
					CONQUEROR_IDOL_HTML,
					"en",
					"Conqueror_Idol",
				);

				expect(result.modifiers.length).toBe(4);
			});

			it("sets correct idol source for each modifier", () => {
				const minorResult = parseIdolPage(
					MINOR_IDOL_HTML,
					"en",
					"Minor_Idol",
				);
				const conquerorResult = parseIdolPage(
					CONQUEROR_IDOL_HTML,
					"en",
					"Conqueror_Idol",
				);

				expect(
					minorResult.modifiers.every(
						(m) => m.idolSource === "Minor",
					),
				).toBe(true);
				expect(
					conquerorResult.modifiers.every(
						(m) => m.idolSource === "Conqueror",
					),
				).toBe(true);
			});
		});

		describe("modifier type detection", () => {
			it("identifies prefixes (ModGenerationTypeID=1)", () => {
				const result = parseIdolPage(
					MINOR_IDOL_HTML,
					"en",
					"Minor_Idol",
				);

				const prefixes = result.modifiers.filter(
					(m) => m.type === "prefix",
				);
				expect(prefixes.length).toBe(3);
				expect(prefixes.some((m) => m.name === "Abyssal")).toBe(true);
				expect(prefixes.some((m) => m.name === "Cartographer's")).toBe(
					true,
				);
			});

			it("identifies suffixes (ModGenerationTypeID=2)", () => {
				const result = parseIdolPage(
					MINOR_IDOL_HTML,
					"en",
					"Minor_Idol",
				);

				const suffixes = result.modifiers.filter(
					(m) => m.type === "suffix",
				);
				expect(suffixes.length).toBe(2);
				expect(suffixes.some((m) => m.name === "of the Abyss")).toBe(
					true,
				);
				expect(suffixes.some((m) => m.name === "of Incursion")).toBe(
					true,
				);
			});
		});

		describe("value extraction", () => {
			it("extracts single value range", () => {
				const result = parseIdolPage(
					MINOR_IDOL_HTML,
					"en",
					"Minor_Idol",
				);

				const abyssMod = result.modifiers.find(
					(m) => m.modFamily === "MapRelicAdditionalAbyssChance",
				);
				expect(abyssMod?.values).toEqual([{ min: 15, max: 25 }]);
			});

			it("extracts multiple value ranges from same mod", () => {
				const result = parseIdolPage(
					CONQUEROR_IDOL_HTML,
					"en",
					"Conqueror_Idol",
				);

				const corruptedMod = result.modifiers.find(
					(m) =>
						m.modFamily === "MapRelicAbyssJewelsCorruptedExtraMods",
				);
				expect(corruptedMod?.values).toEqual([
					{ min: 15, max: 25 },
					{ min: 1, max: 2 },
				]);
			});

			it("extracts different values for same mod family on different idols", () => {
				const minorResult = parseIdolPage(
					MINOR_IDOL_HTML,
					"en",
					"Minor_Idol",
				);
				const conquerorResult = parseIdolPage(
					CONQUEROR_IDOL_HTML,
					"en",
					"Conqueror_Idol",
				);

				const minorAbyss = minorResult.modifiers.find(
					(m) => m.modFamily === "MapRelicAdditionalAbyssChance",
				);
				const conquerorAbyss = conquerorResult.modifiers.find(
					(m) => m.modFamily === "MapRelicAdditionalAbyssChance",
				);

				expect(minorAbyss?.values).toEqual([{ min: 15, max: 25 }]);
				expect(conquerorAbyss?.values).toEqual([{ min: 45, max: 70 }]);
			});
		});

		describe("text normalization", () => {
			it("removes HTML span tags from mod text", () => {
				const result = parseIdolPage(
					MINOR_IDOL_HTML,
					"en",
					"Minor_Idol",
				);

				const abyssMod = result.modifiers.find(
					(m) => m.modFamily === "MapRelicAdditionalAbyssChance",
				);
				expect(abyssMod?.text).toBe(
					"Your Maps have +(15—25)% chance to contain an Abyss",
				);
				expect(abyssMod?.text).not.toContain("<span");
			});

			it("handles multiline mods with br tags", () => {
				const result = parseIdolPage(
					MULTILINE_MOD_HTML,
					"en",
					"Minor_Idol",
				);

				const deliriumMod = result.modifiers[0];
				expect(deliriumMod?.text).toContain(
					"Delirium Encounters in your Maps",
				);
				expect(deliriumMod?.text).toContain(
					"Delirium Monsters in your Maps",
				);
				expect(deliriumMod?.text).not.toContain("<br");
			});
		});

		describe("level requirement", () => {
			it("extracts level requirement from modifier", () => {
				const result = parseIdolPage(
					MINOR_IDOL_HTML,
					"en",
					"Minor_Idol",
				);

				const level68Mod = result.modifiers.find(
					(m) => m.modFamily === "MapRelicAdditionalAbyssChance",
				);
				const level73Mod = result.modifiers.find(
					(m) => m.modFamily === "MapRelicPackSize",
				);

				expect(level68Mod?.levelReq).toBe(68);
				expect(level73Mod?.levelReq).toBe(73);
			});
		});

		describe("weight/drop chance", () => {
			it("extracts drop chance as weight", () => {
				const result = parseIdolPage(
					MINOR_IDOL_HTML,
					"en",
					"Minor_Idol",
				);

				const highWeight = result.modifiers.find(
					(m) => m.modFamily === "MapRelicAdditionalAbyssChance",
				);
				const lowWeight = result.modifiers.find(
					(m) => m.modFamily === "MapRelicPackSize",
				);

				expect(highWeight?.weight).toBe(2000);
				expect(lowWeight?.weight).toBe(500);
			});
		});

		describe("mechanic detection", () => {
			it("detects abyss mechanic", () => {
				const result = parseIdolPage(
					MINOR_IDOL_HTML,
					"en",
					"Minor_Idol",
				);

				const abyssMod = result.modifiers.find(
					(m) => m.modFamily === "MapRelicAdditionalAbyssChance",
				);
				expect(abyssMod?.mechanic).toBe("abyss");
			});

			it("detects incursion mechanic", () => {
				const result = parseIdolPage(
					MINOR_IDOL_HTML,
					"en",
					"Minor_Idol",
				);

				const incursionMod = result.modifiers.find(
					(m) => m.modFamily === "MapRelicIncursionMonstersAreMagic",
				);
				expect(incursionMod?.mechanic).toBe("incursion");
			});

			it("detects legion mechanic", () => {
				const result = parseIdolPage(
					CONQUEROR_IDOL_HTML,
					"en",
					"Conqueror_Idol",
				);

				const legionMod = result.modifiers.find(
					(m) => m.modFamily === "MapRelicAdditionalLegionChance",
				);
				expect(legionMod?.mechanic).toBe("legion");
			});

			it("detects delirium mechanic", () => {
				const result = parseIdolPage(
					MULTILINE_MOD_HTML,
					"en",
					"Minor_Idol",
				);

				const deliriumMod = result.modifiers[0];
				expect(deliriumMod?.mechanic).toBe("delirium");
			});

			it("defaults to generic for pack size mods", () => {
				const result = parseIdolPage(
					MINOR_IDOL_HTML,
					"en",
					"Minor_Idol",
				);

				const packSizeMod = result.modifiers.find(
					(m) => m.modFamily === "MapRelicPackSize",
				);
				expect(packSizeMod?.mechanic).toBe("map");
			});
		});

		describe("mod family extraction", () => {
			it("extracts mod family from ModFamilyList", () => {
				const result = parseIdolPage(
					MINOR_IDOL_HTML,
					"en",
					"Minor_Idol",
				);

				const abyssMod = result.modifiers.find(
					(m) => m.name === "Abyssal",
				);
				expect(abyssMod?.modFamily).toBe(
					"MapRelicAdditionalAbyssChance",
				);
			});

			it("generates unique mod IDs using mod family", () => {
				const result = parseIdolPage(
					MINOR_IDOL_HTML,
					"en",
					"Minor_Idol",
				);

				const modIds = result.modifiers.map((m) => m.modId);
				const uniqueIds = new Set(modIds);
				expect(uniqueIds.size).toBe(modIds.length);
			});
		});

		describe("error handling", () => {
			it("returns empty modifiers for page without ModsView", () => {
				const result = parseIdolPage(
					NO_MODSVIEW_HTML,
					"en",
					"Minor_Idol",
				);

				expect(result.modifiers.length).toBe(0);
				expect(result.uniqueIdols.length).toBe(0);
			});

			it("returns empty modifiers for empty normal array", () => {
				const result = parseIdolPage(
					EMPTY_MODS_HTML,
					"en",
					"Minor_Idol",
				);

				expect(result.modifiers.length).toBe(0);
			});

			it("returns empty for unknown idol page", () => {
				const result = parseIdolPage(
					MINOR_IDOL_HTML,
					"en",
					"Unknown_Idol",
				);

				expect(result.modifiers.length).toBe(0);
			});
		});

		describe("unique idol parsing", () => {
			it("parses unique idols from page", () => {
				const result = parseIdolPage(
					MINOR_IDOL_WITH_UNIQUES_HTML,
					"en",
					"Minor_Idol",
				);

				expect(result.uniqueIdols.length).toBe(2);
			});

			it("extracts unique idol name", () => {
				const result = parseIdolPage(
					MINOR_IDOL_WITH_UNIQUES_HTML,
					"en",
					"Minor_Idol",
				);

				const djinn = result.uniqueIdols.find(
					(u) => u.id === "Eye_of_the_Djinn",
				);
				expect(djinn?.name.en).toBe("Eye of the Djinn");
			});

			it("extracts unique idol ID from href", () => {
				const result = parseIdolPage(
					MINOR_IDOL_WITH_UNIQUES_HTML,
					"en",
					"Minor_Idol",
				);

				const ids = result.uniqueIdols.map((u) => u.id);
				expect(ids).toContain("Eye_of_the_Djinn");
				expect(ids).toContain("Wellspring_of_Creation");
			});

			it("extracts base type from uniqueTypeLine", () => {
				const result = parseIdolPage(
					MINOR_IDOL_WITH_UNIQUES_HTML,
					"en",
					"Minor_Idol",
				);

				expect(
					result.uniqueIdols.every((u) => u.baseType === "Minor"),
				).toBe(true);
			});

			it("extracts implicit modifiers", () => {
				const result = parseIdolPage(
					MINOR_IDOL_WITH_UNIQUES_HTML,
					"en",
					"Minor_Idol",
				);

				const djinn = result.uniqueIdols.find(
					(u) => u.id === "Eye_of_the_Djinn",
				);
				expect(djinn?.modifiers[0]?.text.en).toBe(
					"2% increased Maps found in Area",
				);
			});

			it("extracts explicit modifiers", () => {
				const result = parseIdolPage(
					MINOR_IDOL_WITH_UNIQUES_HTML,
					"en",
					"Minor_Idol",
				);

				const djinn = result.uniqueIdols.find(
					(u) => u.id === "Eye_of_the_Djinn",
				);
				expect(djinn?.modifiers[1]?.text.en).toContain(
					"Scarabs have 50% increased Effect",
				);
			});

			it("extracts value ranges from unique idol mods", () => {
				const result = parseIdolPage(
					MINOR_IDOL_WITH_UNIQUES_HTML,
					"en",
					"Minor_Idol",
				);

				const wellspring = result.uniqueIdols.find(
					(u) => u.id === "Wellspring_of_Creation",
				);
				const damageMod = wellspring?.modifiers.find((m) =>
					m.text.en.includes("less Damage"),
				);
				expect(damageMod?.values).toEqual([{ min: 25, max: 30 }]);
			});

			it("skips item_description spans", () => {
				const result = parseIdolPage(
					MINOR_IDOL_WITH_UNIQUES_HTML,
					"en",
					"Minor_Idol",
				);

				const wellspring = result.uniqueIdols.find(
					(u) => u.id === "Wellspring_of_Creation",
				);
				const descriptionMod = wellspring?.modifiers.find((m) =>
					m.text.en.includes("corpses"),
				);
				expect(descriptionMod).toBeUndefined();
			});
		});

		describe("idol page mapping", () => {
			it("maps Minor_Idol to Minor type", () => {
				const result = parseIdolPage(
					MINOR_IDOL_HTML,
					"en",
					"Minor_Idol",
				);
				expect(result.modifiers[0]?.idolSource).toBe("Minor");
			});

			it("maps Noble_Idol to Noble type", () => {
				const html = MINOR_IDOL_HTML.replace(
					"Minor Idol",
					"Noble Idol",
				);
				const result = parseIdolPage(html, "en", "Noble_Idol");
				expect(result.modifiers[0]?.idolSource).toBe("Noble");
			});

			it("maps Kamasan_Idol to Kamasan type", () => {
				const html = MINOR_IDOL_HTML.replace(
					"Minor Idol",
					"Kamasan Idol",
				);
				const result = parseIdolPage(html, "en", "Kamasan_Idol");
				expect(result.modifiers[0]?.idolSource).toBe("Kamasan");
			});

			it("maps Burial_Idol to Burial type", () => {
				const html = MINOR_IDOL_HTML.replace(
					"Minor Idol",
					"Burial Idol",
				);
				const result = parseIdolPage(html, "en", "Burial_Idol");
				expect(result.modifiers[0]?.idolSource).toBe("Burial");
			});

			it("maps Totemic_Idol to Totemic type", () => {
				const html = MINOR_IDOL_HTML.replace(
					"Minor Idol",
					"Totemic Idol",
				);
				const result = parseIdolPage(html, "en", "Totemic_Idol");
				expect(result.modifiers[0]?.idolSource).toBe("Totemic");
			});

			it("maps Conqueror_Idol to Conqueror type", () => {
				const result = parseIdolPage(
					CONQUEROR_IDOL_HTML,
					"en",
					"Conqueror_Idol",
				);
				expect(result.modifiers[0]?.idolSource).toBe("Conqueror");
			});
		});
	});
});
