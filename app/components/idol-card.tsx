import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "~/components/ui/tooltip";
import { IDOL_BASES, type IdolBaseKey } from "~/data/idol-bases";
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
			return "bg-gray-900/50";
		case "magic":
			return "bg-blue-900/30";
		case "rare":
			return "bg-yellow-900/30";
		case "unique":
			return "bg-orange-900/30";
		default:
			return "bg-gray-900/50";
	}
}

function ModifierLine({ mod }: { mod: IdolModifier }) {
	return (
		<div className="text-sm">
			<span
				className={
					mod.type === "prefix" ? "text-blue-300" : "text-green-300"
				}
			>
				{mod.text}
			</span>
			{mod.tier && (
				<span className="ml-1 text-gray-500 text-xs">
					(T{mod.tier})
				</span>
			)}
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
			<div className="text-gray-400 text-xs">
				{base.name} • iLvl {idol.itemLevel}
			</div>

			{idol.implicit && !compact && (
				<div className="border-gray-700 border-b pb-1 text-purple-300 text-sm">
					{idol.implicit.text}
				</div>
			)}

			{compact ? (
				<div className="text-gray-300 text-sm">
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

	const cardContent = (
		<Card
			className={cn(
				"cursor-pointer border-2 transition-all hover:scale-105",
				rarityColor,
				rarityBg,
				className,
			)}
			onClick={onClick}
		>
			<CardHeader className="p-2 pb-0">
				<CardTitle className="font-medium text-sm">
					{idol.name || base.name}
				</CardTitle>
			</CardHeader>
			<CardContent className="p-2 pt-1">
				<IdolCardContent idol={idol} compact={compact} />
			</CardContent>
		</Card>
	);

	if (!showTooltip || !compact) {
		return cardContent;
	}

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>{cardContent}</TooltipTrigger>
				<TooltipContent side="right" className="max-w-xs">
					<IdolCardContent idol={idol} compact={false} />
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}

export function IdolCardMini({
	idol,
	onClick,
}: {
	idol: IdolInstance;
	onClick?: () => void;
}) {
	const base = IDOL_BASES[idol.baseType as IdolBaseKey];
	const rarityColor = getRarityColor(idol.rarity);
	const style = {
		width: `${base.width * 40}px`,
		height: `${base.height * 40}px`,
	};

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<button
						type="button"
						className={cn(
							"flex cursor-pointer items-center justify-center rounded border-2 bg-gray-800/50 text-xs transition-all hover:scale-105",
							rarityColor,
						)}
						style={style}
						onClick={onClick}
					>
						{base.width}x{base.height}
					</button>
				</TooltipTrigger>
				<TooltipContent side="right" className="max-w-xs">
					<IdolCardContent idol={idol} compact={false} />
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}
