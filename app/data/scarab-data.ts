import scarabsJson from "~/data/scarabs.json";
import type { Scarab, ScarabsData } from "~/schemas/scarab";

const scarabsData = scarabsJson as ScarabsData;

export const SCARABS: Scarab[] = scarabsData.scarabs;

export const SCARAB_CATEGORIES: string[] = scarabsData.categories;

const scarabsById = new Map<string, Scarab>();
for (const scarab of SCARABS) {
	scarabsById.set(scarab.id, scarab);
}

export function getScarabById(id: string): Scarab | undefined {
	return scarabsById.get(id);
}

export function getScarabsByCategory(category: string): Scarab[] {
	return SCARABS.filter((s) => s.category === category);
}

export function searchScarabs(query: string): Scarab[] {
	const lowerQuery = query.toLowerCase();
	return SCARABS.filter(
		(s) =>
			s.name.toLowerCase().includes(lowerQuery) ||
			s.effect.toLowerCase().includes(lowerQuery) ||
			s.category.toLowerCase().includes(lowerQuery),
	);
}
