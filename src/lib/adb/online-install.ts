import type { Adb } from "@yume-chan/adb";
import { execShell } from "./shell";

export type Downloader = "curl" | "wget";

export type InstallStage = "downloading" | "installing" | "done";

/**
 * Detects an HTTP downloader available in the device shell. We prefer curl
 * (handles HTTPS + redirects reliably); toybox wget is a fallback.
 */
export async function detectDownloader(adb: Adb): Promise<Downloader | null> {
	const { stdout } = await execShell(
		adb,
		"command -v curl >/dev/null 2>&1 && echo curl || (command -v wget >/dev/null 2>&1 && echo wget || echo none)",
	);
	const value = stdout.trim();
	return value === "curl" || value === "wget" ? value : null;
}

function getCommand(downloader: Downloader, url: string): string {
	// -L follow redirects (GitHub assets redirect to a signed URL).
	return downloader === "curl"
		? `curl -fsSL "${url}"`
		: `wget -q -O - "${url}"`;
}

/**
 * Fetches a URL *from the device* and returns the body as text. This bypasses
 * browser CORS entirely (the response comes back as shell stdout), which is how
 * we read CORS-blocked APIs like F-Droid's.
 */
export async function deviceFetchText(adb: Adb, url: string): Promise<string> {
	const downloader = await detectDownloader(adb);
	if (!downloader) {
		throw new Error("Device has no curl or wget");
	}
	const { stdout, exitCode } = await execShell(
		adb,
		getCommand(downloader, url),
		{
			timeoutMs: 30_000,
		},
	);
	if (exitCode !== 0) {
		throw new Error(`Request failed: ${url}`);
	}
	return stdout;
}

async function getRemoteSize(
	adb: Adb,
	downloader: Downloader,
	url: string,
): Promise<number | null> {
	if (downloader !== "curl") return null;
	try {
		const { stdout } = await execShell(adb, `curl -fsSLI "${url}"`, {
			timeoutMs: 15_000,
		});
		const matches = [...stdout.matchAll(/content-length:\s*(\d+)/gi)];
		const size = Number(matches.at(-1)?.[1]);
		return Number.isFinite(size) && size > 0 ? size : null;
	} catch {
		return null;
	}
}

/**
 * Downloads an APK on the device and installs it. The whole transfer happens
 * device-side (no CORS, no browser memory), then `pm install` runs locally.
 * Download progress is approximated by polling the destination file size
 * against the URL's Content-Length; `percent` is null when the size is
 * unknown or the stage has no measurable progress.
 */
export async function installFromUrl(
	adb: Adb,
	url: string,
	onProgress?: (stage: InstallStage, percent: number | null) => void,
): Promise<void> {
	const downloader = await detectDownloader(adb);
	if (!downloader) {
		throw new Error(
			"This device has no curl or wget, so it can't download the APK itself. Use drag & drop instead.",
		);
	}

	const dest = `/data/local/tmp/openportal-${Date.now()}.apk`;

	onProgress?.("downloading", null);
	const total = await getRemoteSize(adb, downloader, url);

	const download =
		downloader === "curl"
			? `curl -fsSL -o "${dest}" "${url}"`
			: `wget -q -O "${dest}" "${url}"`;

	let downloadDone = false;
	const downloadPromise = execShell(adb, download, {
		timeoutMs: 180_000,
	}).finally(() => {
		downloadDone = true;
	});

	const progressLoop = (async () => {
		if (!total) return;
		while (!downloadDone) {
			await new Promise((resolve) => setTimeout(resolve, 1000));
			if (downloadDone) break;
			try {
				const { stdout } = await execShell(
					adb,
					`wc -c < "${dest}" 2>/dev/null || echo 0`,
				);
				const bytes = Number(stdout.trim());
				if (bytes > 0) {
					onProgress?.(
						"downloading",
						Math.min(99, Math.round((bytes / total) * 100)),
					);
				}
			} catch {}
		}
	})();

	const downloadResult = await downloadPromise;
	await progressLoop;
	if (downloadResult.exitCode !== 0) {
		await execShell(adb, `rm -f "${dest}"`);
		throw new Error("Download failed on the device");
	}

	// Make sure we actually got a non-empty file.
	const sizeResult = await execShell(
		adb,
		`wc -c < "${dest}" 2>/dev/null || echo 0`,
	);
	if (Number(sizeResult.stdout.trim()) <= 0) {
		await execShell(adb, `rm -f "${dest}"`);
		throw new Error("Downloaded file is empty");
	}

	onProgress?.("downloading", 100);
	onProgress?.("installing", null);
	const install = await execShell(adb, `pm install -r "${dest}"`, {
		timeoutMs: 180_000,
	});
	await execShell(adb, `rm -f "${dest}"`);
	if (!install.stdout.includes("Success")) {
		throw new Error(install.stdout || "Install failed");
	}

	onProgress?.("done", null);
}
