import { cloudflare } from "@cloudflare/vite-plugin";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
	const isProduction = mode === "worker-prod";

	return {
		plugins: [
			cloudflare({ viteEnvironment: { name: "ssr" } }),
			tailwindcss(),
			reactRouter(),
			tsconfigPaths(),
		],
		define: {
			"import.meta.env.VITE_SENTRY_ENVIRONMENT": JSON.stringify(
				isProduction ? "production" : "development",
			),
			"import.meta.env.VITE_SENTRY_DSN": JSON.stringify(
				"https://0ecbba29df7a0da40997235bb1a505f2@o4507101986291712.ingest.de.sentry.io/4510781678223440",
			),
		},
		build: {
			sourcemap: true,
		},
	};
});
