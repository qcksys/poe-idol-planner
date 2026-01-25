import { Share2 } from "lucide-react";
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
					<h1 className="font-bold text-lg text-yellow-500">
						{t.app.title}
					</h1>
					<span className="rounded bg-blue-600 px-1.5 py-0.5 text-xs">
						Legacy of Phrecia
					</span>
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
							href="https://github.com/user/poe-idol-planner"
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
