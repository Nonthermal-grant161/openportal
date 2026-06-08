import type { Adb } from "@yume-chan/adb";
import { execShell } from "./shell";

export type SettingsNamespace = "global" | "secure" | "system";

export async function getSetting(
	adb: Adb,
	namespace: SettingsNamespace,
	key: string,
): Promise<string> {
	const { stdout } = await execShell(adb, `settings get ${namespace} ${key}`);
	return stdout === "null" ? "" : stdout;
}

export async function putSetting(
	adb: Adb,
	namespace: SettingsNamespace,
	key: string,
	value: string,
): Promise<void> {
	await execShell(adb, `settings put ${namespace} ${key} ${value}`);
}

export interface SettingsPreset {
	id: string;
	nameKey: string;
	descriptionKey: string;
	settings: Array<{
		namespace: SettingsNamespace;
		key: string;
		value: string;
	}>;
}

export const PRESETS: SettingsPreset[] = [
	{
		id: "recommended",
		nameKey: "settings:recommended",
		descriptionKey: "settings:recommendedDesc",
		settings: [
			{ namespace: "global", key: "adb_enabled", value: "1" },
			{ namespace: "global", key: "development_settings_enabled", value: "1" },
			{ namespace: "global", key: "package_verifier_enable", value: "0" },
			{
				namespace: "global",
				key: "verifier_verify_adb_installs",
				value: "0",
			},
			{ namespace: "global", key: "stay_on_while_plugged_in", value: "7" },
			{
				namespace: "global",
				key: "ota_disable_automatic_update",
				value: "1",
			},
			{ namespace: "global", key: "hidden_api_policy", value: "1" },
			{
				namespace: "global",
				key: "adb_allowed_connection_time",
				value: "0",
			},
		],
	},
];

export async function applyPreset(
	adb: Adb,
	preset: SettingsPreset,
): Promise<void> {
	for (const s of preset.settings) {
		await putSetting(adb, s.namespace, s.key, s.value);
	}
}
