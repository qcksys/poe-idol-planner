import { nanoid } from "nanoid";
import type { IdolSet } from "~/schemas/idol-set";
import type { InventoryIdol } from "~/schemas/inventory";
import { SHARE_TTL_MS, type SharedSet, SharedSetSchema } from "~/schemas/share";

const SHARE_ID_LENGTH = 10;
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

	const now = Date.now();
	return {
		version: 1,
		set,
		idols: relevantIdols,
		createdAt: now,
		expiresAt: now + SHARE_TTL_MS,
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

	await kv.put(getKvKey(shareId), JSON.stringify(payload), {
		expirationTtl: Math.ceil(SHARE_TTL_MS / 1000),
	});

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
