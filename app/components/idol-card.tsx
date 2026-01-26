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
			return "border-gray-400";
		case "magic":
			return "border-blue-500";
		case "rare":
			return "border-yellow-500";
		case "unique":
			return "border-orange-500";
		default:
			return "border-gray-400";
	}
}

function getRarityBg(rarity: IdolInstance["rarity"]): string {
	switch (rarity) {
		case "normal":
			return "bg-muted/50";
		case "magic":
			return "bg-blue-500/10 dark:bg-blue-900/30";
		case "rare":
			return "bg-yellow-500/10 dark:bg-yellow-900/30";
		case "unique":
			return "bg-orange-500/10 dark:bg-orange-900/30";
		default:
			return "bg-muted/50";
	}
}

function ModifierLine({ mod }: { mod: IdolModifier }) {
	return (
		<div className="text-sm">
			<span
				className={
					mod.type === "prefix"
						? "text-blue-700 dark:text-blue-300"
						: "text-green-700 dark:text-green-300"
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
				<div className="border-border border-b pb-1 text-purple-700 text-sm dark:text-purple-300">
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
	draggable?: boolean;
	onDragStart?: (e: React.DragEvent<HTMLButtonElement>) => void;
	onDragEnd?: (e: React.DragEvent<HTMLButtonElement>) => void;
}

export function IdolCardMini({
	idol,
	cellSize = 64,
	onClick,
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
							"relative flex items-center justify-center overflow-hidden rounded border-2 transition-all hover:scale-105",
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
