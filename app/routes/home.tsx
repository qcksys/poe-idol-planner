import { envContext } from "~/context.ts";
import type { Route } from "./+types/home";

export function meta() {
	return [
		{ title: "New React Router App" },
		{ name: "description", content: "Welcome to React Router!" },
	];
}

export function loader({ context }: Route.LoaderArgs) {
	return { env: context.get(envContext).ENVIRONMENT };
}

export default function Home({ loaderData }: Route.ComponentProps) {
	return <h1>Home {loaderData.env}</h1>;
}
