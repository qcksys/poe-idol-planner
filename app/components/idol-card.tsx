import { Copy, X } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "~/components/ui/tooltip";
import { IDOL_BASES, type IdolBaseKey } from "~/data/idol-bases";
import { highlightNumbers } from "~/lib/highlight-numbers";
import { cn } from "~/lib/utils";
import type { IdolInstance, IdolModifier } from "~/schemas/idol";

interface IdolCardProps {
	idol: IdolInstance;
	className?: string;
	compact?: boolean;
	onClick?: () => void;
	showTooltip?: boolean;
}

function getRarityColor(rarity: IdolInstance["rarity"]): string {
	switch (rarity) {
		case "normal":
			return "border-rarity-normal";
		case "magic":
			return "border-rarity-magic";
		case "rare":
			return "border-rarity-rare";
		case "unique":
			return "border-rarity-unique";
		default:
			return "border-rarity-normal";
	}
}

function getRarityBg(rarity: IdolInstance["rarity"]): string {
	switch (rarity) {
		case "normal":
			return "bg-rarity-normal-bg";
		case "magic":
			return "bg-rarity-magic-bg";
		case "rare":
			return "bg-rarity-rare-bg";
		case "unique":
			return "bg-rarity-unique-bg";
		default:
			return "bg-rarity-normal-bg";
	}
}

function ModifierLine({ mod }: { mod: IdolModifier }) {
	return (
		<div className="text-sm">
			<span
				className={
					mod.type === "prefix"
						? "text-mod-prefix"
						: "text-mod-suffix"
				}
			>
				{highlightNumbers(mod.text)}
			</span>
		</div>
	);
}

function IdolCardContent({
	idol,
	compact,
}: {
	idol: IdolInstance;
	compact?: boolean;
}) {
	const base = IDOL_BASES[idol.baseType as IdolBaseKey];
	const allMods = [...idol.prefixes, ...idol.suffixes];

	return (
		<div className="space-y-1">
			<div className="flex items-center gap-1.5">
				<img
					src={base.image}
					alt=""
					className="h-5 w-5 object-contain"
				/>
				<span className="text-muted-foreground text-xs">
					{base.name}
				</span>
			</div>

			{idol.implicit && !compact && (
				<div className="border-border border-b pb-1 text-mod-implicit text-sm">
					{idol.implicit.text}
				</div>
			)}

			{compact ? (
				<div className="text-muted-foreground text-sm">
					{allMods.length} mod(s)
				</div>
			) : (
				<div className="space-y-0.5">
					{allMods.map((mod, index) => (
						<ModifierLine key={`${mod.modId}-${index}`} mod={mod} />
					))}
				</div>
			)}
		</div>
	);
}

export function IdolCard({
	idol,
	className,
	compact = false,
	onClick,
	showTooltip = true,
}: IdolCardProps) {
	const rarityColor = getRarityColor(idol.rarity);
	const rarityBg = getRarityBg(idol.rarity);
	const base = IDOL_BASES[idol.baseType as IdolBaseKey];

	const cardElement = (
		<Card
			className={cn(
				"cursor-pointer border-2 transition-all hover:scale-105",
				rarityColor,
				rarityBg,
				className,
			)}
			onClick={onClick}
		>
			<CardHeader className="px-2 pt-1.5 pb-0">
				<CardTitle className="font-medium text-sm">
					{idol.name || base.name}
				</CardTitle>
			</CardHeader>
			<CardContent className="p-2 pt-0.5">
				<IdolCardContent idol={idol} compact={compact} />
			</CardContent>
		</Card>
	);

	if (!showTooltip || !compact) {
		return cardElement;
	}

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>{cardElement}</TooltipTrigger>
				<TooltipContent
					side="right"
					className="max-w-xs border border-border bg-card text-card-foreground"
				>
					<IdolCardContent idol={idol} compact={false} />
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}

interface IdolCardMiniProps {
	idol: IdolInstance;
	cellSize?: number;
	onClick?: () => void;
	onRemove?: () => void;
	onCopy?: () => void;
	draggable?: boolean;
	onDragStart?: (e: React.DragEvent<HTMLButtonElement>) => void;
	onDragEnd?: (e: React.DragEvent<HTMLButtonElement>) => void;
}

export function IdolCardMini({
	idol,
	cellSize = 64,
	onClick,
	onRemove,
	onCopy,
	draggable = false,
	onDragStart,
	onDragEnd,
}: IdolCardMiniProps) {
	const base = IDOL_BASES[idol.baseType as IdolBaseKey];
	const rarityColor = getRarityColor(idol.rarity);
	const style = {
		width: `${base.width * cellSize}px`,
		height: `${base.height * cellSize}px`,
	};

	const handleRemove = (e: React.MouseEvent) => {
		e.stopPropagation();
		onRemove?.();
	};

	const handleCopy = (e: React.MouseEvent) => {
		e.stopPropagation();
		onCopy?.();
	};

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<button
						type="button"
						draggable={draggable}
						onDragStart={onDragStart}
						onDragEnd={onDragEnd}
						className={cn(
							"group/mini relative flex items-center justify-center overflow-hidden rounded border-2 transition-all hover:scale-105",
							draggable
								? "cursor-grab active:cursor-grabbing"
								: "cursor-pointer",
							rarityColor,
						)}
						style={style}
						onClick={onClick}
					>
						<img
							src={base.image}
							alt={base.name}
							className="absolute inset-0 h-full w-full object-cover"
						/>
						<div className="absolute top-0.5 right-0.5 flex gap-0.5 opacity-0 transition-opacity group-hover/mini:opacity-100">
							{onCopy && (
								<Button
									variant="secondary"
									size="icon"
									className="h-5 w-5"
									onClick={handleCopy}
								>
									<Copy className="h-3 w-3" />
								</Button>
							)}
							{onRemove && (
								<Button
									variant="destructive"
									size="icon"
									className="h-5 w-5"
									onClick={handleRemove}
								>
									<X className="h-3 w-3" />
								</Button>
							)}
						</div>
					</button>
				</TooltipTrigger>
				<TooltipContent
					side="right"
					className="max-w-xs border border-border bg-card text-card-foreground"
				>
					<IdolCardContent idol={idol} compact={false} />
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}
