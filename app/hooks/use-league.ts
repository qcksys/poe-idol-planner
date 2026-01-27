import { useEffect, useState } from "react";
import leaguesData from "~/data/leagues.json";
import {
	DEFAULT_LEAGUE,
	DEFAULT_REALM,
	type League,
	type Realm,
} from "~/schemas/league";

const STORAGE_KEY = "poe-idol-planner-league";

interface LeagueSettings {
	league: string;
	realm: Realm;
}

function loadLeagueSettings(): LeagueSettings {
	if (typeof window === "undefined") {
		return { league: DEFAULT_LEAGUE, realm: DEFAULT_REALM };
	}

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored);
			if (parsed.league && parsed.realm) {
				return parsed;
			}
		}
	} catch {
		// ignore
	}

	return { league: DEFAULT_LEAGUE, realm: DEFAULT_REALM };
}

function saveLeagueSettings(settings: LeagueSettings): void {
	if (typeof window === "undefined") return;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function useLeague() {
	const [settings, setSettings] = useState<LeagueSettings>({
		league: DEFAULT_LEAGUE,
		realm: DEFAULT_REALM,
	});
	const [isHydrated, setIsHydrated] = useState(false);

	useEffect(() => {
		setSettings(loadLeagueSettings());
		setIsHydrated(true);
	}, []);

	useEffect(() => {
		if (!isHydrated) return;
		saveLeagueSettings(settings);
	}, [settings, isHydrated]);

	const leagues = leaguesData.result.filter(
		(l) => l.realm === settings.realm,
	) as League[];

	const setLeague = (league: string) => {
		setSettings((prev) => ({ ...prev, league }));
	};

	const setRealm = (realm: Realm) => {
		setSettings((prev) => {
			const leaguesForRealm = leaguesData.result.filter(
				(l) => l.realm === realm,
			);
			const currentLeagueExists = leaguesForRealm.some(
				(l) => l.id === prev.league,
			);
			return {
				realm,
				league: currentLeagueExists
					? prev.league
					: (leaguesForRealm[0]?.id ?? DEFAULT_LEAGUE),
			};
		});
	};

	return {
		league: settings.league,
		realm: settings.realm,
		leagues,
		setLeague,
		setRealm,
		isHydrated,
	};
}
