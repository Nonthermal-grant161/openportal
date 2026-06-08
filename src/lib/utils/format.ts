export function formatBytes(bytes: number): string {
	if (bytes === 0) return "0 B";
	const units = ["B", "KB", "MB", "GB", "TB"];
	const i = Math.floor(Math.log(bytes) / Math.log(1024));
	const value = bytes / 1024 ** i;
	return `${value.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

export function formatStoragePercent(used: number, total: number): number {
	if (total === 0) return 0;
	return Math.round((used / total) * 100);
}
