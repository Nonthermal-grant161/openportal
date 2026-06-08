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

/**
 * Downloads an APK on the device and installs it. The whole transfer happens
 * device-side (no CORS, no browser memory), then `pm install` runs locally.
 */
export async function installFromUrl(
	adb: Adb,
	url: string,
	onStage?: (stage: InstallStage) => void,
): Promise<void> {
	const downloader = await detectDownloader(adb);
	if (!downloader) {
		throw new Error(
			"This device has no curl or wget, so it can't download the APK itself. Use drag & drop instead.",
		);
	}

	const dest = `/data/local/tmp/openportal-${Date.now()}.apk`;

	onStage?.("downloading");
	const download =
		downloader === "curl"
			? `curl -fsSL -o "${dest}" "${url}"`
			: `wget -q -O "${dest}" "${url}"`;
	const downloadResult = await execShell(adb, download, { timeoutMs: 180_000 });
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

	onStage?.("installing");
	const install = await execShell(adb, `pm install -r "${dest}"`, {
		timeoutMs: 180_000,
	});
	await execShell(adb, `rm -f "${dest}"`);
	if (!install.stdout.includes("Success")) {
		throw new Error(install.stdout || "Install failed");
	}

	onStage?.("done");
}
