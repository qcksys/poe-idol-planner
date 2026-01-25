export const SUPPORTED_LOCALES = [
	"en",
	"zh-TW",
	"zh-CN",
	"ko",
	"ja",
	"ru",
	"pt-BR",
	"de",
	"fr",
	"es",
] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = "en";

export interface Translations {
	app: {
		title: string;
		subtitle: string;
	};
	nav: {
		planner: string;
		inventory: string;
		sets: string;
		changelog: string;
	};
	idolSet: {
		newSet: string;
		rename: string;
		delete: string;
		duplicate: string;
		confirmDelete: string;
		defaultName: string;
	};
	inventory: {
		title: string;
		empty: string;
		import: string;
		create: string;
		search: string;
		clear: string;
		usedInSets: string;
		removeFromInventory: string;
		noMatches: string;
	};
	grid: {
		tab1: string;
		tab2: string;
		tab3: string;
		dropHere: string;
		removeFromGrid: string;
	};
	actions: {
		import: string;
		export: string;
		share: string;
		search: string;
		clear: string;
		cancel: string;
		confirm: string;
		save: string;
		copy: string;
		copied: string;
	};
	stats: {
		totalStats: string;
		byMechanic: string;
		noStats: string;
	};
	trade: {
		findSimilar: string;
		findThisMod: string;
		searchAll: string;
		openTrade: string;
		searchBaseType: string;
	};
	import: {
		title: string;
		description: string;
		pasteHere: string;
		placeholder: string;
		howTo: string;
		ctrlC: string;
		ctrlAltC: string;
		pasteFromClipboard: string;
		detected: string;
		simpleFormat: string;
		advancedFormat: string;
		parseError: string;
		success: string;
		importButton: string;
	};
	share: {
		title: string;
		description: string;
		linkCopied: string;
		loading: string;
		error: string;
	};
	errors: {
		invalidIdol: string;
		parseError: string;
		storageError: string;
		networkError: string;
	};
	editor: {
		createIdol: string;
		editIdol: string;
		description: string;
		baseType: string;
		itemLevel: string;
		name: string;
		optional: string;
		namePlaceholder: string;
		filterByMechanic: string;
		prefixes: string;
		suffixes: string;
		tier: string;
		selectMod: string;
		searchMods: string;
		noModsFound: string;
		searchMechanic: string;
		noMechanicsFound: string;
		allMechanics: string;
	};
	filter: {
		mechanic: string;
		allMechanics: string;
		type: string;
		allTypes: string;
		prefixOnly: string;
		suffixOnly: string;
	};
	mechanics: Record<string, string>;
}

export type TranslationKey = keyof Translations;
