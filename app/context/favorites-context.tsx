import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
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
	const [favorites, setFavorites] = useState<string[]>([]);
	const [isHydrated, setIsHydrated] = useState(false);

	// Load favorites on mount
	useEffect(() => {
		const stored = loadFavorites();
		setFavorites(stored);
		setIsHydrated(true);
	}, []);

	// Save favorites when they change (after hydration)
	useEffect(() => {
		if (isHydrated) {
			saveFavorites(favorites);
		}
	}, [favorites, isHydrated]);

	const addFavorite = useCallback((modId: string) => {
		setFavorites((prev) => {
			if (prev.includes(modId)) return prev;
			return [...prev, modId];
		});
	}, []);

	const removeFavorite = useCallback((modId: string) => {
		setFavorites((prev) => prev.filter((id) => id !== modId));
	}, []);

	const toggleFavorite = useCallback((modId: string) => {
		setFavorites((prev) => {
			if (prev.includes(modId)) {
				return prev.filter((id) => id !== modId);
			}
			return [...prev, modId];
		});
	}, []);

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
