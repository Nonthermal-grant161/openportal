/** Triggers a browser download for the given data. */
export function downloadBlob(
	data: Blob | Uint8Array | string,
	filename: string,
	mimeType = "application/octet-stream",
): void {
	const blob =
		data instanceof Blob
			? data
			: new Blob([typeof data === "string" ? data : (data as BlobPart)], {
					type: mimeType,
				});
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = filename;
	document.body.appendChild(anchor);
	anchor.click();
	anchor.remove();
	// Revoke on the next tick so the download has time to start.
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}
