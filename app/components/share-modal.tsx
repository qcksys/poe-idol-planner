import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { useTranslations } from "~/i18n";
import type { IdolSet } from "~/schemas/idol-set";
import type { InventoryIdol } from "~/schemas/inventory";

interface ShareModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	set: IdolSet | null;
	inventory: InventoryIdol[];
}

type ShareState =
	| { status: "idle" }
	| { status: "loading" }
	| { status: "success"; shareUrl: string }
	| { status: "error"; message: string };

export function ShareModal({
	open,
	onOpenChange,
	set,
	inventory,
}: ShareModalProps) {
	const t = useTranslations();
	const [shareState, setShareState] = useState<ShareState>({
		status: "idle",
	});
	const [copied, setCopied] = useState(false);

	const handleShare = async () => {
		if (!set) return;

		setShareState({ status: "loading" });

		try {
			const response = await fetch("/api/share", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ set, inventory }),
			});

			if (!response.ok) {
				const errorData = (await response.json().catch(() => ({}))) as {
					error?: string;
				};
				throw new Error(errorData.error || `HTTP ${response.status}`);
			}

			const data = (await response.json()) as { shareUrl: string };
			setShareState({ status: "success", shareUrl: data.shareUrl });
		} catch (error) {
			setShareState({
				status: "error",
				message:
					error instanceof Error
						? error.message
						: "Failed to create share link",
			});
		}
	};

	const handleCopy = async () => {
		if (shareState.status !== "success") return;

		try {
			await navigator.clipboard.writeText(shareState.shareUrl);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (error) {
			console.log({
				message: "Copy failed",
				error: error instanceof Error ? error.message : "Unknown error",
			});
		}
	};

	const handleClose = (newOpen: boolean) => {
		if (!newOpen) {
			setShareState({ status: "idle" });
			setCopied(false);
		}
		onOpenChange(newOpen);
	};

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="border-gray-800 bg-gray-900 sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="text-gray-100">
						{t.share.title}
					</DialogTitle>
					<DialogDescription className="text-gray-400">
						{t.share.description}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					{shareState.status === "idle" && set && (
						<div className="space-y-4">
							<div className="rounded-lg border border-gray-800 bg-gray-800/50 p-3">
								<p className="font-medium text-amber-500">
									{set.name}
								</p>
								<p className="text-gray-400 text-sm">
									{set.placements.length} placement
									{set.placements.length !== 1 && "s"}
								</p>
							</div>
							<Button
								onClick={handleShare}
								className="w-full bg-amber-600 text-white hover:bg-amber-700"
							>
								Generate Share Link
							</Button>
						</div>
					)}

					{shareState.status === "loading" && (
						<div className="flex flex-col items-center py-6">
							<div className="mb-3 h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
							<p className="text-gray-400 text-sm">
								{t.share.loading}
							</p>
						</div>
					)}

					{shareState.status === "success" && (
						<div className="space-y-3">
							<div className="flex gap-2">
								<Input
									readOnly
									value={shareState.shareUrl}
									className="flex-1 border-gray-700 bg-gray-800 text-gray-200"
								/>
								<Button
									onClick={handleCopy}
									variant="outline"
									className="shrink-0 border-gray-700 text-gray-200 hover:bg-gray-800"
								>
									{copied ? t.actions.copied : t.actions.copy}
								</Button>
							</div>
							<p className="text-center text-gray-500 text-xs">
								Link expires in 30 days
							</p>
						</div>
					)}

					{shareState.status === "error" && (
						<div className="space-y-3">
							<div className="rounded-lg border border-red-900/50 bg-red-950/30 p-3">
								<p className="text-red-400 text-sm">
									{shareState.message}
								</p>
							</div>
							<Button
								onClick={handleShare}
								variant="outline"
								className="w-full border-gray-700 text-gray-200 hover:bg-gray-800"
							>
								Try Again
							</Button>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
