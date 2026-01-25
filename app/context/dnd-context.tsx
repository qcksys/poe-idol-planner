import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useState,
} from "react";
import type { InventoryIdol } from "~/schemas/inventory";

interface DragSource {
	inventoryIdol: InventoryIdol;
	placementId?: string;
}

interface DndContextValue {
	draggedItem: InventoryIdol | null;
	sourcePlacementId: string | null;
	setDraggedItem: (item: InventoryIdol | null, placementId?: string) => void;
	isDragging: boolean;
}

const DndContext = createContext<DndContextValue | null>(null);

export function DndProvider({ children }: { children: ReactNode }) {
	const [dragSource, setDragSource] = useState<DragSource | null>(null);

	const setDraggedItem = useCallback(
		(item: InventoryIdol | null, placementId?: string) => {
			if (item) {
				setDragSource({ inventoryIdol: item, placementId });
			} else {
				setDragSource(null);
			}
		},
		[],
	);

	return (
		<DndContext.Provider
			value={{
				draggedItem: dragSource?.inventoryIdol ?? null,
				sourcePlacementId: dragSource?.placementId ?? null,
				setDraggedItem,
				isDragging: dragSource !== null,
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
