import type { Adb } from "@yume-chan/adb";
import { WritableStream } from "@yume-chan/stream-extra";

export interface PtyHandle {
	/** Send user keystrokes (already encoded by the terminal as a string). */
	write: (data: string) => void;
	resize: (rows: number, cols: number) => void;
	kill: () => void;
	/** Resolves with the exit code when the shell exits. */
	exited: Promise<number>;
}

/** Whether the device supports the shell v2 protocol needed for a real PTY. */
export function isPtySupported(adb: Adb): boolean {
	return adb.subprocess.shellProtocol !== undefined;
}

export interface OpenPtyOptions {
	rows?: number;
	cols?: number;
	terminalType?: string;
}

/**
 * Opens a real interactive pseudo-terminal on the device (shell v2). `onData`
 * receives raw output bytes (ANSI escape codes included) to feed a terminal
 * emulator such as xterm.js.
 */
export async function openPty(
	adb: Adb,
	onData: (chunk: Uint8Array) => void,
	options: OpenPtyOptions = {},
): Promise<PtyHandle> {
	const shell = adb.subprocess.shellProtocol;
	if (!shell) {
		throw new Error(
			"Interactive shell (shell v2) is not supported by this device",
		);
	}

	const pty = await shell.pty({
		terminalType: options.terminalType ?? "xterm-256color",
	});

	const encoder = new TextEncoder();
	const writer = pty.input.getWriter();

	void pty.output
		.pipeTo(
			new WritableStream({
				write(chunk) {
					onData(chunk);
				},
			}),
		)
		.catch(() => {});

	if (options.rows && options.cols) {
		await pty.resize(options.rows, options.cols).catch(() => {});
	}

	return {
		write(data: string) {
			void writer.write(encoder.encode(data)).catch(() => {});
		},
		resize(rows: number, cols: number) {
			void pty.resize(rows, cols).catch(() => {});
		},
		kill() {
			void pty.kill();
		},
		exited: pty.exited,
	};
}
