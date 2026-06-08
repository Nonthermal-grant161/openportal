export interface DeviceInfo {
	model: string;
	codename: string;
	androidVersion: string;
	apiLevel: string;
	buildId: string;
	buildFlavor: string;
	firmwareVersion: string;
	kernelVersion: string;
	serial: string;
	socModel: string;
	securityPatch: string;
	vendorPatch: string;
	bootloaderVersion: string;
	bootloaderLocked: boolean;
	oemUnlockAllowed: boolean;
	testHarnessActive: boolean;
	adbPersistent: boolean;
	hiddenApiDisabled: boolean;
	otaBlocked: boolean;
	storageTotal: number;
	storageUsed: number;
	storageFree: number;
}

export type ConnectionState =
	| "disconnected"
	| "connecting"
	| "authenticating"
	| "connected"
	| "error";

export interface InstalledPackage {
	packageName: string;
	path: string;
	isSystem: boolean;
}

export interface InstallTask {
	id: string;
	fileName: string;
	status: "queued" | "pushing" | "installing" | "done" | "error";
	progress: number;
	error?: string;
}
