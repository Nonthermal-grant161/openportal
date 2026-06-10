import { deviceFetchText } from "@/lib/adb/online-install";
import type { Adb } from "@yume-chan/adb";
import type { CatalogApp } from "./catalog";

export interface ResolvedApk {
	version: string;
	url: string;
}

export function canAutoInstall(app: CatalogApp): boolean {
	return (
		app.source === "github" || app.source === "fdroid" || app.source === "url"
	);
}

/** Best-effort link to where an app comes from, for a "view source" affordance. */
export function getSourceUrl(app: CatalogApp): string | undefined {
	switch (app.source) {
		case "github":
			return app.repo ? `https://github.com/${app.repo}` : app.downloadUrl;
		case "fdroid":
			return `https://f-droid.org/packages/${app.packageName}`;
		case "url":
			return app.apkUrl ?? app.downloadUrl;
		default:
			return app.downloadUrl;
	}
}

/** Human-facing name of the app's source provider (GitHub, F-Droid, …). */
export function getSourceLabel(app: CatalogApp): string {
	switch (app.source) {
		case "github":
			return "GitHub";
		case "fdroid":
			return "F-Droid";
		default:
			return "Web";
	}
}

interface GithubAsset {
	name: string;
	browser_download_url: string;
}
interface GithubRelease {
	tag_name?: string;
	assets?: GithubAsset[];
}

/** Reads the latest GitHub release from api.github.com (CORS-friendly). */
export async function resolveGithubLatest(repo: string): Promise<ResolvedApk> {
	const res = await fetch(
		`https://api.github.com/repos/${repo}/releases/latest`,
		{ headers: { Accept: "application/vnd.github+json" } },
	);
	if (!res.ok) {
		throw new Error(`GitHub API returned ${res.status}`);
	}
	const data = (await res.json()) as GithubRelease;
	const apk = data.assets?.find((a) => a.name.toLowerCase().endsWith(".apk"));
	if (!apk) {
		throw new Error("No APK in the latest GitHub release");
	}
	return {
		version: (data.tag_name ?? "").replace(/^v/i, ""),
		url: apk.browser_download_url,
	};
}

interface FdroidPackage {
	versionName?: string;
	versionCode: number;
}
interface FdroidResponse {
	suggestedVersionCode?: number;
	packages?: FdroidPackage[];
}

/**
 * Resolves the latest F-Droid build. The API is fetched *from the device*
 * (CORS-blocked for the browser), then the predictable repo URL is built.
 */
export async function resolveFdroidLatest(
	adb: Adb,
	packageName: string,
): Promise<ResolvedApk> {
	const json = await deviceFetchText(
		adb,
		`https://f-droid.org/api/v1/packages/${packageName}`,
	);
	const data = JSON.parse(json) as FdroidResponse;
	const code = data.suggestedVersionCode ?? data.packages?.[0]?.versionCode;
	if (!code) {
		throw new Error("No F-Droid build found for this package");
	}
	const entry =
		data.packages?.find((p) => p.versionCode === code) ?? data.packages?.[0];
	return {
		version: entry?.versionName ?? String(code),
		url: `https://f-droid.org/repo/${packageName}_${code}.apk`,
	};
}

export async function resolveApk(
	adb: Adb,
	app: CatalogApp,
): Promise<ResolvedApk> {
	switch (app.source) {
		case "github":
			if (!app.repo) throw new Error("Missing GitHub repo");
			return resolveGithubLatest(app.repo);
		case "fdroid":
			return resolveFdroidLatest(adb, app.packageName);
		case "url":
			if (!app.apkUrl) throw new Error("Missing APK URL");
			return { version: app.version, url: app.apkUrl };
		default:
			throw new Error("This app can't be installed automatically");
	}
}

/** Loose version comparison for a best-effort "update available" signal. */
export function isNewerVersion(latest: string, installed: string): boolean {
	const a = latest.trim().replace(/^v/i, "");
	const b = installed.trim().replace(/^v/i, "");
	if (!a || !b) return false;
	if (a === b) return false;
	// Treat "2.3" and "2.3.0" / "2.3-foo" as the same.
	return !a.startsWith(b) && !b.startsWith(a);
}
