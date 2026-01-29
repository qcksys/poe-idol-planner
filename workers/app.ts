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

		// Strip body from GET/HEAD requests to work around Cloudflare Workers + React Router issue
		// Some bots send GET requests with Content-Length headers, which causes React Router's
		// internal stripIndexParam function to fail when creating a new Request
		// See: https://pmil.me/posts/request-get-head-body
		const isGetOrHead =
			request.method === "GET" || request.method === "HEAD";

		return requestHandler(
			isGetOrHead ? new Request(request, { body: null }) : request,
			context,
		);
	},

	async scheduled(controller, env, ctx) {
		ctx.waitUntil(handleScheduled(controller, env));
	},
} satisfies ExportedHandler<CloudflareBindings>;
