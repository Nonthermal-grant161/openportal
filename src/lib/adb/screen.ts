import type { Adb } from "@yume-chan/adb";

export interface Screenshot {
	width: number;
	height: number;
	data: Uint8ClampedArray;
}

/**
 * Captures the current screen via the ADB framebuffer service and normalizes it
 * to RGBA, regardless of the device's native channel layout.
 *
 * Throws if the device forbids framebuffer access (some secured builds do).
 */
export async function captureScreen(adb: Adb): Promise<Screenshot> {
	const fb = await adb.framebuffer();
	const width = fb.width;
	const height = fb.height;
	const source = fb.data;
	const bytesPerPixel = (fb.bpp || 32) >> 3;

	const rByte = fb.red_offset >> 3;
	const gByte = fb.green_offset >> 3;
	const bByte = fb.blue_offset >> 3;
	const aByte = fb.alpha_offset >> 3;
	const hasAlpha = fb.alpha_length > 0;

	const out = new Uint8ClampedArray(width * height * 4);
	const pixelCount = width * height;
	for (let p = 0, i = 0; p < pixelCount; p++, i += bytesPerPixel) {
		const o = p * 4;
		out[o] = source[i + rByte] ?? 0;
		out[o + 1] = source[i + gByte] ?? 0;
		out[o + 2] = source[i + bByte] ?? 0;
		out[o + 3] = hasAlpha ? (source[i + aByte] ?? 255) : 255;
	}

	return { width, height, data: out };
}

/** Renders a captured screenshot onto a canvas, resizing it to match. */
export function drawScreenshot(
	canvas: HTMLCanvasElement,
	shot: Screenshot,
): void {
	canvas.width = shot.width;
	canvas.height = shot.height;
	const ctx = canvas.getContext("2d");
	if (!ctx) return;
	const image = ctx.createImageData(shot.width, shot.height);
	image.data.set(shot.data);
	ctx.putImageData(image, 0, 0);
}

/** Converts a canvas to a PNG Blob. */
export function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
	return new Promise((resolve, reject) => {
		canvas.toBlob((blob) => {
			if (blob) resolve(blob);
			else reject(new Error("Failed to encode PNG"));
		}, "image/png");
	});
}
