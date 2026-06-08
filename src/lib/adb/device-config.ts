import type { Adb } from "@yume-chan/adb";
import { execShell } from "./shell";

export type FlagSource = "settings" | "device_config";

export interface Flag {
	key: string;
	value: string;
}

export const SETTINGS_NAMESPACES = ["global", "secure", "system"] as const;

// Common device_config namespaces present on Android 10+. The list is for
// convenience; any custom namespace can be typed in the UI.
export const DEVICE_CONFIG_NAMESPACES = [
	"privacy",
	"runtime",
	"runtime_native",
	"activity_manager",
	"systemui",
	"launcher",
	"window_manager",
	"netd_native",
	"storage",
	"connectivity",
	"media",
];

function quote(value: string): string {
	if (value === "") return "''";
	if (/^[a-zA-Z0-9._\-:/]+$/.test(value)) return value;
	return `'${value.replace(/'/g, "'\\''")}'`;
}

function listCommand(source: FlagSource, namespace: string): string {
	return source === "settings"
		? `settings list ${namespace}`
		: `cmd device_config list ${namespace}`;
}

export async function listFlags(
	adb: Adb,
	source: FlagSource,
	namespace: string,
): Promise<Flag[]> {
	const { stdout } = await execShell(adb, listCommand(source, namespace));
	return stdout
		.split("\n")
		.map((line) => line.trim())
		.filter((line) => line.includes("="))
		.map((line) => {
			const idx = line.indexOf("=");
			return { key: line.slice(0, idx), value: line.slice(idx + 1) };
		})
		.sort((a, b) => a.key.localeCompare(b.key));
}

export async function putFlag(
	adb: Adb,
	source: FlagSource,
	namespace: string,
	key: string,
	value: string,
): Promise<void> {
	const cmd =
		source === "settings"
			? `settings put ${namespace} ${key} ${quote(value)}`
			: `cmd device_config put ${namespace} ${key} ${quote(value)}`;
	const result = await execShell(adb, cmd);
	if (result.exitCode !== 0) {
		throw new Error(result.stdout || `Failed to set ${key}`);
	}
}

export async function deleteFlag(
	adb: Adb,
	source: FlagSource,
	namespace: string,
	key: string,
): Promise<void> {
	const cmd =
		source === "settings"
			? `settings delete ${namespace} ${key}`
			: `cmd device_config delete ${namespace} ${key}`;
	const result = await execShell(adb, cmd);
	if (result.exitCode !== 0) {
		throw new Error(result.stdout || `Failed to reset ${key}`);
	}
}
