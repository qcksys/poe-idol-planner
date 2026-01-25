import Markdown from "react-markdown";
import changelogRaw from "~/../CHANGELOG.md?raw";
import type { Route } from "./+types/changelog";

export function meta(): Route.MetaDescriptors {
	return [
		{ title: "Changelog | POE Idol Planner" },
		{
			name: "description",
			content: "View the changelog for POE Idol Planner",
		},
	];
}

export default function Changelog(_props: Route.ComponentProps) {
	return (
		<main className="mx-auto max-w-3xl px-4 py-8">
			<article className="prose prose-neutral dark:prose-invert max-w-none">
				<Markdown>{changelogRaw}</Markdown>
			</article>
		</main>
	);
}
