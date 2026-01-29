import * as Sentry from "@sentry/react-router/cloudflare";
import clsx from "clsx";
import { type ReactNode, useEffect } from "react";
import {
	isRouteErrorResponse,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useLoaderData,
} from "react-router";
import {
	PreventFlashOnWrongTheme,
	Theme,
	ThemeProvider,
	useTheme,
} from "remix-themes";

import type { Route } from "./+types/root";
import "~/app.css";
import { Toaster } from "~/components/ui/sonner";
import { I18nProvider } from "~/i18n";
import { NotFoundPage } from "~/routes/$";
import { themeSessionResolver } from "~/sessions.server";

export const links: Route.LinksFunction = () => [
	{ rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
];

export async function loader({ request }: Route.LoaderArgs) {
	const { getTheme } = await themeSessionResolver(request);
	return { theme: getTheme() ?? Theme.DARK };
}

function AppLayout({ children }: { children: ReactNode }) {
	const data = useLoaderData<typeof loader>();
	const [theme] = useTheme();

	return (
		<html lang="en" className={clsx(theme)}>
			<head>
				<meta charSet="utf-8" />
				<meta
					name="viewport"
					content="width=device-width, initial-scale=1"
				/>
				<Meta />
				<PreventFlashOnWrongTheme ssrTheme={Boolean(data.theme)} />
				<Links />
			</head>
			<body className="min-h-screen bg-background text-foreground">
				<I18nProvider>{children}</I18nProvider>
				<Toaster />
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

export function Layout({ children }: { children: ReactNode }) {
	const data = useLoaderData<typeof loader>();

	return (
		<ThemeProvider
			specifiedTheme={data.theme}
			themeAction="/action/set-theme"
		>
			<AppLayout>{children}</AppLayout>
		</ThemeProvider>
	);
}

export default function App() {
	return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	useEffect(() => {
		if (!isRouteErrorResponse(error) || error.status >= 500) {
			Sentry.captureException(error);
		}
	}, [error]);

	if (isRouteErrorResponse(error) && error.status === 404) {
		return <NotFoundPage />;
	}

	let message = "Oops!";
	let details = "An unexpected error occurred.";
	let stack: string | undefined;

	if (isRouteErrorResponse(error)) {
		message = `Error ${error.status}`;
		details = error.statusText || details;
	} else if (import.meta.env.DEV && error && error instanceof Error) {
		details = error.message;
		stack = error.stack;
	}

	return (
		<main className="container mx-auto p-4 pt-16">
			<h1>{message}</h1>
			<p>{details}</p>
			{stack && (
				<pre className="w-full overflow-x-auto p-4">
					<code>{stack}</code>
				</pre>
			)}
		</main>
	);
}
