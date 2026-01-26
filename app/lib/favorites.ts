import { z } from "zod";

const FAVORITES_KEY = "poe-idol-planner-favorite-mods";

const FavoritesSchema = z.object({
	modIds: z.array(z.string()),
});

type FavoritesData = z.infer<typeof FavoritesSchema>;

// Default favorite mods - valuable generic mods that most players want
// These IDs correspond to mods in idol-modifiers.json
export const DEFAULT_FAVORITE_MOD_PATTERNS = [
	"quantity", // Increased Quantity of Items found
	"rarity", // Increased Rarity of Items found
	"pack_size", // Increased Pack Size
	"magic_monster", // Additional Magic Monsters
	"rare_monster", // Additional Rare Monsters
];

export function loadFavorites(): string[] {
	if (typeof window === "undefined") return [];

	try {
		const stored = localStorage.getItem(FAVORITES_KEY);
		if (!stored) return [];

		const parsed = JSON.parse(stored);
		const result = FavoritesSchema.safeParse(parsed);
		if (result.success) {
			return result.data.modIds;
		}
	} catch {
		// Ignore parse errors
	}
	return [];
}

export function saveFavorites(modIds: string[]): void {
	if (typeof window === "undefined") return;

	const data: FavoritesData = { modIds };
	localStorage.setItem(FAVORITES_KEY, JSON.stringify(data));
}

export function addFavorite(modId: string): string[] {
	const current = loadFavorites();
	if (current.includes(modId)) return current;
	const updated = [...current, modId];
	saveFavorites(updated);
	return updated;
}

export function removeFavorite(modId: string): string[] {
	const current = loadFavorites();
	const updated = current.filter((id) => id !== modId);
	saveFavorites(updated);
	return updated;
}

export function toggleFavorite(modId: string): {
	favorites: string[];
	isFavorite: boolean;
} {
	const current = loadFavorites();
	const isFavorite = current.includes(modId);
	const updated = isFavorite
		? current.filter((id) => id !== modId)
		: [...current, modId];
	saveFavorites(updated);
	return { favorites: updated, isFavorite: !isFavorite };
}
