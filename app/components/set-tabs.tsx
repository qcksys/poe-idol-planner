import { Copy, MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import { useTranslations } from "~/i18n";
import type { IdolSet } from "~/schemas/idol-set";

interface SetTabsProps {
	sets: IdolSet[];
	activeSetId: string | null;
	onSelectSet: (id: string) => void;
	onCreateSet: () => void;
	onRenameSet: (id: string, name: string) => void;
	onDuplicateSet: (id: string) => void;
	onDeleteSet: (id: string) => void;
}

export function SetTabs({
	sets,
	activeSetId,
	onSelectSet,
	onCreateSet,
	onRenameSet,
	onDuplicateSet,
	onDeleteSet,
}: SetTabsProps) {
	const t = useTranslations();
	const [renameDialogOpen, setRenameDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
	const [newName, setNewName] = useState("");

	const handleRenameClick = (set: IdolSet) => {
		setSelectedSetId(set.id);
		setNewName(set.name);
		setRenameDialogOpen(true);
	};

	const handleRenameConfirm = () => {
		if (selectedSetId && newName.trim()) {
			onRenameSet(selectedSetId, newName.trim());
		}
		setRenameDialogOpen(false);
		setSelectedSetId(null);
		setNewName("");
	};

	const handleDeleteClick = (setId: string) => {
		setSelectedSetId(setId);
		setDeleteDialogOpen(true);
	};

	const handleDeleteConfirm = () => {
		if (selectedSetId) {
			onDeleteSet(selectedSetId);
		}
		setDeleteDialogOpen(false);
		setSelectedSetId(null);
	};

	return (
		<>
			<div className="flex items-center gap-1 overflow-x-auto border-border border-b pb-2">
				{sets.map((set) => (
					<div key={set.id} className="group flex items-center">
						<Button
							variant={
								activeSetId === set.id ? "default" : "ghost"
							}
							size="sm"
							className="rounded-r-none"
							onClick={() => onSelectSet(set.id)}
						>
							{set.name}
						</Button>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant={
										activeSetId === set.id
											? "default"
											: "ghost"
									}
									size="sm"
									className="h-8 w-6 rounded-l-none px-1"
								>
									<MoreVertical className="h-3 w-3" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem
									onClick={() => handleRenameClick(set)}
								>
									<Pencil className="mr-2 h-4 w-4" />
									{t.idolSet.rename}
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => onDuplicateSet(set.id)}
								>
									<Copy className="mr-2 h-4 w-4" />
									{t.idolSet.duplicate}
								</DropdownMenuItem>
								<DropdownMenuItem
									className="text-red-400"
									onClick={() => handleDeleteClick(set.id)}
								>
									<Trash2 className="mr-2 h-4 w-4" />
									{t.idolSet.delete}
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				))}

				<Button variant="outline" size="sm" onClick={onCreateSet}>
					<Plus className="mr-1 h-4 w-4" />
					{t.idolSet.newSet}
				</Button>
			</div>

			<Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t.idolSet.rename}</DialogTitle>
					</DialogHeader>
					<Input
						value={newName}
						onChange={(e) => setNewName(e.target.value)}
						placeholder={t.idolSet.defaultName}
						onKeyDown={(e) =>
							e.key === "Enter" && handleRenameConfirm()
						}
					/>
					<DialogFooter>
						<Button
							variant="ghost"
							onClick={() => setRenameDialogOpen(false)}
						>
							{t.actions.cancel}
						</Button>
						<Button onClick={handleRenameConfirm}>
							{t.actions.save}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t.idolSet.delete}</DialogTitle>
						<DialogDescription>
							{t.idolSet.confirmDelete}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="ghost"
							onClick={() => setDeleteDialogOpen(false)}
						>
							{t.actions.cancel}
						</Button>
						<Button
							variant="destructive"
							onClick={handleDeleteConfirm}
						>
							{t.idolSet.delete}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
