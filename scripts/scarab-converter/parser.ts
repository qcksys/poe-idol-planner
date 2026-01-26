import type { RawScarab } from "./types.ts";

function extractCategory(name: string): string {
	// Extract category from scarab name (e.g., "Breach Scarab" -> "breach")
	const match = name.match(/^(\w+)\s+Scarab/i);
	if (match) {
		return match[1].toLowerCase();
	}
	// Handle "Horned Scarab of X" pattern
	if (name.startsWith("Horned Scarab")) {
		return "horned";
	}
	return "other";
}

function normalizeEffect(effectHtml: string): string {
	// Convert <br /> to newlines and clean up HTML
	return effectHtml
		.replace(/<br\s*\/?>/gi, "\n")
		.replace(/<[^>]*>/g, "")
		.replace(/\s+/g, " ")
		.trim();
}

export function parseScarabPage(html: string): RawScarab[] {
	const scarabs: RawScarab[] = [];

	// Find the ScarabsItem section
	const scarabsItemMatch = html.match(
		/<div id="ScarabsItem"[^>]*>([\s\S]*?)(?=<div id="Acronym"|$)/,
	);
	if (!scarabsItemMatch) {
		console.error("Could not find #ScarabsItem section");
		return [];
	}

	const scarabsHtml = scarabsItemMatch[1];

	// Use regex to extract each scarab item
	const itemPattern =
		/<div class="col"><div class="d-flex border-top rounded">([\s\S]*?)<\/div><\/div>(?=<div class="col">|$)/g;

	let match: RegExpExecArray | null;
	// biome-ignore lint/suspicious/noAssignInExpressions: standard regex exec pattern
	while ((match = itemPattern.exec(scarabsHtml)) !== null) {
		const itemHtml = match[1];

		try {
			// Extract image URL (inside img tag)
			const imgMatch = itemHtml.match(
				/src="(https:\/\/cdn\.poedb\.tw\/image\/[^"]+\.webp)"/,
			);
			const imageUrl = imgMatch?.[1] || "";

			// Extract name from anchor text in the flex-grow-1 section
			const nameMatch = itemHtml.match(
				/<div class="flex-grow-1[^>]*"><a[^>]+>([^<]+)<\/a>/,
			);
			const name = nameMatch?.[1]?.trim() || "";

			if (!name || !imageUrl) continue;

			// Extract limit
			const limitMatch = itemHtml.match(
				/Limit:\s*<span[^>]*>(\d+)<\/span>/,
			);
			const limit = limitMatch ? Number.parseInt(limitMatch[1], 10) : 5;

			// Extract effect from explicitMod
			const effectMatch = itemHtml.match(
				/<div class="explicitMod">([\s\S]*?)<\/div>/,
			);
			const effectHtml = effectMatch?.[1] || "";
			const effect = normalizeEffect(effectHtml);

			if (!effect) continue;

			// Generate ID from name
			const id = name
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, "_")
				.replace(/^_|_$/g, "");

			// Extract category
			const category = extractCategory(name);

			scarabs.push({
				id,
				name,
				effect,
				category,
				imageUrl,
				limit,
			});
		} catch (error) {
			console.error("Error parsing scarab item:", error);
		}
	}

	return scarabs;
}
