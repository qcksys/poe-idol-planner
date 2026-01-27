import { Link } from "react-router";

export function meta() {
	return [
		{ title: "404 - Lost in the Void | POE Idol Planner" },
		{ name: "description", content: "This area has not been discovered." },
	];
}

export function action() {
	throw new Response("Not Found", { status: 404 });
}

export function loader() {
	throw new Response("Not Found", { status: 404 });
}

export default function NotFound() {
	return <NotFoundPage />;
}

export function NotFoundPage() {
	return (
		<div className="dark relative flex min-h-screen items-center justify-center overflow-hidden bg-background">
			{/* Atmospheric background layers */}
			<div className="pointer-events-none absolute inset-0">
				{/* Dark vignette */}
				<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,oklch(0_0_0/0.8)_70%,oklch(0_0_0/0.95)_100%)]" />

				{/* Subtle noise texture */}
				<div
					className="absolute inset-0 opacity-[0.03]"
					style={{
						backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
					}}
				/>

				{/* Animated fog layers */}
				<div className="absolute inset-0 animate-[drift_25s_ease-in-out_infinite] bg-[radial-gradient(ellipse_80%_50%_at_20%_60%,oklch(0.45_0.1_65/0.08),transparent)]" />
				<div className="absolute inset-0 animate-[drift_30s_ease-in-out_infinite_reverse] bg-[radial-gradient(ellipse_60%_40%_at_80%_40%,oklch(0.55_0.1_70/0.06),transparent)]" />

				{/* Floating particles */}
				<div className="absolute top-1/4 left-1/4 h-1 w-1 animate-[float_8s_ease-in-out_infinite] rounded-full bg-warning/30" />
				<div className="absolute top-1/3 right-1/3 h-0.5 w-0.5 animate-[float_6s_ease-in-out_infinite_1s] rounded-full bg-warning/20" />
				<div className="absolute bottom-1/3 left-1/2 h-1 w-1 animate-[float_10s_ease-in-out_infinite_2s] rounded-full bg-accent/25" />
				<div className="absolute top-1/2 right-1/4 h-0.5 w-0.5 animate-[float_7s_ease-in-out_infinite_0.5s] rounded-full bg-warning/20" />
				<div className="absolute right-1/2 bottom-1/4 h-1 w-1 animate-[float_9s_ease-in-out_infinite_3s] rounded-full bg-warning/30" />
			</div>

			{/* Main content */}
			<div className="relative z-10 px-6 text-center">
				{/* Corrupted 404 number */}
				<div className="relative mb-8">
					{/* Glitch layers */}
					<span
						className="absolute top-0 left-1/2 -translate-x-1/2 font-black font-serif text-[12rem] text-destructive/20 leading-none sm:text-[16rem] md:text-[20rem]"
						style={{
							fontFamily: "'Cinzel', serif",
							textShadow: "0 0 40px oklch(0.55 0.22 25 / 0.3)",
							animation: "glitch-1 3s ease-in-out infinite",
							clipPath: "inset(40% 0 40% 0)",
						}}
					>
						404
					</span>
					<span
						className="absolute top-0 left-1/2 -translate-x-1/2 font-black font-serif text-[12rem] text-chart-4/20 leading-none sm:text-[16rem] md:text-[20rem]"
						style={{
							fontFamily: "'Cinzel', serif",
							textShadow: "0 0 40px oklch(0.7 0.15 200 / 0.3)",
							animation: "glitch-2 3s ease-in-out infinite 0.1s",
							clipPath: "inset(60% 0 10% 0)",
						}}
					>
						404
					</span>

					{/* Main 404 text */}
					<h1
						className="relative font-black font-serif text-[12rem] text-transparent leading-none sm:text-[16rem] md:text-[20rem]"
						style={{
							fontFamily: "'Cinzel', serif",
							backgroundImage:
								"linear-gradient(180deg, oklch(0.75 0.1 70) 0%, oklch(0.5 0.12 55) 40%, oklch(0.35 0.1 50) 70%, oklch(0.2 0.05 45) 100%)",
							backgroundClip: "text",
							WebkitBackgroundClip: "text",
							textShadow:
								"0 0 80px oklch(0.55 0.1 70 / 0.4), 0 0 120px oklch(0.45 0.1 65 / 0.2)",
							filter: "drop-shadow(0 4px 20px oklch(0 0 0 / 0.8))",
						}}
					>
						404
					</h1>

					{/* Decorative line */}
					<div className="mx-auto mt-4 h-px w-48 bg-gradient-to-r from-transparent via-accent/60 to-transparent sm:w-64" />
				</div>

				{/* Message */}
				<div className="mb-12 space-y-4">
					<h2
						className="text-warning/90 text-xl uppercase tracking-[0.3em] sm:text-2xl"
						style={{
							fontFamily: "'Cinzel', serif",
							textShadow: "0 2px 20px oklch(0.55 0.1 70 / 0.3)",
						}}
					>
						Area Not Discovered
					</h2>
					<p className="mx-auto max-w-md font-light text-muted-foreground/80 leading-relaxed tracking-wide">
						You have wandered into the uncharted void.
						<br />
						<span className="text-muted-foreground/60 italic">
							This waypoint does not exist on any map.
						</span>
					</p>
				</div>

				{/* Return button */}
				<Link
					to="/"
					className="group relative inline-flex items-center gap-3 overflow-hidden border border-accent/40 bg-gradient-to-b from-accent/20 to-accent/10 px-8 py-4 transition-all duration-500 hover:border-accent/60 hover:from-accent/30 hover:to-accent/20"
					style={{
						clipPath:
							"polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)",
					}}
				>
					{/* Button glow effect */}
					<span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-warning/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

					{/* Portal icon */}
					<svg
						role="img"
						aria-label="Portal waypoint icon"
						className="h-5 w-5 text-warning/70 transition-all duration-300 group-hover:text-warning group-hover:drop-shadow-[0_0_8px_oklch(0.75_0.15_75/0.5)]"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="1.5"
					>
						<circle cx="12" cy="12" r="9" className="opacity-60" />
						<circle cx="12" cy="12" r="5" />
						<path d="M12 3v2M12 19v2M3 12h2M19 12h2" />
					</svg>

					<span
						className="relative text-sm text-warning/90 uppercase tracking-[0.2em] transition-colors duration-300 group-hover:text-warning"
						style={{ fontFamily: "'Cinzel', serif" }}
					>
						Return to Hideout
					</span>

					{/* Corner accents */}
					<span className="absolute top-0 left-0 h-2 w-2 border-accent/40 border-t border-l transition-colors duration-300 group-hover:border-accent/60" />
					<span className="absolute right-0 bottom-0 h-2 w-2 border-accent/40 border-r border-b transition-colors duration-300 group-hover:border-accent/60" />
				</Link>

				{/* Subtle footer text */}
				<p className="mt-16 font-mono text-muted-foreground/40 text-xs tracking-widest">
					{"// WAYPOINT_ERROR: DESTINATION_UNDEFINED"}
				</p>
			</div>

			{/* Custom keyframes style tag */}
			<style>
				{`
					@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&display=swap');

					@keyframes drift {
						0%, 100% { transform: translateX(0) translateY(0); }
						50% { transform: translateX(30px) translateY(-20px); }
					}

					@keyframes float {
						0%, 100% {
							transform: translateY(0) scale(1);
							opacity: 0.3;
						}
						50% {
							transform: translateY(-20px) scale(1.2);
							opacity: 0.6;
						}
					}

					@keyframes glitch-1 {
						0%, 90%, 100% { transform: translateX(-50%) translateX(0); }
						92% { transform: translateX(-50%) translateX(-8px); }
						94% { transform: translateX(-50%) translateX(8px); }
						96% { transform: translateX(-50%) translateX(-4px); }
						98% { transform: translateX(-50%) translateX(4px); }
					}

					@keyframes glitch-2 {
						0%, 90%, 100% { transform: translateX(-50%) translateX(0); }
						91% { transform: translateX(-50%) translateX(6px); }
						93% { transform: translateX(-50%) translateX(-6px); }
						95% { transform: translateX(-50%) translateX(3px); }
						97% { transform: translateX(-50%) translateX(-3px); }
					}
				`}
			</style>
		</div>
	);
}
