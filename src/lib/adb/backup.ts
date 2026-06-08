import type { Adb } from "@yume-chan/adb";
import { listPackages } from "./app-manager";
import { getDeviceInfo } from "./device-info";
import { type SettingsNamespace, getSetting, putSetting } from "./settings";

export interface DeviceProfile {
	version: number;
	exportedAt: string;
	device: {
		model: string;
		codename: string;
		firmware: string;
	};
	settings: Partial<Record<SettingsNamespace, Record<string, string>>>;
	userPackages: string[];
}

// Settings the app manages: the ones worth carrying between devices.
const BACKUP_KEYS: { namespace: SettingsNamespace; key: string }[] = [
	{ namespace: "global", key: "adb_enabled" },
	{ namespace: "global", key: "development_settings_enabled" },
	{ namespace: "global", key: "package_verifier_enable" },
	{ namespace: "global", key: "verifier_verify_adb_installs" },
	{ namespace: "global", key: "stay_on_while_plugged_in" },
	{ namespace: "global", key: "ota_disable_automatic_update" },
	{ namespace: "global", key: "hidden_api_policy" },
	{ namespace: "global", key: "adb_allowed_connection_time" },
	{ namespace: "secure", key: "ui_night_mode" },
	{ namespace: "secure", key: "screensaver_components" },
	{ namespace: "secure", key: "screensaver_enabled" },
];

export const PROFILE_VERSION = 1;

export async function exportProfile(adb: Adb): Promise<DeviceProfile> {
	const info = await getDeviceInfo(adb);

	const settings: DeviceProfile["settings"] = {};
	for (const { namespace, key } of BACKUP_KEYS) {
		const value = await getSetting(adb, namespace, key);
		if (value !== "") {
			const bucket = settings[namespace] ?? {};
			bucket[key] = value;
			settings[namespace] = bucket;
		}
	}

	const packages = await listPackages(adb);

	return {
		version: PROFILE_VERSION,
		exportedAt: new Date().toISOString(),
		device: {
			model: info.model,
			codename: info.codename,
			firmware: info.firmwareVersion,
		},
		settings,
		userPackages: packages
			.filter((pkg) => !pkg.isSystem)
			.map((pkg) => pkg.packageName)
			.sort(),
	};
}

export interface RestoreResult {
	applied: number;
	missingPackages: string[];
}

export function isDeviceProfile(value: unknown): value is DeviceProfile {
	if (typeof value !== "object" || value === null) return false;
	const profile = value as Partial<DeviceProfile>;
	return (
		typeof profile.version === "number" &&
		typeof profile.settings === "object" &&
		profile.settings !== null
	);
}

/**
 * Applies the settings from a profile. Apps are not re-downloaded (the APKs are
 * not part of the profile); instead the list of apps not currently installed is
 * returned so the user can reinstall them.
 */
export async function importProfile(
	adb: Adb,
	profile: DeviceProfile,
): Promise<RestoreResult> {
	let applied = 0;
	for (const namespace of Object.keys(
		profile.settings,
	) as SettingsNamespace[]) {
		const entries = profile.settings[namespace];
		if (!entries) continue;
		for (const [key, value] of Object.entries(entries)) {
			await putSetting(adb, namespace, key, value);
			applied += 1;
		}
	}

	const installed = new Set(
		(await listPackages(adb)).map((pkg) => pkg.packageName),
	);
	const missingPackages = (profile.userPackages ?? []).filter(
		(pkg) => !installed.has(pkg),
	);

	return { applied, missingPackages };
}
