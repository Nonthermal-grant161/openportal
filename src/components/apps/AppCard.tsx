import { Download, Loader2, Package } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { execShell } from "@/lib/adb/shell";
import type { CatalogApp } from "@/lib/portal/catalog";
import { useAppStore } from "@/store/app-store";
import { useDeviceStore } from "@/store/device-store";

export function AppCard({ app }: { app: CatalogApp }) {
	const { t } = useTranslation("apps");
	const isInstalled = useAppStore((s) => s.isInstalled(app.packageName));
	const [postInstalling, setPostInstalling] = useState(false);
	const adb = useDeviceStore((s) => s.adb);

	const runPostInstall = async () => {
		if (!adb || !app.postInstallCommands?.length) return;
		setPostInstalling(true);
		try {
			for (const cmd of app.postInstallCommands) {
				await execShell(adb, cmd);
			}
		} finally {
			setPostInstalling(false);
		}
	};

	return (
		<div className="flex items-start gap-4 rounded-xl border border-border bg-card p-4">
			<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary">
				<Package className="h-6 w-6 text-muted-foreground" />
			</div>
			<div className="min-w-0 flex-1">
				<div className="flex items-center gap-2">
					<h4 className="text-sm font-medium">{app.name}</h4>
					{app.verified && (
						<span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-500">
							{t("verified")}
						</span>
					)}
				</div>
				<p className="mt-1 text-xs text-muted-foreground line-clamp-2">
					{app.description}
				</p>
			</div>
			<div className="shrink-0">
				{isInstalled ? (
					<div className="flex items-center gap-2">
						<span className="text-xs text-emerald-500">{t("installed")}</span>
						{app.postInstallCommands && (
							<button
								type="button"
								onClick={runPostInstall}
								disabled={postInstalling}
								className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent"
							>
								{postInstalling ? (
									<Loader2 className="h-3 w-3 animate-spin" />
								) : (
									t("setAsDefault")
								)}
							</button>
						)}
					</div>
				) : (
					<button
						type="button"
						disabled
						className="flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background opacity-50"
						title="Drag & drop the APK to install"
					>
						<Download className="h-3 w-3" />
						{t("install")}
					</button>
				)}
			</div>
		</div>
	);
}
