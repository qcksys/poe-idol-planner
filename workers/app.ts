import { createRequestHandler, RouterContextProvider } from "react-router";
import { envContext, exeContext } from "~/context.ts";
import { handleScheduled } from "~/scheduled/index.ts";

const requestHandler = createRequestHandler(
	() => import("virtual:react-router/server-build"),
	import.meta.env.MODE,
);

export default {
	async fetch(request, env, executionContext) {
		const context = new RouterContextProvider();

		context.set(envContext, env);
		context.set(exeContext, executionContext);

		return requestHandler(request, context);
	},

	async scheduled(controller, env, ctx) {
		ctx.waitUntil(handleScheduled(controller, env));
	},
} satisfies ExportedHandler<CloudflareBindings>;
