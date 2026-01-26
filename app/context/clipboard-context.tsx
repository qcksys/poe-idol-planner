import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useMemo,
	useState,
} from "react";
import type { IdolInstance } from "~/schemas/idol";

interface ClipboardContextValue {
	clipboardIdol: IdolInstance | null;
	copyToClipboard: (idol: IdolInstance) => void;
	clearClipboard: () => void;
}

const ClipboardContext = createContext<ClipboardContextValue | null>(null);

export function ClipboardProvider({ children }: { children: ReactNode }) {
	const [clipboardIdol, setClipboardIdol] = useState<IdolInstance | null>(
		null,
	);

	const copyToClipboard = useCallback((idol: IdolInstance) => {
		setClipboardIdol(idol);
	}, []);

	const clearClipboard = useCallback(() => {
		setClipboardIdol(null);
	}, []);

	const value = useMemo(
		() => ({
			clipboardIdol,
			copyToClipboard,
			clearClipboard,
		}),
		[clipboardIdol, copyToClipboard, clearClipboard],
	);

	return (
		<ClipboardContext.Provider value={value}>
			{children}
		</ClipboardContext.Provider>
	);
}

export function useClipboard(): ClipboardContextValue {
	const context = useContext(ClipboardContext);
	if (!context) {
		throw new Error("useClipboard must be used within a ClipboardProvider");
	}
	return context;
}
