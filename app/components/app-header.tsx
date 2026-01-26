import { Share2 } from "lucide-react";
import { Link } from "react-router";
import { siGithub } from "simple-icons";
import { Button } from "~/components/ui/button";
import { useTranslations } from "~/i18n";
import { LocaleSwitcher } from "./locale-switcher";
import { ModeToggle } from "./mode-toggle";

interface AppHeaderProps {
	onShareClick?: () => void;
}

export function AppHeader({ onShareClick }: AppHeaderProps) {
	const t = useTranslations();

	return (
		<header className="sticky top-0 z-50 border-border border-b bg-background/90 backdrop-blur">
			<div className="container mx-auto flex h-14 items-center justify-between px-4">
				<div className="flex items-center gap-2">
					<Link
						to="/"
						className="font-bold text-accent text-lg dark:text-yellow-500"
					>
						{t.app.title}
					</Link>
					<span className="rounded bg-primary px-1.5 py-0.5 text-primary-foreground text-xs">
						Legacy of Phrecia
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
					<LocaleSwitcher />
					<ModeToggle />
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
				</div>
			</div>
		</header>
	);
}
