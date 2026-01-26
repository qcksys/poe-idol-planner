import { envContext } from "~/context";
import {
	type ScarabPricesData,
	ScarabPricesDataSchema,
} from "~/schemas/scarab";
import type { Route } from "./+types/api.prices.scarabs";

export async function loader({ request, context }: Route.LoaderArgs) {
	const env = context.get(envContext);
	const kv = env.KV_POENINJA;

	if (!kv) {
		console.log({ message: "KV_POENINJA not configured" });
		return Response.json(
			{ error: "Prices not available" },
			{ status: 503 },
		);
	}

	const url = new URL(request.url);
	const league = url.searchParams.get("league");

	if (!league) {
		return Response.json({ error: "League required" }, { status: 400 });
	}

	const key = `scarab-prices:${league}`;
	const cached = await kv.get(key);

	if (!cached) {
		return Response.json(
			{ error: "Prices not available for this league" },
			{ status: 404 },
		);
	}

	try {
		const data = JSON.parse(cached) as ScarabPricesData;
		const parsed = ScarabPricesDataSchema.safeParse(data);
		if (!parsed.success) {
			console.log({
				message: "Cached price data validation failed",
				league,
				error: parsed.error.message,
			});
			return Response.json(
				{ error: "Invalid cached data" },
				{ status: 500 },
			);
		}
		return Response.json(parsed.data);
	} catch {
		console.log({ message: "Failed to parse cached price data", league });
		return Response.json({ error: "Invalid cached data" }, { status: 500 });
	}
}
