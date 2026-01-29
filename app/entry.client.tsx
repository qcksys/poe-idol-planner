import * as Sentry from "@sentry/react-router/cloudflare";
import { StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

Sentry.init({
	dsn: import.meta.env.VITE_SENTRY_DSN,
	environment: import.meta.env.VITE_SENTRY_ENVIRONMENT,
	integrations: [Sentry.reactRouterTracingIntegration()],
	tracesSampleRate: 0.1,
	replaysSessionSampleRate: 0,
	replaysOnErrorSampleRate: 1.0,
	ignoreErrors: [
		// React hydration errors (often caused by browser extensions)
		/Hydration failed/i,
		/There was an error while hydrating/i,
		/Text content does not match/i,
		/Minified React error #4(18|19|21|22|23|25)/,
	],
	denyUrls: [
		// Browser extensions
		/chrome-extension:\/\//i,
		/moz-extension:\/\//i,
		/safari-extension:\/\//i,
		/safari-web-extension:\/\//i,
	],
});

startTransition(() => {
	hydrateRoot(
		document,
		<StrictMode>
			<HydratedRouter />
		</StrictMode>,
	);
});
