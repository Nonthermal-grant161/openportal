import {
	ApkDropOverlay,
	ApkInstallModal,
} from "@/components/apps/ApkInstaller";
import { AppCatalog } from "@/components/apps/AppCatalog";
import { InstalledAppsList } from "@/components/apps/InstalledAppsList";
import { Button, Segmented } from "@/components/ui/primitives";
import { useAppStore } from "@/store/app-store";
import { FileUp, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

type Tab = "catalog" | "installed";

export function AppsPage() {
	const { t } = useTranslation("apps");
	const refreshInstalled = useAppStore((s) => s.refreshInstalled);
	const checkUpdates = useAppStore((s) => s.checkUpdates);
	const refreshDefaultLauncher = useAppStore((s) => s.refreshDefaultLauncher);
	const installedPackages = useAppStore((s) => s.installedPackages);
	const updates = useAppStore((s) => s.updates);
	const loading = useAppStore((s) => s.loading);
	const [tab, setTab] = useState<Tab>("catalog");
	const [apkOpen, setApkOpen] = useState(false);

	useEffect(() => {
		refreshInstalled().then(() => {
			checkUpdates();
			refreshDefaultLauncher();
		});
	}, [refreshInstalled, checkUpdates, refreshDefaultLauncher]);

	const handleRefresh = () => {
		refreshInstalled().then(() => {
			checkUpdates(true);
			refreshDefaultLauncher();
		});
	};

	const userCount = installedPackages.filter((p) => !p.isSystem).length;
	const updateCount = Object.keys(updates).length;
	const isCatalog = tab === "catalog";

	return (
		<div className="mx-auto max-w-4xl space-y-5">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<h1 className="text-2xl font-bold">
						{t(isCatalog ? "catalog" : "manageInstalled")}
					</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						{t(isCatalog ? "catalogDescription" : "manageInstalledDesc")}
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<Segmented
						value={tab}
						onChange={setTab}
						options={[
							{ value: "catalog", label: t("tabCatalog") },
							{
								value: "installed",
								label: t("tabInstalled"),
								badge: userCount || undefined,
								dot: updateCount > 0,
							},
						]}
					/>
					<button
						type="button"
						onClick={handleRefresh}
						title={t("refresh")}
						aria-label={t("refresh")}
						className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
					>
						<RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
					</button>
					<Button variant="primary" onClick={() => setApkOpen(true)}>
						<FileUp className="h-4 w-4" />
						{t("installApk")}
					</Button>
				</div>
			</div>

			<div className={isCatalog ? undefined : "hidden"}>
				<AppCatalog />
			</div>
			<div className={isCatalog ? "hidden" : undefined}>
				<InstalledAppsList />
			</div>

			<ApkInstallModal open={apkOpen} onClose={() => setApkOpen(false)} />
			<ApkDropOverlay />
		</div>
	);
}
