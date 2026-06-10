import { ConfirmDialog } from "@/components/ui/primitives";
import {
	getDefaultLauncher,
	getInstalledVersion,
	launchApp,
	runPostInstall,
} from "@/lib/adb/app-manager";
import { type InstallStage, installFromUrl } from "@/lib/adb/online-install";
import type { CatalogApp } from "@/lib/portal/catalog";
import {
	canAutoInstall,
	getSourceLabel,
	getSourceUrl,
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
	Info,
	Loader2,
	Settings,
	SquareArrowOutUpRight,
	Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AppIcon } from "./AppIcon";
import { AppSetupPanel } from "./setup/AppSetupPanel";

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
	const [setupOpen, setSetupOpen] = useState(false);
	const [isDefaultLauncher, setIsDefaultLauncher] = useState(false);

	const autoInstallable = canAutoInstall(app);
	const isLauncher = app.category === "launcher";
	const setup = app.setup;
	// A launcher with auto setup runs on install; the gear is only a fallback for
	// when it has drifted from being the default again.
	const autoSetup = setup?.kind === "commands" && setup.auto === true;
	const sourceUrl = getSourceUrl(app);

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
		if (!adb || !isInstalled || !autoInstallable || app.skipUpdateCheck) return;
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
			// Auto setup (e.g. set a launcher as default) runs silently right after
			// a fresh install; the install button already advertises it.
			if (!updating && setup?.kind === "commands" && setup.auto) {
				try {
					await runPostInstall(adb, setup.commands);
					await refreshDefaultLauncher();
				} catch {
					// Best-effort; the setup gear stays available to retry.
				}
			}
		} catch (err) {
			toast.error(app.name, {
				description: err instanceof Error ? err.message : t("installFailed"),
			});
		} finally {
			setStage(null);
		}
	};

	const runCommands = async (commands: string[]) => {
		if (!adb || !commands.length) return;
		setPostInstalling(true);
		try {
			await runPostInstall(adb, commands);
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

	const handleSetup = () => {
		if (!setup) return;
		if (setup.kind === "custom") setSetupOpen(true);
		else runCommands(setup.commands);
	};

	const handleOpen = async () => {
		if (!adb) return;
		try {
			await launchApp(adb, app.packageName);
		} catch (err) {
			toast.error(app.name, {
				description: err instanceof Error ? err.message : undefined,
			});
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

	// The setup gear is the single entry point for finishing an app's setup —
	// running its commands, or opening its custom panel. Hidden once an auto
	// launcher is already the default (nothing left to do).
	const showSetupGear =
		isInstalled && !updateUrl && !!setup && !(isLauncher && isDefaultLauncher);

	return (
		<div className="flex flex-col rounded-xl border border-border bg-card p-4 transition-colors hover:border-foreground/30">
			<div className="flex items-start gap-3">
				<AppIcon
					name={app.name}
					iconUrl={app.iconUrl}
					className="h-14 w-14 shrink-0 rounded-2xl"
				/>
				<div className="min-w-0 flex-1">
					<div className="flex items-start justify-between gap-2">
						<h4 className="truncate text-sm font-semibold">{app.name}</h4>
						{sourceUrl && (
							<a
								href={sourceUrl}
								target="_blank"
								rel="noreferrer"
								title={t("viewSourceOn", { source: getSourceLabel(app) })}
								className="-mr-1 -mt-1 shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
							>
								<Info className="h-4 w-4" />
							</a>
						)}
					</div>
					<div className="mt-1 flex flex-wrap gap-1">
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
						{isLauncher && isDefaultLauncher && (
							<span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-500">
								<Check className="h-3 w-3" />
								{t("defaultLauncher")}
							</span>
						)}
					</div>
				</div>
			</div>

			<p className="mt-3 line-clamp-2 min-h-8 text-xs text-muted-foreground">
				{app.description}
			</p>

			<div className="mt-4 flex items-center gap-2">
				{stage ? (
					<span className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-xs font-medium">
						<Loader2 className="h-3.5 w-3.5 animate-spin" />
						{t(stage === "installing" ? "installingApp" : "downloading")}
					</span>
				) : isInstalled ? (
					<>
						{updateUrl ? (
							<button
								type="button"
								onClick={handleInstall}
								className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-sky-500 px-3 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90"
							>
								<ArrowUpCircle className="h-3.5 w-3.5" />
								{t("update")}
							</button>
						) : (
							<span className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-500">
								<Check className="h-3.5 w-3.5" />
								{t("installed")}
							</span>
						)}
						{showSetupGear && setup && (
							<button
								type="button"
								onClick={handleSetup}
								disabled={postInstalling}
								title={t(setup.labelKey ?? "runSetup")}
								className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
							>
								{postInstalling ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									<Settings className="h-4 w-4" />
								)}
							</button>
						)}
						<button
							type="button"
							onClick={handleOpen}
							title={t("openApp")}
							className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
						>
							<SquareArrowOutUpRight className="h-4 w-4" />
						</button>
						<button
							type="button"
							onClick={() => setConfirmUninstall(true)}
							disabled={uninstalling}
							title={t("uninstall")}
							className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50"
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
						className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-foreground px-3 py-2 text-xs font-medium text-background transition-opacity hover:opacity-90"
					>
						<Download className="h-3.5 w-3.5" />
						{t(autoSetup ? "installAndConfigure" : "install")}
					</button>
				) : (
					app.downloadUrl && (
						<a
							href={app.downloadUrl}
							target="_blank"
							rel="noreferrer"
							className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-xs font-medium transition-colors hover:bg-accent"
						>
							<ExternalLink className="h-3.5 w-3.5" />
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

			<AppSetupPanel
				app={app}
				open={setupOpen}
				onClose={() => setSetupOpen(false)}
			/>
		</div>
	);
}
