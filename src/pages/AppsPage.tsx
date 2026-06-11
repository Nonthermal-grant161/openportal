import {
	ApkDropOverlay,
	ApkInstallModal,
} from "@/components/apps/ApkInstaller";
import { AppCatalog } from "@/components/apps/AppCatalog";
import { InstalledAppsList } from "@/components/apps/InstalledAppsList";
import { Button, Segmented } from "@/components/ui/primitives";
import { useAppStore } from "@/store/app-store";
import { FileUp, Monitor, RefreshCw, Usb } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

type Tab = "catalog" | "installed";

export function AppsPage({ visitor = false }: { visitor?: boolean }) {
	const { t } = useTranslation("apps");
	const { t: tCommon } = useTranslation();
	const refreshInstalled = useAppStore((s) => s.refreshInstalled);
	const checkUpdates = useAppStore((s) => s.checkUpdates);
	const refreshDefaultLauncher = useAppStore((s) => s.refreshDefaultLauncher);
	const installedPackages = useAppStore((s) => s.installedPackages);
	const updates = useAppStore((s) => s.updates);
	const loading = useAppStore((s) => s.loading);
	const [tab, setTab] = useState<Tab>("catalog");
	const [apkOpen, setApkOpen] = useState(false);

	useEffect(() => {
		if (visitor) return;
		refreshInstalled().then(() => {
			checkUpdates();
			refreshDefaultLauncher();
		});
	}, [visitor, refreshInstalled, checkUpdates, refreshDefaultLauncher]);

	const handleRefresh = () => {
		refreshInstalled().then(() => {
			checkUpdates(true);
			refreshDefaultLauncher();
		});
	};

	const userCount = installedPackages.filter((p) => !p.isSystem).length;
	const updateCount = Object.keys(updates).length;
	const isCatalog = tab === "catalog";

	const content = (
		<>
			<div className="flex items-start gap-3">
				<div className="min-w-0 flex-1">
					<h1 className="text-2xl font-bold">
						{t(isCatalog ? "catalog" : "manageInstalled")}
					</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						{t(
							visitor
								? "visitorCatalogDescription"
								: isCatalog
									? "catalogDescription"
									: "manageInstalledDesc",
						)}
					</p>
				</div>
				<div className="flex shrink-0 flex-wrap items-center gap-2">
					{!visitor && (
						<>
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
								<RefreshCw
									className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
								/>
							</button>
							<Button variant="primary" onClick={() => setApkOpen(true)}>
								<FileUp className="h-4 w-4" />
								{t("installApk")}
							</Button>
						</>
					)}
				</div>
			</div>

			{visitor && (
				<div className="flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm">
					<Usb className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
					<p className="text-muted-foreground">{t("visitorConnectHint")}</p>
				</div>
			)}

			<div className={isCatalog ? undefined : "hidden"}>
				<AppCatalog />
			</div>
			{!visitor && (
				<div className={isCatalog ? "hidden" : undefined}>
					<InstalledAppsList />
				</div>
			)}

			{!visitor && (
				<>
					<ApkInstallModal open={apkOpen} onClose={() => setApkOpen(false)} />
					<ApkDropOverlay />
				</>
			)}
		</>
	);

	if (visitor) {
		return (
			<div className="min-h-screen bg-background text-foreground">
				<header className="border-b border-border">
					<div className="mx-auto flex h-14 max-w-4xl items-center gap-3 px-4 md:px-6">
						<Monitor className="h-5 w-5" />
						<span className="font-semibold">{tCommon("appName")}</span>
					</div>
				</header>
				<main className="mx-auto max-w-4xl space-y-5 p-4 md:p-6">
					{content}
				</main>
			</div>
		);
	}

	return <div className="mx-auto max-w-4xl space-y-5">{content}</div>;
}
