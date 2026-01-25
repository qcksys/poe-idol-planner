import { index, type RouteConfig, route } from "@react-router/dev/routes";

export default [
	index("routes/home.tsx"),
	route("changelog", "routes/changelog.tsx"),
	route("action/set-theme", "routes/action.set-theme.ts"),
	route("api/share", "routes/api.share.ts"),
	route("api/share/:id", "routes/api.share.$id.ts"),
	route("share/:id", "routes/share.$id.tsx"),
	route("*", "routes/$.tsx"),
] satisfies RouteConfig;
