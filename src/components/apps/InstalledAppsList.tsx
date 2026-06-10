import {
	ConfirmDialog,
	EmptyState,
	Modal,
	Segmented,
	Spinner,
} from "@/components/ui/primitives";
import {
	type AppPermission,
	clearAppData,
	forceStopApp,
	getAppPermissions,
	launchApp,
} from "@/lib/adb/app-manager";
import type { InstalledPackage } from "@/lib/adb/types";
import { getCatalogApp } from "@/lib/portal/catalog";
import { useAppStore } from "@/store/app-store";
import { useDeviceStore } from "@/store/device-store";
import { useUIStore } from "@/store/ui-store";
import {
	Boxes,
	KeyRound,
	Loader2,
	Octagon,
	Search,
	SquareArrowOutUpRight,
	Trash,
	Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AppIcon } from "./AppIcon";

type Filter = "all" | "user" | "system";

export function InstalledAppsList() {
	const { t } = useTranslation("apps");
	const mode = useUIStore((s) => s.mode);
	const adb = useDeviceStore((s) => s.adb);
	const packages = useAppStore((s) => s.installedPackages);
	const loading = useAppStore((s) => s.loading);
	const refreshInstalled = useAppStore((s) => s.refreshInstalled);
	const uninstall = useAppStore((s) => s.uninstall);

	const advanced = mode === "advanced";
	const [filter, setFilter] = useState<Filter>("user");
	const [search, setSearch] = useState("");
	const [busy, setBusy] = useState<string | null>(null);
	const [toUninstall, setToUninstall] = useState<InstalledPackage | null>(null);
	const [toClear, setToClear] = useState<InstalledPackage | null>(null);
	const [permsFor, setPermsFor] = useState<InstalledPackage | null>(null);

	useEffect(() => {
		refreshInstalled();
	}, [refreshInstalled]);

	// Classic mode only ever deals with user-installed apps.
	const effectiveFilter: Filter = advanced ? filter : "user";

	const filtered = useMemo(() => {
		const query = search.toLowerCase();
		return packages
			.filter((pkg) =>
				effectiveFilter === "all"
					? true
					: effectiveFilter === "system"
						? pkg.isSystem
						: !pkg.isSystem,
			)
			.filter((pkg) => pkg.packageName.toLowerCase().includes(query))
			.sort((a, b) => a.packageName.localeCompare(b.packageName));
	}, [packages, effectiveFilter, search]);

	const runAction = async (
		pkg: InstalledPackage,
		action: () => Promise<void>,
		successMessage: string,
	) => {
		setBusy(pkg.packageName);
		try {
			await action();
			toast.success(successMessage);
		} catch (err) {
			toast.error(t("actionFailed"), {
				description: err instanceof Error ? err.message : pkg.packageName,
			});
		} finally {
			setBusy(null);
		}
	};

	return (
		<div className="space-y-4">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
				{advanced && (
					<Segmented
						value={filter}
						onChange={setFilter}
						size="sm"
						options={[
							{ value: "user", label: t("filterUser") },
							{ value: "system", label: t("filterSystem") },
							{ value: "all", label: t("filterAll") },
						]}
					/>
				)}
				<div className="relative sm:w-72">
					<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<input
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder={t("searchApps")}
						className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm"
					/>
				</div>
			</div>

			{loading && packages.length === 0 ? (
				<div className="flex justify-center py-12">
					<Spinner />
				</div>
			) : filtered.length === 0 ? (
				<EmptyState title={t("noInstalledApps")} />
			) : (
				<div className="overflow-hidden rounded-xl border border-border bg-card">
					<div className="divide-y divide-border">
						{filtered.map((pkg) => {
							const catApp = getCatalogApp(pkg.packageName);
							return (
								<div
									key={pkg.packageName}
									className="flex items-center gap-3 px-4 py-3"
								>
									<AppIcon
										name={catApp?.name ?? pkg.packageName}
										iconUrl={catApp?.iconUrl}
										className="h-9 w-9 shrink-0 rounded-lg text-xs"
									/>
									<div className="min-w-0 flex-1">
										{catApp ? (
											<>
												<div className="flex items-center gap-2">
													<span className="truncate text-sm font-medium">
														{catApp.name}
													</span>
													<span className="flex shrink-0 items-center gap-1 rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] font-medium text-sky-500">
														<Boxes className="h-3 w-3" />
														{t("fromCatalog")}
													</span>
												</div>
												<p className="truncate font-mono text-[10px] text-muted-foreground">
													{pkg.packageName}
												</p>
											</>
										) : (
											<>
												<p className="truncate font-mono text-xs">
													{pkg.packageName}
												</p>
												<span className="text-[10px] text-muted-foreground">
													{pkg.isSystem ? t("systemApp") : t("userApp")}
												</span>
											</>
										)}
									</div>
									<div className="flex items-center gap-1">
										{busy === pkg.packageName && (
											<Loader2 className="mr-1 h-4 w-4 animate-spin text-muted-foreground" />
										)}
										<IconAction
											title={t("openApp")}
											onClick={() => {
												if (adb)
													runAction(
														pkg,
														() => launchApp(adb, pkg.packageName),
														t("launched", { name: pkg.packageName }),
													);
											}}
										>
											<SquareArrowOutUpRight className="h-4 w-4" />
										</IconAction>
										{advanced && (
											<>
												<IconAction
													title={t("forceStop")}
													onClick={() => {
														if (adb)
															runAction(
																pkg,
																() => forceStopApp(adb, pkg.packageName),
																t("forceStopped", { name: pkg.packageName }),
															);
													}}
												>
													<Octagon className="h-4 w-4" />
												</IconAction>
												<IconAction
													title={t("clearData")}
													onClick={() => setToClear(pkg)}
												>
													<Trash className="h-4 w-4" />
												</IconAction>
												<IconAction
													title={t("viewPermissions")}
													onClick={() => setPermsFor(pkg)}
												>
													<KeyRound className="h-4 w-4" />
												</IconAction>
											</>
										)}
										{!pkg.isSystem && (
											<IconAction
												title={t("uninstall")}
												danger
												onClick={() => setToUninstall(pkg)}
											>
												<Trash2 className="h-4 w-4" />
											</IconAction>
										)}
									</div>
								</div>
							);
						})}
					</div>
				</div>
			)}

			<p className="text-right text-xs text-muted-foreground">
				{t("appCount", { count: filtered.length })}
			</p>

			<ConfirmDialog
				open={toUninstall !== null}
				onClose={() => setToUninstall(null)}
				onConfirm={() =>
					toUninstall &&
					runAction(
						toUninstall,
						() => uninstall(toUninstall.packageName),
						t("uninstalled", { name: toUninstall.packageName }),
					)
				}
				title={t("uninstall")}
				message={t("uninstallConfirm", {
					name: toUninstall?.packageName ?? "",
				})}
				confirmLabel={t("uninstall")}
				danger
			/>

			<ConfirmDialog
				open={toClear !== null}
				onClose={() => setToClear(null)}
				onConfirm={() => {
					if (adb && toClear)
						runAction(
							toClear,
							() => clearAppData(adb, toClear.packageName),
							t("dataCleared", { name: toClear.packageName }),
						);
				}}
				title={t("clearData")}
				message={t("clearDataConfirm", { name: toClear?.packageName ?? "" })}
				confirmLabel={t("clearData")}
				danger
			/>

			<PermissionsModal pkg={permsFor} onClose={() => setPermsFor(null)} />
		</div>
	);
}

function IconAction({
	title,
	onClick,
	danger,
	children,
}: {
	title: string;
	onClick: () => void;
	danger?: boolean;
	children: React.ReactNode;
}) {
	return (
		<button
			type="button"
			title={title}
			onClick={onClick}
			className={`rounded-md p-1.5 text-muted-foreground transition-colors ${
				danger
					? "hover:bg-red-500/10 hover:text-red-500"
					: "hover:bg-accent hover:text-foreground"
			}`}
		>
			{children}
		</button>
	);
}

function PermissionsModal({
	pkg,
	onClose,
}: {
	pkg: InstalledPackage | null;
	onClose: () => void;
}) {
	const { t } = useTranslation("apps");
	const adb = useDeviceStore((s) => s.adb);
	const [perms, setPerms] = useState<AppPermission[] | null>(null);

	useEffect(() => {
		if (!pkg || !adb) {
			setPerms(null);
			return;
		}
		let cancelled = false;
		setPerms(null);
		getAppPermissions(adb, pkg.packageName)
			.then((result) => {
				if (!cancelled) setPerms(result);
			})
			.catch(() => {
				if (!cancelled) setPerms([]);
			});
		return () => {
			cancelled = true;
		};
	}, [pkg, adb]);

	return (
		<Modal
			open={pkg !== null}
			onClose={onClose}
			title={pkg?.packageName ?? t("permissions")}
		>
			{perms === null ? (
				<div className="flex justify-center py-6">
					<Spinner />
				</div>
			) : perms.length === 0 ? (
				<p className="py-4 text-center text-muted-foreground">
					{t("noPermissions")}
				</p>
			) : (
				<ul className="max-h-80 space-y-1 overflow-auto">
					{perms.map((perm) => (
						<li
							key={perm.name}
							className="flex items-center justify-between gap-3 rounded-md px-2 py-1 text-xs"
						>
							<span className="truncate font-mono">{perm.name}</span>
							<span
								className={
									perm.granted ? "text-emerald-500" : "text-muted-foreground"
								}
							>
								{t(perm.granted ? "granted" : "denied")}
							</span>
						</li>
					))}
				</ul>
			)}
		</Modal>
	);
}
