import type { Adb } from "@yume-chan/adb";
import { ReadableStream as AdbReadableStream } from "@yume-chan/stream-extra";
import { execShell } from "./shell";
import type { InstalledPackage } from "./types";

export async function listPackages(adb: Adb): Promise<InstalledPackage[]> {
	const [userResult, systemResult] = await Promise.all([
		execShell(adb, "pm list packages -f -3"),
		execShell(adb, "pm list packages -f -s"),
	]);

	const parsePackages = (
		output: string,
		isSystem: boolean,
	): InstalledPackage[] => {
		return output
			.split("\n")
			.filter((line) => line.startsWith("package:"))
			.map((line) => {
				const content = line.slice("package:".length);
				const eqIndex = content.lastIndexOf("=");
				return {
					path: content.slice(0, eqIndex),
					packageName: content.slice(eqIndex + 1),
					isSystem,
				};
			});
	};

	return [
		...parsePackages(userResult.stdout, false),
		...parsePackages(systemResult.stdout, true),
	];
}

export async function installApk(
	adb: Adb,
	file: File,
	onProgress?: (stage: string, percent: number) => void,
): Promise<void> {
	const remotePath = `/data/local/tmp/${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

	onProgress?.("pushing", 0);
	const buffer = await file.arrayBuffer();
	const data = new Uint8Array(buffer);

	const fileStream = new AdbReadableStream<Uint8Array>({
		start(controller) {
			const chunkSize = 64 * 1024;
			let offset = 0;
			while (offset < data.length) {
				const end = Math.min(offset + chunkSize, data.length);
				controller.enqueue(data.slice(offset, end));
				offset = end;
			}
			controller.close();
		},
	});

	const sync = await adb.sync();
	try {
		await sync.write({
			filename: remotePath,
			file: fileStream,
			permission: 0o644,
			mtime: Math.floor(Date.now() / 1000),
		});
	} finally {
		await sync.dispose();
	}

	onProgress?.("pushing", 100);
	onProgress?.("installing", 50);

	const result = await execShell(adb, `pm install -r "${remotePath}"`);
	await execShell(adb, `rm "${remotePath}"`);

	if (result.stdout.includes("Failure")) {
		throw new Error(`Install failed: ${result.stdout}`);
	}

	onProgress?.("done", 100);
}

export async function uninstallPackage(
	adb: Adb,
	packageName: string,
): Promise<void> {
	const result = await execShell(adb, `pm uninstall ${packageName}`);
	if (!result.stdout.includes("Success")) {
		throw new Error(`Uninstall failed: ${result.stdout}`);
	}
}

export async function runPostInstall(
	adb: Adb,
	commands: string[],
): Promise<void> {
	for (const cmd of commands) {
		const result = await execShell(adb, cmd);
		if (result.exitCode !== 0) {
			throw new Error(`Command failed (${result.exitCode}): ${cmd}`);
		}
	}
}

export async function clearAppData(
	adb: Adb,
	packageName: string,
): Promise<void> {
	const result = await execShell(adb, `pm clear ${packageName}`);
	if (!result.stdout.includes("Success")) {
		throw new Error(result.stdout || `Failed to clear ${packageName}`);
	}
}

export async function forceStopApp(
	adb: Adb,
	packageName: string,
): Promise<void> {
	const result = await execShell(adb, `am force-stop ${packageName}`);
	if (result.exitCode !== 0) {
		throw new Error(result.stdout || `Failed to stop ${packageName}`);
	}
}

export interface AppPermission {
	name: string;
	granted: boolean;
}

export async function getAppPermissions(
	adb: Adb,
	packageName: string,
): Promise<AppPermission[]> {
	const { stdout } = await execShell(adb, `dumpsys package ${packageName}`);
	const permissions = new Map<string, boolean>();

	let section: "requested" | "granted" | null = null;
	for (const rawLine of stdout.split("\n")) {
		const line = rawLine.trim();
		if (line === "requested permissions:") {
			section = "requested";
			continue;
		}
		if (
			line === "install permissions:" ||
			line === "runtime permissions:" ||
			line.startsWith("User 0:")
		) {
			section = "granted";
			continue;
		}
		if (!section) continue;
		if (!line.startsWith("android.") && !line.includes(".permission.")) {
			// Left the permission block.
			if (line.length === 0) continue;
			if (!line.includes("permission")) section = null;
			continue;
		}

		const grantedMatch = /^([\w.]+): granted=(true|false)/.exec(line);
		if (grantedMatch?.[1]) {
			permissions.set(grantedMatch[1], grantedMatch[2] === "true");
		} else if (section === "requested") {
			const name = line.split(":")[0]?.trim();
			if (name && !permissions.has(name)) permissions.set(name, false);
		}
	}

	return [...permissions.entries()]
		.map(([name, granted]) => ({ name, granted }))
		.sort((a, b) => a.name.localeCompare(b.name));
}

export async function setDefaultLauncher(
	adb: Adb,
	componentName: string,
): Promise<void> {
	await execShell(adb, `cmd package set-home-activity ${componentName}`);
}

export async function disableOverlay(
	adb: Adb,
	overlayPackage: string,
): Promise<void> {
	await execShell(adb, `cmd overlay disable --user 0 ${overlayPackage}`);
}
