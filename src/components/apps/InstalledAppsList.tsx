import {
	ConfirmDialog,
	EmptyState,
	Modal,
	SectionTitle,
	Spinner,
} from "@/components/ui/primitives";
import {
	type AppPermission,
	clearAppData,
	forceStopApp,
	getAppPermissions,
} from "@/lib/adb/app-manager";
import type { InstalledPackage } from "@/lib/adb/types";
import { useAppStore } from "@/store/app-store";
import { useDeviceStore } from "@/store/device-store";
import {
	KeyRound,
	Loader2,
	Octagon,
	RefreshCw,
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
	const adb = useDeviceStore((s) => s.adb);
	const packages = useAppStore((s) => s.installedPackages);
	const loading = useAppStore((s) => s.loading);
	const refreshInstalled = useAppStore((s) => s.refreshInstalled);
	const uninstall = useAppStore((s) => s.uninstall);

	const [filter, setFilter] = useState<Filter>("user");
	const [search, setSearch] = useState("");
	const [busy, setBusy] = useState<string | null>(null);
	const [toUninstall, setToUninstall] = useState<InstalledPackage | null>(null);
	const [toClear, setToClear] = useState<InstalledPackage | null>(null);
	const [permsFor, setPermsFor] = useState<InstalledPackage | null>(null);

	useEffect(() => {
		refreshInstalled();
	}, [refreshInstalled]);

	const filtered = useMemo(() => {
		const query = search.toLowerCase();
		return packages
			.filter((pkg) =>
				filter === "all"
					? true
					: filter === "system"
						? pkg.isSystem
						: !pkg.isSystem,
			)
			.filter((pkg) => pkg.packageName.toLowerCase().includes(query))
			.sort((a, b) => a.packageName.localeCompare(b.packageName));
	}, [packages, filter, search]);

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

	const filters: Filter[] = ["user", "system", "all"];

	return (
		<div className="rounded-xl border border-border bg-card p-6">
			<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
				<SectionTitle>{t("manageInstalled")}</SectionTitle>
				<button
					type="button"
					onClick={() => refreshInstalled()}
					className="text-muted-foreground hover:text-foreground"
					title={t("manageInstalled")}
				>
					<RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
				</button>
			</div>

			<div className="mb-4 flex flex-wrap items-center gap-2">
				<div className="flex rounded-lg bg-secondary p-1">
					{filters.map((f) => (
						<button
							key={f}
							type="button"
							onClick={() => setFilter(f)}
							className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
								filter === f
									? "bg-background text-foreground shadow-sm"
									: "text-muted-foreground hover:text-foreground"
							}`}
						>
							{t(
								f === "all"
									? "filterAll"
									: f === "user"
										? "filterUser"
										: "filterSystem",
							)}
						</button>
					))}
				</div>
				<input
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					placeholder={t("searchApps")}
					className="ml-auto min-w-48 flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm"
				/>
			</div>

			{loading && packages.length === 0 ? (
				<div className="flex justify-center py-12">
					<Spinner />
				</div>
			) : filtered.length === 0 ? (
				<EmptyState title={t("noInstalledApps")} />
			) : (
				<div className="divide-y divide-border">
					{filtered.map((pkg) => (
						<div
							key={pkg.packageName}
							className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
						>
							<AppIcon
								name={pkg.packageName}
								className="h-9 w-9 shrink-0 rounded-lg text-xs"
							/>
							<div className="min-w-0 flex-1">
								<p className="truncate font-mono text-xs">{pkg.packageName}</p>
								<span className="text-[10px] text-muted-foreground">
									{pkg.isSystem ? t("systemApp") : t("userApp")}
								</span>
							</div>
							<div className="flex items-center gap-1">
								{busy === pkg.packageName && (
									<Loader2 className="mr-1 h-4 w-4 animate-spin text-muted-foreground" />
								)}
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
					))}
				</div>
			)}

			<p className="mt-4 text-right text-xs text-muted-foreground">
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
