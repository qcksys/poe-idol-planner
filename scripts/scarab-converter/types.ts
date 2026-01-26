export interface RawScarab {
	id: string;
	name: string;
	effect: string;
	category: string;
	imageUrl: string;
	limit?: number;
}

export interface ScarabData {
	id: string;
	name: string;
	effect: string;
	category: string;
	image: string;
	limit: number;
}

export interface ConvertedScarabData {
	scarabs: ScarabData[];
	categories: string[];
	generatedAt: string;
	version: number;
}
