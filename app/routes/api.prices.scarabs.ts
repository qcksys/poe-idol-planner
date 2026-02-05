import { z } from "zod";
import { envContext } from "~/context";
import {
	type ScarabPricesData,
	ScarabPricesDataSchema,
} from "~/schemas/scarab";
import type { Route } from "./+types/api.prices.scarabs";

const LeagueQuerySchema = z
	.string()
	.min(1, "League is required")
	.max(100, "League name too long")
	.regex(/^[\w\s.-]+$/, "Invalid league name format");

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
	const leagueResult = LeagueQuerySchema.safeParse(
		url.searchParams.get("league"),
	);

	if (!leagueResult.success) {
		return Response.json(
			{
				error:
					leagueResult.error.issues[0]?.message ?? "Invalid league",
			},
			{ status: 400 },
		);
	}

	const league = leagueResult.data;
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
