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
	const installedPackages = useAppStore((s) => s.installedPackages);
	const loading = useAppStore((s) => s.loading);
	const [tab, setTab] = useState<Tab>("catalog");
	const [apkOpen, setApkOpen] = useState(false);

	useEffect(() => {
		refreshInstalled();
	}, [refreshInstalled]);

	const userCount = installedPackages.filter((p) => !p.isSystem).length;
	const isCatalog = tab === "catalog";

	return (
		<div className="space-y-5">
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
							},
						]}
					/>
					{!isCatalog && (
						<button
							type="button"
							onClick={() => refreshInstalled()}
							title={t("refresh")}
							className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
						>
							<RefreshCw
								className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
							/>
						</button>
					)}
					<Button variant="primary" onClick={() => setApkOpen(true)}>
						<FileUp className="h-4 w-4" />
						{t("installApk")}
					</Button>
				</div>
			</div>

			{isCatalog ? <AppCatalog /> : <InstalledAppsList />}

			<ApkInstallModal open={apkOpen} onClose={() => setApkOpen(false)} />
			<ApkDropOverlay />
		</div>
	);
}
