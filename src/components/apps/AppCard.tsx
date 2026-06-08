import { ConfirmDialog } from "@/components/ui/primitives";
import {
	getDefaultLauncher,
	getInstalledVersion,
	runPostInstall,
} from "@/lib/adb/app-manager";
import { type InstallStage, installFromUrl } from "@/lib/adb/online-install";
import type { CatalogApp } from "@/lib/portal/catalog";
import {
	canAutoInstall,
	isNewerVersion,
	resolveApk,
} from "@/lib/portal/sources";
import { useAppStore } from "@/store/app-store";
import { useDeviceStore } from "@/store/device-store";
import {
	ArrowUpCircle,
	Check,
	Download,
	ExternalLink,
	Loader2,
	Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AppIcon } from "./AppIcon";

export function AppCard({ app }: { app: CatalogApp }) {
	const { t } = useTranslation("apps");
	const adb = useDeviceStore((s) => s.adb);
	const isInstalled = useAppStore((s) => s.isInstalled(app.packageName));
	const refreshInstalled = useAppStore((s) => s.refreshInstalled);
	const uninstall = useAppStore((s) => s.uninstall);

	const [stage, setStage] = useState<InstallStage | null>(null);
	const [updateUrl, setUpdateUrl] = useState<string | null>(null);
	const [postInstalling, setPostInstalling] = useState(false);
	const [uninstalling, setUninstalling] = useState(false);
	const [confirmUninstall, setConfirmUninstall] = useState(false);
	const [isDefaultLauncher, setIsDefaultLauncher] = useState(false);

	const autoInstallable = canAutoInstall(app);
	const isLauncher = app.category === "launcher";

	const refreshDefaultLauncher = useCallback(async () => {
		if (!adb || !isLauncher) return;
		try {
			const current = await getDefaultLauncher(adb);
			setIsDefaultLauncher(current === app.packageName);
		} catch {
			// Best-effort; ignore.
		}
	}, [adb, isLauncher, app.packageName]);

	useEffect(() => {
		if (isInstalled) refreshDefaultLauncher();
		else setIsDefaultLauncher(false);
	}, [isInstalled, refreshDefaultLauncher]);

	// Best-effort "update available" check for installed, auto-installable apps.
	useEffect(() => {
		if (!adb || !isInstalled || !autoInstallable) return;
		let cancelled = false;
		(async () => {
			try {
				const [latest, installed] = await Promise.all([
					resolveApk(adb, app),
					getInstalledVersion(adb, app.packageName),
				]);
				if (
					!cancelled &&
					installed &&
					isNewerVersion(latest.version, installed.versionName)
				) {
					setUpdateUrl(latest.url);
				}
			} catch {
				// Update checks are best-effort; ignore failures.
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [adb, isInstalled, autoInstallable, app]);

	const handleInstall = async () => {
		if (!adb || stage) return;
		const updating = updateUrl !== null;
		setStage("downloading");
		try {
			const url = updateUrl ?? (await resolveApk(adb, app)).url;
			await installFromUrl(adb, url, (s) => setStage(s));
			toast.success(app.name, {
				description: t(updating ? "updated" : "installed"),
			});
			setUpdateUrl(null);
			await refreshInstalled();
		} catch (err) {
			toast.error(app.name, {
				description: err instanceof Error ? err.message : t("installFailed"),
			});
		} finally {
			setStage(null);
		}
	};

	const handlePostInstall = async () => {
		if (!adb || !app.postInstallCommands?.length) return;
		setPostInstalling(true);
		try {
			await runPostInstall(adb, app.postInstallCommands);
			toast.success(app.name, { description: t("postInstallDone") });
			await refreshDefaultLauncher();
		} catch (err) {
			toast.error(app.name, {
				description: err instanceof Error ? err.message : undefined,
			});
		} finally {
			setPostInstalling(false);
		}
	};

	const handleUninstall = async () => {
		setUninstalling(true);
		try {
			await uninstall(app.packageName);
			toast.success(t("uninstalled", { name: app.name }));
			setUpdateUrl(null);
		} catch (err) {
			toast.error(app.name, {
				description: err instanceof Error ? err.message : undefined,
			});
		} finally {
			setUninstalling(false);
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
					{updateUrl && (
						<span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] font-medium text-sky-500">
							{t("updateAvailable")}
						</span>
					)}
				</div>
				<p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
					{app.description}
				</p>
			</div>

			<div className="flex shrink-0 items-center gap-2">
				{stage ? (
					<span className="flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium">
						<Loader2 className="h-3 w-3 animate-spin" />
						{t(stage === "installing" ? "installingApp" : "downloading")}
					</span>
				) : isInstalled ? (
					<>
						{updateUrl ? (
							<button
								type="button"
								onClick={handleInstall}
								className="flex items-center gap-1.5 rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
							>
								<ArrowUpCircle className="h-3 w-3" />
								{t("update")}
							</button>
						) : (
							<>
								<span className="text-xs text-emerald-500">
									{t("installed")}
								</span>
								{isLauncher && isDefaultLauncher ? (
									<span className="flex items-center gap-1 px-1 text-xs font-medium text-emerald-500">
										<Check className="h-3 w-3" />
										{t("defaultLauncher")}
									</span>
								) : (
									app.postInstallCommands && (
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
									)
								)}
							</>
						)}
						<button
							type="button"
							onClick={() => setConfirmUninstall(true)}
							disabled={uninstalling}
							title={t("uninstall")}
							className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50"
						>
							{uninstalling ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<Trash2 className="h-4 w-4" />
							)}
						</button>
					</>
				) : autoInstallable ? (
					<button
						type="button"
						onClick={handleInstall}
						className="flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background transition-opacity hover:opacity-90"
					>
						<Download className="h-3 w-3" />
						{t("install")}
					</button>
				) : (
					app.downloadUrl && (
						<a
							href={app.downloadUrl}
							target="_blank"
							rel="noreferrer"
							className="flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent"
						>
							<ExternalLink className="h-3 w-3" />
							{t("openPage")}
						</a>
					)
				)}
			</div>

			<ConfirmDialog
				open={confirmUninstall}
				onClose={() => setConfirmUninstall(false)}
				onConfirm={handleUninstall}
				title={t("uninstall")}
				message={t("uninstallConfirm", { name: app.name })}
				confirmLabel={t("uninstall")}
				danger
			/>
		</div>
	);
}
