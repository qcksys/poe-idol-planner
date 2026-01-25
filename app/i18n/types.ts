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
		search: string;
		clear: string;
		usedInSets: string;
		removeFromInventory: string;
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
		searchAll: string;
		openTrade: string;
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
	mechanics: Record<string, string>;
}

export type TranslationKey = keyof Translations;
