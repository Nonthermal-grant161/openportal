import type { Adb } from "@yume-chan/adb";
import type { DeviceInfo } from "./types";
import { execShell, getAllProps } from "./shell";

export async function getDeviceInfo(adb: Adb): Promise<DeviceInfo> {
	const [props, kernelResult, storageResult, otaResult] = await Promise.all([
		getAllProps(adb),
		execShell(adb, "uname -r"),
		execShell(adb, "df /data"),
		execShell(adb, "settings get global ota_disable_automatic_update"),
	]);

	const get = (key: string) => props.get(key) ?? "";

	const storage = parseStorageOutput(storageResult.stdout);

	return {
		model: get("ro.product.model"),
		codename: get("ro.product.device"),
		androidVersion: get("ro.build.version.release"),
		apiLevel: get("ro.build.version.sdk"),
		buildId: get("ro.build.display.id"),
		buildFlavor: get("ro.build.flavor"),
		firmwareVersion: get("ro.product.build_id") || get("ro.build.display.id"),
		kernelVersion: kernelResult.stdout,
		serial: get("ro.serialno"),
		socModel: get("ro.board.platform"),
		securityPatch: get("ro.build.version.security_patch"),
		vendorPatch: get("ro.vendor.build.security_patch"),
		bootloaderVersion: get("ro.boot.version_bootloader"),
		bootloaderLocked: get("ro.boot.flash.locked") === "1",
		oemUnlockAllowed: get("sys.oem_unlock_allowed") === "1",
		testHarnessActive: get("persist.sys.test_harness") === "1",
		adbPersistent: get("persist.sys.usb.config").includes("adb"),
		hiddenApiDisabled: get("sys.debug.disable_blacklist") === "1",
		otaBlocked: otaResult.stdout.trim() === "1",
		storageTotal: storage.total,
		storageUsed: storage.used,
		storageFree: storage.free,
	};
}

function parseStorageOutput(output: string): {
	total: number;
	used: number;
	free: number;
} {
	const lines = output.split("\n");
	if (lines.length < 2) return { total: 0, used: 0, free: 0 };

	const parts = lines[1]?.split(/\s+/);
	if (!parts || parts.length < 4) return { total: 0, used: 0, free: 0 };

	const parseSize = (s: string | undefined): number => {
		if (!s) return 0;
		const num = Number.parseFloat(s);
		if (Number.isNaN(num)) return 0;
		if (s.endsWith("G")) return num * 1024 * 1024 * 1024;
		if (s.endsWith("M")) return num * 1024 * 1024;
		if (s.endsWith("K")) return num * 1024;
		return num * 1024;
	};

	return {
		total: parseSize(parts[1]),
		used: parseSize(parts[2]),
		free: parseSize(parts[3]),
	};
}
