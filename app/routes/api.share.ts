import { z } from "zod";
import { envContext } from "~/context";
import { buildShareUrl, saveShare } from "~/lib/share";
import { IdolSetSchema } from "~/schemas/idol-set";
import { InventoryIdolSchema } from "~/schemas/inventory";
import type { Route } from "./+types/api.share";

const CreateShareRequestSchema = z.object({
	set: IdolSetSchema,
	inventory: z.array(InventoryIdolSchema),
});

export async function action({ request, context }: Route.ActionArgs) {
	if (request.method !== "POST") {
		return Response.json({ error: "Method not allowed" }, { status: 405 });
	}

	const env = context.get(envContext);
	const kv = env.KV_SAVE;

	if (!kv) {
		console.log({ message: "KV_SAVE not configured" });
		return Response.json(
			{ error: "Sharing not available" },
			{ status: 503 },
		);
	}

	try {
		const body = await request.json();
		const result = CreateShareRequestSchema.safeParse(body);

		if (!result.success) {
			console.log({
				message: "Invalid share request",
				error: result.error.message,
			});
			return Response.json(
				{ error: "Invalid request data" },
				{ status: 400 },
			);
		}

		const { set, inventory } = result.data;
		const shareId = await saveShare(kv, set, inventory);

		const baseUrl = new URL(request.url).origin;
		const shareUrl = buildShareUrl(baseUrl, shareId);

		return Response.json({ shareId, shareUrl });
	} catch (error) {
		console.log({
			message: "Share creation failed",
			error: error instanceof Error ? error.message : "Unknown error",
		});
		return Response.json(
			{ error: "Failed to create share" },
			{ status: 500 },
		);
	}
}
