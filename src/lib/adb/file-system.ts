import type { Adb } from "@yume-chan/adb";
import {
	ReadableStream as AdbReadableStream,
	ConcatBufferStream,
} from "@yume-chan/stream-extra";
import { execShell } from "./shell";

export type FileType = "file" | "directory" | "link";

export interface FileEntry {
	name: string;
	type: FileType;
	size: number;
	/** Modification time in seconds since epoch. */
	mtime: number;
	permission: number;
}

// Values from @yume-chan/adb LinuxFileType, kept local so the UI layer
// never needs to import the ADB package directly.
const LINUX_DIRECTORY = 4;
const LINUX_LINK = 10;

function mapType(type: number): FileType {
	if (type === LINUX_DIRECTORY) return "directory";
	if (type === LINUX_LINK) return "link";
	return "file";
}

export function joinPath(base: string, name: string): string {
	if (base.endsWith("/")) return base + name;
	return `${base}/${name}`;
}

export function parentPath(path: string): string {
	if (path === "/" || path === "") return "/";
	const trimmed = path.replace(/\/+$/, "");
	const idx = trimmed.lastIndexOf("/");
	if (idx <= 0) return "/";
	return trimmed.slice(0, idx);
}

export function basename(path: string): string {
	const trimmed = path.replace(/\/+$/, "");
	const idx = trimmed.lastIndexOf("/");
	return idx < 0 ? trimmed : trimmed.slice(idx + 1) || "/";
}

/** Wraps a value in double quotes, escaping characters that are unsafe in a shell. */
function shellQuote(path: string): string {
	return `"${path.replace(/(["$`\\])/g, "\\$1")}"`;
}

export async function listDirectory(
	adb: Adb,
	path: string,
): Promise<FileEntry[]> {
	const sync = await adb.sync();
	try {
		const entries = await sync.readdir(path);
		return entries
			.filter((entry) => entry.name !== "." && entry.name !== "..")
			.map((entry) => ({
				name: entry.name,
				type: mapType(entry.type),
				size: Number(entry.size),
				mtime: Number(entry.mtime),
				permission: entry.permission,
			}))
			.sort((a, b) => {
				if (a.type === "directory" && b.type !== "directory") return -1;
				if (a.type !== "directory" && b.type === "directory") return 1;
				return a.name.localeCompare(b.name);
			});
	} finally {
		await sync.dispose();
	}
}

export async function pullFile(adb: Adb, path: string): Promise<Uint8Array> {
	const sync = await adb.sync();
	try {
		return await sync.read(path).pipeThrough(new ConcatBufferStream());
	} finally {
		await sync.dispose();
	}
}

export async function pushFile(
	adb: Adb,
	directory: string,
	file: File,
	onProgress?: (percent: number) => void,
): Promise<void> {
	const remotePath = joinPath(directory, file.name);
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
				onProgress?.(Math.round((offset / data.length) * 100));
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
		onProgress?.(100);
	} finally {
		await sync.dispose();
	}
}

export async function makeDirectory(adb: Adb, path: string): Promise<void> {
	const result = await execShell(adb, `mkdir -p ${shellQuote(path)}`);
	if (result.exitCode !== 0) {
		throw new Error(result.stdout || `mkdir failed for ${path}`);
	}
}

export async function removePath(adb: Adb, path: string): Promise<void> {
	const result = await execShell(adb, `rm -rf ${shellQuote(path)}`);
	if (result.exitCode !== 0) {
		throw new Error(result.stdout || `rm failed for ${path}`);
	}
}
