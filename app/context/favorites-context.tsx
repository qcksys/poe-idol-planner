import { createContext, type ReactNode, useCallback, useContext } from "react";
import { useStorageState } from "~/hooks/use-storage-state";
import { loadFavorites, saveFavorites } from "~/lib/favorites";

interface FavoritesContextValue {
	favorites: string[];
	isHydrated: boolean;
	addFavorite: (modId: string) => void;
	removeFavorite: (modId: string) => void;
	toggleFavorite: (modId: string) => void;
	isFavorite: (modId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
	const [favorites, setFavorites, isHydrated] = useStorageState(
		loadFavorites,
		saveFavorites,
		[],
	);

	const addFavorite = useCallback(
		(modId: string) => {
			setFavorites((prev) => {
				if (prev.includes(modId)) return prev;
				return [...prev, modId];
			});
		},
		[setFavorites],
	);

	const removeFavorite = useCallback(
		(modId: string) => {
			setFavorites((prev) => prev.filter((id) => id !== modId));
		},
		[setFavorites],
	);

	const toggleFavorite = useCallback(
		(modId: string) => {
			setFavorites((prev) => {
				if (prev.includes(modId)) {
					return prev.filter((id) => id !== modId);
				}
				return [...prev, modId];
			});
		},
		[setFavorites],
	);

	const isFavorite = useCallback(
		(modId: string) => favorites.includes(modId),
		[favorites],
	);

	return (
		<FavoritesContext.Provider
			value={{
				favorites,
				isHydrated,
				addFavorite,
				removeFavorite,
				toggleFavorite,
				isFavorite,
			}}
		>
			{children}
		</FavoritesContext.Provider>
	);
}

export function useFavorites(): FavoritesContextValue {
	const context = useContext(FavoritesContext);
	if (!context) {
		throw new Error("useFavorites must be used within a FavoritesProvider");
	}
	return context;
}
