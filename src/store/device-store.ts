import type { Adb } from "@yume-chan/adb";
import type { AdbDaemonWebUsbDevice } from "@yume-chan/adb-daemon-webusb";
import { create } from "zustand";
import {
	connectDevice,
	disconnectDevice,
	requestDevice,
} from "@/lib/adb/connection";
import { getDeviceInfo } from "@/lib/adb/device-info";
import type { ConnectionState, DeviceInfo } from "@/lib/adb/types";
import { resolveModel } from "@/lib/portal/models";
import type { PortalModelInfo } from "@/lib/portal/models";

interface DeviceStore {
	state: ConnectionState;
	adb: Adb | null;
	device: AdbDaemonWebUsbDevice | null;
	error: string | null;
	deviceInfo: DeviceInfo | null;
	portalModel: PortalModelInfo | null;

	connect: () => Promise<void>;
	disconnect: () => Promise<void>;
	refreshDeviceInfo: () => Promise<void>;
}

export const useDeviceStore = create<DeviceStore>((set, get) => ({
	state: "disconnected",
	adb: null,
	device: null,
	error: null,
	deviceInfo: null,
	portalModel: null,

	connect: async () => {
		try {
			set({ state: "connecting", error: null });

			const device = await requestDevice();
			if (!device) {
				set({ state: "disconnected" });
				return;
			}

			set({ state: "authenticating", device });
			const adb = await connectDevice(device);
			set({ state: "connected", adb });

			await get().refreshDeviceInfo();
		} catch (err) {
			set({
				state: "error",
				error: err instanceof Error ? err.message : "Connection failed",
			});
		}
	},

	disconnect: async () => {
		const { adb } = get();
		if (adb) {
			try {
				await disconnectDevice(adb);
			} catch {
				// ignore disconnect errors
			}
		}
		set({
			state: "disconnected",
			adb: null,
			device: null,
			deviceInfo: null,
			portalModel: null,
			error: null,
		});
	},

	refreshDeviceInfo: async () => {
		const { adb } = get();
		if (!adb) return;

		try {
			const info = await getDeviceInfo(adb);
			const model = resolveModel(info.codename);
			set({ deviceInfo: info, portalModel: model });
		} catch (err) {
			set({
				error:
					err instanceof Error ? err.message : "Failed to read device info",
			});
		}
	},
}));
