import type { Adb } from "@yume-chan/adb";

export interface ShellResult {
	stdout: string;
	exitCode: number;
}

export async function execShell(
	adb: Adb,
	command: string,
): Promise<ShellResult> {
	const shellProtocol = adb.subprocess.shellProtocol;
	if (shellProtocol) {
		const result = await shellProtocol.spawnWaitText(command);
		return {
			stdout: result.stdout.trim(),
			exitCode: result.exitCode,
		};
	}

	const output = await adb.subprocess.noneProtocol.spawnWaitText(command);
	return {
		stdout: output.trim(),
		exitCode: 0,
	};
}

export async function getprop(adb: Adb, key: string): Promise<string> {
	const { stdout } = await execShell(adb, `getprop ${key}`);
	return stdout;
}

export async function getAllProps(adb: Adb): Promise<Map<string, string>> {
	const { stdout } = await execShell(adb, "getprop");
	const props = new Map<string, string>();
	const regex = /\[(.+?)]: \[(.*)]/g;
	let match: RegExpExecArray | null;
	while ((match = regex.exec(stdout)) !== null) {
		const key = match[1];
		const value = match[2];
		if (key && value !== undefined) {
			props.set(key, value);
		}
	}
	return props;
}
