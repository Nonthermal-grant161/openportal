import { getCatalogByCategory } from "@/lib/portal/catalog";
import { useUIStore } from "@/store/ui-store";
import { useTranslation } from "react-i18next";
import { AppCard } from "./AppCard";

const CATEGORY_ORDER = [
	"launcher",
	"store",
	"photo",
	"media",
	"smartHome",
	"assistant",
	"utility",
] as const;

export function AppCatalog() {
	const { t } = useTranslation("apps");
	const { mode } = useUIStore();
	const catalog = getCatalogByCategory();

	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-semibold">{t("catalog")}</h3>
				<p className="text-sm text-muted-foreground">
					{t("catalogDescription")}
				</p>
			</div>

			{CATEGORY_ORDER.map((category) => {
				const apps = catalog.get(category);
				if (!apps?.length) return null;

				const visibleApps =
					mode === "classic" ? apps.filter((a) => a.featured) : apps;
				if (!visibleApps.length) return null;

				return (
					<div key={category}>
						<h4 className="mb-3 text-sm font-medium text-muted-foreground">
							{t(`category.${category}`)}
						</h4>
						<div className="space-y-2">
							{visibleApps.map((app) => (
								<AppCard key={app.id} app={app} />
							))}
						</div>
					</div>
				);
			})}
		</div>
	);
}
