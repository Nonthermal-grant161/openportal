import {
	Button,
	ConfirmDialog,
	Modal,
	Spinner,
} from "@/components/ui/primitives";
import {
	type AppPermission,
	getAppPermissions,
	getInstalledVersion,
} from "@/lib/adb/app-manager";
import type { InstalledPackage } from "@/lib/adb/types";
import {
	type CatalogApp,
	getAppIconUrl,
	getAppShareUrl,
	getCatalogApp,
} from "@/lib/portal/catalog";
import {
	canAutoInstall,
	getSourceLabel,
	getSourceUrl,
} from "@/lib/portal/sources";
import { useAppStore } from "@/store/app-store";
import { useDeviceStore } from "@/store/device-store";
import { useUIStore } from "@/store/ui-store";
import {
	ArrowUpCircle,
	Check,
	Download,
	ExternalLink,
	KeyRound,
	Link2,
	Octagon,
	Settings,
	Sparkles,
	SquareArrowOutUpRight,
	Trash,
	Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AppBadge } from "./AppBadge";
import { AppIcon } from "./AppIcon";
import { InstallProgress } from "./InstallProgress";
import { AppSetupPanel } from "./setup/AppSetupPanel";
import { useAppActions } from "./use-app-actions";

export function AppDetailSheet({
	app,
	pkg,
	open,
	onClose,
}: {
	app?: CatalogApp;
	pkg?: InstalledPackage | null;
	open: boolean;
	onClose: () => void;
}) {
	const { t } = useTranslation("apps");
	const adb = useDeviceStore((s) => s.adb);
	const advanced = useUIStore((s) => s.mode) === "advanced";

	const catApp = app ?? (pkg ? getCatalogApp(pkg.packageName) : undefined);
	const packageName = catApp?.packageName ?? pkg?.packageName ?? "";
	const name = catApp?.name ?? packageName;
	const isSystem = pkg?.isSystem ?? false;

	const actions = useAppActions(packageName, name);
	const isDefaultLauncher = useAppStore(
		(s) => s.defaultLauncher === packageName,
	);
	const storeVersion = useAppStore((s) => s.versions[packageName]);

	const [liveVersion, setLiveVersion] = useState<string | null>(null);
	const [copiedLink, setCopiedLink] = useState(false);
	const [confirmUninstall, setConfirmUninstall] = useState(false);
	const [confirmClear, setConfirmClear] = useState(false);
	const [setupOpen, setSetupOpen] = useState(false);
	const [permsOpen, setPermsOpen] = useState(false);
	const [perms, setPerms] = useState<AppPermission[] | null>(null);

	useEffect(() => {
		if (!open) {
			setLiveVersion(null);
			setPermsOpen(false);
			setPerms(null);
			setCopiedLink(false);
			return;
		}
		if (!adb || !packageName || !actions.isInstalled || actions.busy !== null)
			return;
		let cancelled = false;
		getInstalledVersion(adb, packageName)
			.then((v) => {
				if (!cancelled && v?.versionName) setLiveVersion(v.versionName);
			})
			.catch(() => {});
		return () => {
			cancelled = true;
		};
	}, [open, adb, packageName, actions.isInstalled, actions.busy]);

	useEffect(() => {
		if (!permsOpen || !adb || !packageName) return;
		let cancelled = false;
		setPerms(null);
		getAppPermissions(adb, packageName)
			.then((result) => {
				if (!cancelled) setPerms(result);
			})
			.catch(() => {
				if (!cancelled) setPerms([]);
			});
		return () => {
			cancelled = true;
		};
	}, [permsOpen, adb, packageName]);

	const setup = catApp?.setup;
	const showSetup =
		actions.isInstalled &&
		!!setup &&
		!(catApp?.category === "launcher" && isDefaultLauncher);
	const handleSetup = () => {
		if (!setup) return;
		if (setup.kind === "custom") setSetupOpen(true);
		else actions.runSetup();
	};

	const handleCopyLink = async () => {
		try {
			await navigator.clipboard.writeText(getAppShareUrl(packageName));
			setCopiedLink(true);
			toast.success(t("linkCopied"));
			setTimeout(() => setCopiedLink(false), 1500);
		} catch {
			toast.error(t("actionFailed"));
		}
	};

	const sourceUrl = catApp ? getSourceUrl(catApp) : undefined;
	const version = actions.isInstalled ? (liveVersion ?? storeVersion) : null;
	const autoSetup = setup?.kind === "commands" && setup.auto === true;

	return (
		<>
			<Modal open={open} onClose={onClose} title={t("viewDetails")}>
				<div className="space-y-4">
					<div className="flex items-start gap-3">
						<AppIcon
							name={name}
							iconUrl={catApp ? getAppIconUrl(catApp) : undefined}
							className="h-14 w-14 shrink-0 rounded-2xl"
						/>
						<div className="min-w-0 flex-1">
							<h4 className="truncate text-base font-semibold">{name}</h4>
							<p className="truncate font-mono text-[11px] text-muted-foreground">
								{packageName}
							</p>
							<div className="mt-1.5 flex flex-wrap gap-1">
								{catApp?.madeForPortal && (
									<AppBadge tone="violet">
										<Sparkles className="h-3 w-3" />
										{t("madeForPortal")}
									</AppBadge>
								)}
								{catApp?.category === "launcher" && isDefaultLauncher && (
									<AppBadge tone="emerald">
										<Check className="h-3 w-3" />
										{t("defaultLauncher")}
									</AppBadge>
								)}
								{actions.hasUpdate && (
									<AppBadge tone="amber">
										<ArrowUpCircle className="h-3 w-3" />
										{t("updateAvailable")}
									</AppBadge>
								)}
								{isSystem && <AppBadge>{t("systemApp")}</AppBadge>}
							</div>
						</div>
						{catApp && (
							<button
								type="button"
								onClick={handleCopyLink}
								title={t("copyLink")}
								aria-label={t("copyLink")}
								className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							>
								{copiedLink ? (
									<Check className="h-3.5 w-3.5 text-emerald-500" />
								) : (
									<Link2 className="h-3.5 w-3.5" />
								)}
								<span className="hidden sm:inline">
									{copiedLink ? t("linkCopied") : t("copyLink")}
								</span>
							</button>
						)}
					</div>

					{catApp?.description && (
						<p className="text-xs text-muted-foreground">
							{catApp.description}
						</p>
					)}

					{(version || actions.update || sourceUrl) && (
						<dl className="space-y-1.5 rounded-lg border border-border bg-background/50 px-3 py-2.5 text-xs">
							{version && (
								<InfoRow label={t("installedVersion")} value={version} />
							)}
							{actions.update && (
								<InfoRow
									label={t("latestVersion")}
									value={actions.update.latestVersion}
								/>
							)}
							{catApp && sourceUrl && (
								<div className="flex items-center justify-between gap-3">
									<dt className="text-muted-foreground">{t("source")}</dt>
									<dd>
										<a
											href={sourceUrl}
											target="_blank"
											rel="noreferrer"
											className="flex items-center gap-1 font-medium hover:underline"
										>
											{getSourceLabel(catApp)}
											<ExternalLink className="h-3 w-3" />
										</a>
									</dd>
								</div>
							)}
						</dl>
					)}

					<div className="flex flex-wrap gap-2">
						{actions.stage ? (
							<InstallProgress
								stage={actions.stage}
								percent={actions.progress}
							/>
						) : actions.isInstalled ? (
							<>
								{actions.hasUpdate && (
									<Button
										onClick={actions.install}
										disabled={actions.busy !== null}
										className="bg-amber-500 text-amber-950 hover:bg-amber-400"
									>
										<ArrowUpCircle className="h-4 w-4" />
										{t("update")}
									</Button>
								)}
								<Button
									onClick={actions.open}
									disabled={actions.busy !== null}
									loading={actions.busy === "open"}
								>
									{actions.busy !== "open" && (
										<SquareArrowOutUpRight className="h-4 w-4" />
									)}
									{t("openApp")}
								</Button>
								{showSetup && setup && (
									<Button
										onClick={handleSetup}
										disabled={actions.busy !== null}
										loading={actions.busy === "setup"}
									>
										{actions.busy !== "setup" && (
											<Settings className="h-4 w-4" />
										)}
										{t(setup.labelKey ?? "runSetup")}
									</Button>
								)}
								{!isSystem && (
									<Button
										variant="danger"
										onClick={() => setConfirmUninstall(true)}
										disabled={actions.busy !== null}
										loading={actions.busy === "uninstall"}
									>
										{actions.busy !== "uninstall" && (
											<Trash2 className="h-4 w-4" />
										)}
										{t("uninstall")}
									</Button>
								)}
							</>
						) : catApp && canAutoInstall(catApp) ? (
							<Button
								variant="primary"
								className="flex-1"
								onClick={actions.install}
								disabled={actions.busy !== null}
							>
								<Download className="h-4 w-4" />
								{t(autoSetup ? "installAndConfigure" : "install")}
							</Button>
						) : (
							catApp?.downloadUrl && (
								<a
									href={catApp.downloadUrl}
									target="_blank"
									rel="noreferrer"
									className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-sm font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
								>
									<ExternalLink className="h-4 w-4" />
									{t("openPage")}
								</a>
							)
						)}
					</div>

					{advanced && actions.isInstalled && adb && (
						<div className="space-y-3 border-t border-border pt-3">
							<div className="flex flex-wrap gap-2">
								<Button
									variant="ghost"
									onClick={actions.forceStop}
									disabled={actions.busy !== null}
									loading={actions.busy === "forceStop"}
								>
									{actions.busy !== "forceStop" && (
										<Octagon className="h-4 w-4" />
									)}
									{t("forceStop")}
								</Button>
								<Button
									variant="ghost"
									onClick={() => setConfirmClear(true)}
									disabled={actions.busy !== null}
									loading={actions.busy === "clearData"}
								>
									{actions.busy !== "clearData" && (
										<Trash className="h-4 w-4" />
									)}
									{t("clearData")}
								</Button>
								<Button variant="ghost" onClick={() => setPermsOpen((v) => !v)}>
									<KeyRound className="h-4 w-4" />
									{t("permissions")}
								</Button>
							</div>
							{permsOpen &&
								(perms === null ? (
									<div className="flex justify-center py-4">
										<Spinner />
									</div>
								) : perms.length === 0 ? (
									<p className="py-2 text-center text-xs text-muted-foreground">
										{t("noPermissions")}
									</p>
								) : (
									<ul className="max-h-56 space-y-1 overflow-auto">
										{perms.map((perm) => (
											<li
												key={perm.name}
												className="flex items-center justify-between gap-3 rounded-md px-2 py-1 text-xs"
											>
												<span className="truncate font-mono">{perm.name}</span>
												<span
													className={
														perm.granted
															? "text-emerald-500"
															: "text-muted-foreground"
													}
												>
													{t(perm.granted ? "granted" : "denied")}
												</span>
											</li>
										))}
									</ul>
								))}
						</div>
					)}
				</div>
			</Modal>

			<ConfirmDialog
				open={confirmUninstall}
				onClose={() => setConfirmUninstall(false)}
				onConfirm={actions.uninstall}
				title={t("uninstall")}
				message={t("uninstallConfirm", { name })}
				confirmLabel={t("uninstall")}
				danger
			/>

			<ConfirmDialog
				open={confirmClear}
				onClose={() => setConfirmClear(false)}
				onConfirm={actions.clearData}
				title={t("clearData")}
				message={t("clearDataConfirm", { name })}
				confirmLabel={t("clearData")}
				danger
			/>

			{catApp && (
				<AppSetupPanel
					app={catApp}
					open={setupOpen}
					onClose={() => setSetupOpen(false)}
				/>
			)}
		</>
	);
}

function InfoRow({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex items-center justify-between gap-3">
			<dt className="text-muted-foreground">{label}</dt>
			<dd className="truncate font-medium">{value}</dd>
		</div>
	);
}
