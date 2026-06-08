import rawCatalog from "./catalog.json";

export type CatalogCategory =
	| "launcher"
	| "store"
	| "media"
	| "photo"
	| "smartHome"
	| "assistant"
	| "utility";

export interface CatalogApp {
	id: string;
	name: string;
	packageName: string;
	description: string;
	category: CatalogCategory;
	version: string;
	verified: boolean;
	featured: boolean;
	downloadUrl?: string;
	/** Optional remote icon URL; falls back to an initials avatar when absent. */
	iconUrl?: string;
	/** Shell commands run after the app is installed to finish setup. */
	postInstallCommands?: string[];
	/** i18n key (apps namespace) for the post-install button label. */
	postInstallLabelKey?: string;
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
