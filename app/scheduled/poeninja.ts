import {
	PoeNinjaResponseSchema,
	type ScarabPricesData,
} from "~/schemas/scarab";

const POE_NINJA_API_URL =
	"https://poe.ninja/poe1/api/economy/stash/current/item/overview";

const PC_LEAGUES = [
	"Keepers",
	"Hardcore Keepers",
	"Ruthless Keepers",
	"HC Ruthless Keepers",
	"Standard",
	"Hardcore",
	"Ruthless",
	"Hardcore Ruthless",
];

function normalizeNameToId(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9\s]/g, "")
		.replace(/\s+/g, "_");
}

async function fetchScarabPricesForLeague(
	league: string,
): Promise<ScarabPricesData | null> {
	const url = new URL(POE_NINJA_API_URL);
	url.searchParams.set("league", league);
	url.searchParams.set("type", "Scarab");

	try {
		const response = await fetch(url.toString());
		if (!response.ok) {
			console.log({
				message: "POE Ninja API request failed",
				league,
				status: response.status,
			});
			return null;
		}

		const data = await response.json();
		const parsed = PoeNinjaResponseSchema.safeParse(data);
		if (!parsed.success) {
			console.log({
				message: "POE Ninja API response validation failed",
				league,
				error: parsed.error.message,
			});
			return null;
		}

		const prices: ScarabPricesData["prices"] = {};
		for (const item of parsed.data.lines) {
			const id = normalizeNameToId(item.name);
			prices[id] = {
				name: item.name,
				chaosValue: item.chaosValue,
			};
		}

		return {
			league,
			prices,
			updatedAt: new Date().toISOString(),
		};
	} catch (error) {
		console.log({
			message: "POE Ninja API fetch error",
			league,
			error: error instanceof Error ? error.message : String(error),
		});
		return null;
	}
}

export async function updateScarabPrices(
	kv: KVNamespace,
): Promise<{ successCount: number; errorCount: number }> {
	let successCount = 0;
	let errorCount = 0;

	for (const league of PC_LEAGUES) {
		const pricesData = await fetchScarabPricesForLeague(league);
		if (pricesData) {
			const key = `scarab-prices:${league}`;
			await kv.put(key, JSON.stringify(pricesData), {
				expirationTtl: 86400,
			});
			successCount++;
		} else {
			errorCount++;
		}
	}

	return { successCount, errorCount };
}
