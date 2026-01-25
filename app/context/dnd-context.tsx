import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useState,
} from "react";
import type { InventoryIdol } from "~/schemas/inventory";

interface DndContextValue {
	draggedItem: InventoryIdol | null;
	setDraggedItem: (item: InventoryIdol | null) => void;
	isDragging: boolean;
}

const DndContext = createContext<DndContextValue | null>(null);

export function DndProvider({ children }: { children: ReactNode }) {
	const [draggedItem, setDraggedItemState] = useState<InventoryIdol | null>(
		null,
	);

	const setDraggedItem = useCallback((item: InventoryIdol | null) => {
		setDraggedItemState(item);
	}, []);

	return (
		<DndContext.Provider
			value={{
				draggedItem,
				setDraggedItem,
				isDragging: draggedItem !== null,
			}}
		>
			{children}
		</DndContext.Provider>
	);
}

export function useDnd(): DndContextValue {
	const context = useContext(DndContext);
	if (!context) {
		throw new Error("useDnd must be used within a DndProvider");
	}
	return context;
}
