import { Mail, Share2 } from "lucide-react";
import { Link } from "react-router";
import { siGithub } from "simple-icons";
import { LeagueSelector } from "~/components/league-selector";
import { LocaleSwitcher } from "~/components/locale-switcher";
import { ModeToggle } from "~/components/mode-toggle";
import { Button } from "~/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "~/components/ui/tooltip";
import { useTranslations } from "~/i18n";

interface AppHeaderProps {
	onShareClick?: () => void;
}

export function AppHeader({ onShareClick }: AppHeaderProps) {
	const t = useTranslations();

	return (
		<header className="sticky top-0 z-50 border-border border-b bg-background/90 backdrop-blur">
			<div className="container mx-auto flex h-14 items-center justify-between px-4">
				<div className="flex items-center gap-2">
					<Link to="/" className="font-bold text-accent text-lg">
						{t.app.title}
					</Link>
					<span className="rounded bg-primary px-1.5 py-0.5 text-primary-foreground text-xs">
						{t.app.subtitle}
					</span>
					<Link
						to="/changelog"
						className="text-muted-foreground text-sm hover:text-foreground"
					>
						{t.nav.changelog}
					</Link>
				</div>

				<div className="flex items-center gap-2">
					{onShareClick && (
						<Button
							variant="outline"
							size="sm"
							onClick={onShareClick}
						>
							<Share2 className="mr-1 h-4 w-4" />
							{t.actions.share}
						</Button>
					)}
					<LeagueSelector />
					<LocaleSwitcher />
					<ModeToggle />
					<Tooltip>
						<TooltipTrigger asChild>
							<Button variant="ghost" size="icon" asChild>
								<a href="mailto:poe@qcksys.com">
									<Mail className="h-5 w-5" />
								</a>
							</Button>
						</TooltipTrigger>
						<TooltipContent>{t.footer.emailMe}</TooltipContent>
					</Tooltip>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button variant="ghost" size="icon" asChild>
								<a
									href="https://github.com/qcksys/poe-idol-planner"
									target="_blank"
									rel="noopener noreferrer"
								>
									<svg
										role="img"
										viewBox="0 0 24 24"
										className="h-5 w-5 fill-current"
										aria-label="GitHub"
									>
										<path d={siGithub.path} />
									</svg>
								</a>
							</Button>
						</TooltipTrigger>
						<TooltipContent>{t.nav.github}</TooltipContent>
					</Tooltip>
				</div>
			</div>
		</header>
	);
}
