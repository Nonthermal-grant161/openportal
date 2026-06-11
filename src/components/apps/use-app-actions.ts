import {
	clearAppData,
	forceStopApp,
	launchApp,
	runPostInstall,
} from "@/lib/adb/app-manager";
import { type InstallStage, installFromUrl } from "@/lib/adb/online-install";
import { getCatalogApp } from "@/lib/portal/catalog";
import { resolveApk } from "@/lib/portal/sources";
import { useAppStore } from "@/store/app-store";
import { useDeviceStore } from "@/store/device-store";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export type AppActionKind =
	| "install"
	| "update"
	| "open"
	| "setup"
	| "uninstall"
	| "forceStop"
	| "clearData";

export function useAppActions(packageName: string, displayName: string) {
	const { t } = useTranslation("apps");
	const adb = useDeviceStore((s) => s.adb);
	const connect = useDeviceStore((s) => s.connect);
	const isInstalled = useAppStore((s) => s.isInstalled(packageName));
	const update = useAppStore((s) => s.updates[packageName]);
	const refreshInstalled = useAppStore((s) => s.refreshInstalled);
	const refreshDefaultLauncher = useAppStore((s) => s.refreshDefaultLauncher);
	const clearUpdate = useAppStore((s) => s.clearUpdate);
	const markInstalled = useAppStore((s) => s.markInstalled);
	const uninstallPackage = useAppStore((s) => s.uninstall);

	const [busy, setBusy] = useState<AppActionKind | null>(null);
	const [stage, setStage] = useState<InstallStage | null>(null);
	const [progress, setProgress] = useState<number | null>(null);

	const app = getCatalogApp(packageName);
	const hasUpdate = isInstalled && update !== undefined;

	const run = async (kind: AppActionKind, action: () => Promise<void>) => {
		if (busy) return;
		setBusy(kind);
		try {
			await action();
		} catch (err) {
			toast.error(displayName, {
				description: err instanceof Error ? err.message : t("actionFailed"),
			});
		} finally {
			setBusy(null);
		}
	};

	const install = () =>
		run(hasUpdate ? "update" : "install", async () => {
			if (!app) return;
			if (!adb) {
				await connect();
				return;
			}
			const updating = hasUpdate;
			setStage("downloading");
			setProgress(null);
			try {
				const url = update?.url ?? (await resolveApk(adb, app)).url;
				await installFromUrl(adb, url, (s, percent) => {
					setStage(s);
					setProgress(percent);
				});
			} finally {
				setStage(null);
				setProgress(null);
			}
			markInstalled(packageName);
			clearUpdate(packageName);
			toast.success(displayName, {
				description: t(updating ? "updated" : "installed"),
			});
			await refreshInstalled();
			if (!updating && app.setup?.kind === "commands" && app.setup.auto) {
				try {
					await runPostInstall(adb, app.setup.commands);
					await refreshDefaultLauncher();
				} catch {}
			}
		});

	const open = () =>
		run("open", async () => {
			if (!adb) return;
			await launchApp(adb, packageName);
			toast.success(t("launched", { name: displayName }));
		});

	const runSetup = () =>
		run("setup", async () => {
			if (!adb || app?.setup?.kind !== "commands") return;
			await runPostInstall(adb, app.setup.commands);
			toast.success(displayName, { description: t("postInstallDone") });
			await refreshDefaultLauncher();
		});

	const uninstall = () =>
		run("uninstall", async () => {
			if (!adb) return;
			await uninstallPackage(packageName);
			toast.success(t("uninstalled", { name: displayName }));
		});

	const forceStop = () =>
		run("forceStop", async () => {
			if (!adb) return;
			await forceStopApp(adb, packageName);
			toast.success(t("forceStopped", { name: displayName }));
		});

	const clearData = () =>
		run("clearData", async () => {
			if (!adb) return;
			await clearAppData(adb, packageName);
			toast.success(t("dataCleared", { name: displayName }));
		});

	return {
		app,
		isInstalled,
		update,
		hasUpdate,
		busy,
		stage,
		progress,
		install,
		open,
		runSetup,
		uninstall,
		forceStop,
		clearData,
	};
}
