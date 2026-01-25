import { index, type RouteConfig, route } from "@react-router/dev/routes";

export default [
	index("routes/home.tsx"),
	route("changelog", "routes/changelog.tsx"),
	route("action/set-theme", "routes/action.set-theme.ts"),
	route("*", "routes/$.tsx"),
] satisfies RouteConfig;
