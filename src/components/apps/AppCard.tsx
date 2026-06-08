import { runPostInstall } from "@/lib/adb/app-manager";
import type { CatalogApp } from "@/lib/portal/catalog";
import { useAppStore } from "@/store/app-store";
import { useDeviceStore } from "@/store/device-store";
import { Download, ExternalLink, Loader2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AppIcon } from "./AppIcon";

export function AppCard({ app }: { app: CatalogApp }) {
	const { t } = useTranslation("apps");
	const isInstalled = useAppStore((s) => s.isInstalled(app.packageName));
	const [postInstalling, setPostInstalling] = useState(false);
	const adb = useDeviceStore((s) => s.adb);

	const handlePostInstall = async () => {
		if (!adb || !app.postInstallCommands?.length) return;
		setPostInstalling(true);
		try {
			await runPostInstall(adb, app.postInstallCommands);
			toast.success(app.name, { description: t("postInstallDone") });
		} catch (err) {
			toast.error(app.name, {
				description: err instanceof Error ? err.message : undefined,
			});
		} finally {
			setPostInstalling(false);
		}
	};

	return (
		<div className="flex items-start gap-4 rounded-xl border border-border bg-card p-4">
			<AppIcon
				name={app.name}
				iconUrl={app.iconUrl}
				className="h-12 w-12 shrink-0 rounded-xl"
			/>
			<div className="min-w-0 flex-1">
				<div className="flex flex-wrap items-center gap-2">
					<h4 className="text-sm font-medium">{app.name}</h4>
					{app.verified && (
						<span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-500">
							{t("verified")}
						</span>
					)}
					{app.downloadUrl && (
						<a
							href={app.downloadUrl}
							target="_blank"
							rel="noreferrer"
							className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
						>
							<ExternalLink className="h-3 w-3" />
							{t("getApk")}
						</a>
					)}
				</div>
				<p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
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
								onClick={handlePostInstall}
								disabled={postInstalling}
								className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent disabled:opacity-50"
							>
								{postInstalling ? (
									<Loader2 className="h-3 w-3 animate-spin" />
								) : (
									t(app.postInstallLabelKey ?? "installAndSetup")
								)}
							</button>
						)}
					</div>
				) : (
					<button
						type="button"
						disabled
						className="flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background opacity-50"
						title={t("dragDropToInstall")}
					>
						<Download className="h-3 w-3" />
						{t("install")}
					</button>
				)}
			</div>
		</div>
	);
}
