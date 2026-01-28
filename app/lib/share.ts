import { nanoid } from "nanoid";
import { getScarabById, getScarabName } from "~/data/scarab-data";
import type { SupportedLocale } from "~/i18n/types";
import { getModMechanic } from "~/lib/mod-text-resolver";
import type { IdolSet } from "~/schemas/idol-set";
import type { InventoryIdol } from "~/schemas/inventory";
import type { ScarabPricesData } from "~/schemas/scarab";
import {
	SHARE_ID_LENGTH,
	type SharedSet,
	SharedSetSchema,
} from "~/schemas/share";

const KV_PREFIX = "share:";

export function generateShareId(): string {
	return nanoid(SHARE_ID_LENGTH);
}

export function createSharePayload(
	set: IdolSet,
	inventory: InventoryIdol[],
): SharedSet {
	const relevantIdols = inventory.filter((inv) =>
		set.placements.some((p) => p.inventoryIdolId === inv.id),
	);

	return {
		version: 1,
		set,
		idols: relevantIdols,
		createdAt: Date.now(),
	};
}

export function validateSharePayload(data: unknown): SharedSet | null {
	const result = SharedSetSchema.safeParse(data);
	if (result.success) {
		return result.data;
	}
	console.log({
		message: "Share payload validation failed",
		error: result.error.message,
	});
	return null;
}

export function getKvKey(shareId: string): string {
	return `${KV_PREFIX}${shareId}`;
}

export async function saveShare(
	kv: KVNamespace,
	set: IdolSet,
	inventory: InventoryIdol[],
): Promise<string> {
	const shareId = generateShareId();
	const payload = createSharePayload(set, inventory);

	await kv.put(getKvKey(shareId), JSON.stringify(payload));

	console.log({
		message: "Share created",
		shareId,
		setName: set.name,
		idolCount: payload.idols.length,
	});

	return shareId;
}

export async function loadShare(
	kv: KVNamespace,
	shareId: string,
): Promise<SharedSet | null> {
	const data = await kv.get(getKvKey(shareId));
	if (!data) {
		console.log({ message: "Share not found", shareId });
		return null;
	}

	try {
		const parsed = JSON.parse(data);
		return validateSharePayload(parsed);
	} catch (e) {
		console.log({
			message: "Failed to parse share data",
			shareId,
			error: e instanceof Error ? e.message : "Unknown error",
		});
		return null;
	}
}

export function buildShareUrl(baseUrl: string, shareId: string): string {
	const url = new URL(baseUrl);
	url.pathname = `/share/${shareId}`;
	return url.toString();
}

export function extractMechanics(sharedSet: SharedSet): string[] {
	const mechanics = new Set<string>();
	for (const idol of sharedSet.idols) {
		for (const mod of [...idol.idol.prefixes, ...idol.idol.suffixes]) {
			const mechanic = getModMechanic(mod.modId);
			if (mechanic) {
				mechanics.add(mechanic);
			}
		}
	}
	return Array.from(mechanics).sort();
}

export function extractScarabNames(
	sharedSet: SharedSet,
	locale: SupportedLocale = "en",
): string[] {
	const names: string[] = [];
	for (const slot of sharedSet.set.mapDevice.slots) {
		if (slot.scarabId) {
			const scarab = getScarabById(slot.scarabId);
			if (scarab) {
				names.push(getScarabName(scarab, locale));
			}
		}
	}
	return names;
}

export function extractScarabIds(sharedSet: SharedSet): string[] {
	return sharedSet.set.mapDevice.slots
		.filter((slot) => slot.scarabId !== null)
		.map((slot) => slot.scarabId as string);
}

export function calculateScarabCost(
	scarabIds: string[],
	prices: ScarabPricesData | null,
): number | null {
	if (!prices) return null;

	let total = 0;
	for (const scarabId of scarabIds) {
		const price = prices.prices[scarabId];
		if (price) {
			total += price.chaosValue;
		}
	}
	return total > 0 ? Math.round(total * 10) / 10 : null;
}

function capitalizeFirstLetter(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

export function formatMetaDescription(
	mechanics: string[],
	scarabNames: string[],
	cost: number | null,
): string {
	const parts: string[] = [];

	if (mechanics.length > 0) {
		parts.push(mechanics.map(capitalizeFirstLetter).join(", "));
	}

	if (scarabNames.length > 0) {
		const scarabPart =
			cost !== null
				? `${scarabNames.join(", ")} (${cost}c)`
				: scarabNames.join(", ");
		parts.push(scarabPart);
	}

	if (parts.length === 0) {
		return "View and import this shared idol set";
	}

	return parts.join(" | ");
}
