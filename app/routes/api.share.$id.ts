import { envContext } from "~/context";
import { loadShare } from "~/lib/share";
import type { Route } from "./+types/api.share.$id";

export async function loader({ params, context }: Route.LoaderArgs) {
	const env = context.get(envContext);
	const kv = env.KV_SAVE;

	if (!kv) {
		console.log({ message: "KV_SAVE not configured" });
		return Response.json(
			{ error: "Sharing not available" },
			{ status: 503 },
		);
	}

	const shareId = params.id;
	if (!shareId) {
		return Response.json({ error: "Share ID required" }, { status: 400 });
	}

	const shared = await loadShare(kv, shareId);
	if (!shared) {
		return Response.json(
			{ error: "Share not found or expired" },
			{ status: 404 },
		);
	}

	return Response.json(shared);
}
