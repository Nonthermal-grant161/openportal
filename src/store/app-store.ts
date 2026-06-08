import { create } from "zustand";
import { installApk, listPackages } from "@/lib/adb/app-manager";
import type { InstalledPackage, InstallTask } from "@/lib/adb/types";
import { useDeviceStore } from "./device-store";

interface AppStore {
	installedPackages: InstalledPackage[];
	installTasks: InstallTask[];
	loading: boolean;

	refreshInstalled: () => Promise<void>;
	installFile: (file: File) => Promise<void>;
	isInstalled: (packageName: string) => boolean;
}

export const useAppStore = create<AppStore>((set, get) => ({
	installedPackages: [],
	installTasks: [],
	loading: false,

	refreshInstalled: async () => {
		const adb = useDeviceStore.getState().adb;
		if (!adb) return;

		set({ loading: true });
		try {
			const packages = await listPackages(adb);
			set({ installedPackages: packages });
		} finally {
			set({ loading: false });
		}
	},

	installFile: async (file: File) => {
		const adb = useDeviceStore.getState().adb;
		if (!adb) throw new Error("Not connected");

		const taskId = crypto.randomUUID();
		const task: InstallTask = {
			id: taskId,
			fileName: file.name,
			status: "queued",
			progress: 0,
		};

		set((state) => ({
			installTasks: [...state.installTasks, task],
		}));

		try {
			await installApk(adb, file, (stage, percent) => {
				set((state) => ({
					installTasks: state.installTasks.map((t) =>
						t.id === taskId
							? {
									...t,
									status: stage as InstallTask["status"],
									progress: percent,
								}
							: t,
					),
				}));
			});

			set((state) => ({
				installTasks: state.installTasks.map((t) =>
					t.id === taskId ? { ...t, status: "done", progress: 100 } : t,
				),
			}));

			await get().refreshInstalled();
		} catch (err) {
			set((state) => ({
				installTasks: state.installTasks.map((t) =>
					t.id === taskId
						? {
								...t,
								status: "error",
								error: err instanceof Error ? err.message : "Install failed",
							}
						: t,
				),
			}));
			throw err;
		}
	},

	isInstalled: (packageName: string) => {
		return get().installedPackages.some((p) => p.packageName === packageName);
	},
}));
