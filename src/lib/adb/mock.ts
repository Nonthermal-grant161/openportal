import type { DeviceInfo, InstalledPackage } from "./types";

export const MOCK_DEVICE_INFO: DeviceInfo = {
	model: "Portal Mini",
	codename: "omni",
	androidVersion: "10",
	apiLevel: "29",
	buildId: "omni_prod-user 10 QKQ1.210213.001",
	buildFlavor: "omni_prod-user",
	firmwareVersion: "1.47.4",
	kernelVersion: "4.9.227-perf+",
	serial: "PORTAL123456789",
	socModel: "qcs605",
	securityPatch: "2020-08-05",
	vendorPatch: "2018-08-05",
	bootloaderVersion: "ALH31005110",
	bootloaderLocked: true,
	oemUnlockAllowed: false,
	testHarnessActive: true,
	adbPersistent: true,
	hiddenApiDisabled: false,
	otaBlocked: true,
	storageTotal: 25.4 * 1024 * 1024 * 1024,
	storageUsed: 8.2 * 1024 * 1024 * 1024,
	storageFree: 17.2 * 1024 * 1024 * 1024,
};

// A few catalog apps plus typical system packages, so the Installed tab and
// the catalog's "Installed" states have something to show in demo mode.
export const MOCK_INSTALLED_PACKAGES: InstalledPackage[] = [
	{
		packageName: "org.fdroid.fdroid",
		path: "/data/app/org.fdroid.fdroid-1/base.apk",
		isSystem: false,
	},
	{
		packageName: "org.videolan.vlc",
		path: "/data/app/org.videolan.vlc-1/base.apk",
		isSystem: false,
	},
	{
		packageName: "com.immortal.launcher",
		path: "/data/app/com.immortal.launcher-1/base.apk",
		isSystem: false,
	},
	{
		packageName: "com.android.settings",
		path: "/system/priv-app/Settings/Settings.apk",
		isSystem: true,
	},
	{
		packageName: "com.facebook.portal.app",
		path: "/system/priv-app/PortalApp/PortalApp.apk",
		isSystem: true,
	},
];
