import rawCatalog from "./catalog.json";

export type CatalogCategory =
	| "launcher"
	| "store"
	| "media"
	| "photo"
	| "smartHome"
	| "assistant"
	| "utility";

export type AppSource = "github" | "fdroid" | "url" | "external";

/**
 * Post-install configuration for an app.
 *
 * - `commands`: declarative shell commands run to finish setup. Set `auto: true`
 *   to run them silently right after install (e.g. a launcher that becomes the
 *   default); otherwise they run when the user clicks the setup gear.
 * - `custom`: setup needs a UI (e.g. uploading credentials). `id` maps to a
 *   panel registered in `src/components/apps/setup/registry.ts`. This is the one
 *   case where a catalog entry also needs a matching code change.
 */
export type AppSetup =
	| { kind: "commands"; commands: string[]; auto?: boolean; labelKey?: string }
	| { kind: "custom"; id: string; labelKey?: string };

export interface CatalogApp {
	id: string;
	name: string;
	packageName: string;
	description: string;
	category: CatalogCategory;
	version: string;
	verified: boolean;
	featured: boolean;
	/**
	 * Where the APK comes from. `github`/`fdroid`/`url` can be installed
	 * automatically (the device downloads them); `external` only opens a page.
	 */
	source?: AppSource;
	/** `owner/repo` for `source: "github"`. */
	repo?: string;
	/** Direct APK URL for `source: "url"`. */
	apkUrl?: string;
	downloadUrl?: string;
	/** Optional remote icon URL; falls back to an initials avatar when absent. */
	iconUrl?: string;
	/** Optional post-install configuration (see {@link AppSetup}). */
	setup?: AppSetup;
	/**
	 * Skip the "update available" check for this app. Set it when upstream
	 * versioning is unreliable (e.g. release tags that don't match the APK's
	 * embedded versionName), which would otherwise surface a phantom update.
	 */
	skipUpdateCheck?: boolean;
}

// The catalog is data-only and lives in catalog.json so the community can submit
// new apps via simple PRs. See CONTRIBUTING.md for the submission format.
export const APP_CATALOG: CatalogApp[] = rawCatalog as CatalogApp[];

export function getCatalogByCategory(): Map<string, CatalogApp[]> {
	const map = new Map<string, CatalogApp[]>();
	for (const app of APP_CATALOG) {
		const existing = map.get(app.category) ?? [];
		existing.push(app);
		map.set(app.category, existing);
	}
	return map;
}

export function getFeaturedApps(): CatalogApp[] {
	return APP_CATALOG.filter((app) => app.featured);
}

const BY_PACKAGE = new Map(APP_CATALOG.map((app) => [app.packageName, app]));

/** Looks up a catalog entry by its Android package name, if any. */
export function getCatalogApp(packageName: string): CatalogApp | undefined {
	return BY_PACKAGE.get(packageName);
}
