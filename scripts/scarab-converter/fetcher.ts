import * as fs from "node:fs";
import * as path from "node:path";
import ky from "ky";

const CACHE_DIR = path.join(import.meta.dirname, ".cache");
const IMAGE_DIR = path.join(import.meta.dirname, "../../public/images/scarabs");
const RATE_LIMIT_MS = 500;

let lastFetchTime = 0;

async function rateLimit(): Promise<void> {
	const now = Date.now();
	const elapsed = now - lastFetchTime;
	if (elapsed < RATE_LIMIT_MS) {
		await new Promise((resolve) =>
			setTimeout(resolve, RATE_LIMIT_MS - elapsed),
		);
	}
	lastFetchTime = Date.now();
}

function getCachePath(page: string): string {
	return path.join(CACHE_DIR, `${page}.html`);
}

function readCache(page: string): string | null {
	const cachePath = getCachePath(page);
	if (fs.existsSync(cachePath)) {
		return fs.readFileSync(cachePath, "utf-8");
	}
	return null;
}

function writeCache(page: string, content: string): void {
	if (!fs.existsSync(CACHE_DIR)) {
		fs.mkdirSync(CACHE_DIR, { recursive: true });
	}
	const cachePath = getCachePath(page);
	fs.writeFileSync(cachePath, content, "utf-8");
}

const client = ky.create({
	headers: {
		"User-Agent":
			"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
		Accept: "text/html,image/webp,image/*",
		Referer: "https://poedb.tw/",
	},
	retry: {
		limit: 3,
		methods: ["get"],
		statusCodes: [408, 413, 429, 500, 502, 503, 504],
	},
	timeout: 30000,
});

export async function fetchScarabPage(useCache: boolean): Promise<string> {
	const page = "Scarab";
	if (useCache) {
		const cached = readCache(page);
		if (cached) {
			console.log(`  [cache hit] ${page}`);
			return cached;
		}
	}

	const url = "https://poedb.tw/us/Scarab";

	await rateLimit();
	console.log(`  [fetching] ${url}`);

	const html = await client.get(url).text();
	writeCache(page, html);

	return html;
}

export async function downloadImage(
	imageUrl: string,
	filename: string,
): Promise<string> {
	if (!fs.existsSync(IMAGE_DIR)) {
		fs.mkdirSync(IMAGE_DIR, { recursive: true });
	}

	const outputPath = path.join(IMAGE_DIR, filename);

	if (fs.existsSync(outputPath)) {
		console.log(`  [image exists] ${filename}`);
		return `/images/scarabs/${filename}`;
	}

	await rateLimit();
	console.log(`  [downloading] ${filename}`);

	const response = await client.get(imageUrl);
	const buffer = await response.arrayBuffer();
	fs.writeFileSync(outputPath, Buffer.from(buffer));

	return `/images/scarabs/${filename}`;
}

export function clearCache(): void {
	if (fs.existsSync(CACHE_DIR)) {
		fs.rmSync(CACHE_DIR, { recursive: true });
	}
}

export function listCachedFiles(): string[] {
	if (!fs.existsSync(CACHE_DIR)) {
		return [];
	}
	return fs.readdirSync(CACHE_DIR);
}
