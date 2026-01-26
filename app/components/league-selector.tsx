import { Trophy } from "lucide-react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "~/components/ui/tooltip";
import { useLeague } from "~/hooks/use-league";

export function LeagueSelector() {
	const { league, leagues, setLeague, isHydrated } = useLeague();

	if (!isHydrated) {
		return (
			<Select disabled>
				<SelectTrigger className="w-[180px]">
					<Trophy className="mr-2 h-4 w-4" />
					<SelectValue placeholder="Loading..." />
				</SelectTrigger>
			</Select>
		);
	}

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<div>
					<Select value={league} onValueChange={setLeague}>
						<SelectTrigger className="w-[180px]">
							<Trophy className="mr-2 h-4 w-4" />
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{leagues.map((l) => (
								<SelectItem key={l.id} value={l.id}>
									{l.text}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</TooltipTrigger>
			<TooltipContent>
				League selector for prices and trade searches
			</TooltipContent>
		</Tooltip>
	);
}
