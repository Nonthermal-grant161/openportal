import type { Adb } from "@yume-chan/adb";
import { AdbScrcpyClient, AdbScrcpyOptions2_3 } from "@yume-chan/adb-scrcpy";
import {
	AndroidMotionEventAction,
	DefaultServerPath,
	type ScrcpyControlMessageWriter,
} from "@yume-chan/scrcpy";
import {
	BitmapVideoFrameRenderer,
	WebCodecsVideoDecoder,
} from "@yume-chan/scrcpy-decoder-webcodecs";
import { ReadableStream, WritableStream } from "@yume-chan/stream-extra";

// Must match the bundled binary at public/scrcpy-server (scrcpy-server-v2.3).
const SERVER_VERSION = "2.3";

// scrcpy uses negative pointer ids for synthetic pointers; -1 = mouse.
const MOUSE_POINTER_ID = -1n;

export { AndroidMotionEventAction };
export type TouchAction =
	(typeof AndroidMotionEventAction)[keyof typeof AndroidMotionEventAction];

export function isScrcpySupported(): boolean {
	return WebCodecsVideoDecoder.isSupported;
}

export interface ScrcpySession {
	readonly width: number;
	readonly height: number;
	readonly hasControl: boolean;
	/** Inject a touch at normalized coordinates (0..1). */
	injectTouch(action: TouchAction, normX: number, normY: number): Promise<void>;
	stop: () => Promise<void>;
}

export interface StartScrcpyOptions {
	maxSize?: number;
	videoBitRate?: number;
}

/**
 * Starts scrcpy: pushes the server, opens the video + control streams, and
 * decodes H.264 onto `canvas` via WebCodecs.
 *
 * Audio is disabled; the Portal runs Android 10 and scrcpy audio needs 11+.
 */
export async function startScrcpy(
	adb: Adb,
	canvas: HTMLCanvasElement,
	serverUrl: string,
	options: StartScrcpyOptions = {},
): Promise<ScrcpySession> {
	const response = await fetch(serverUrl);
	if (!response.ok) {
		throw new Error(`Could not load scrcpy-server (HTTP ${response.status})`);
	}
	const server = new Uint8Array(await response.arrayBuffer());

	await AdbScrcpyClient.pushServer(
		adb,
		new ReadableStream<Uint8Array>({
			start(controller) {
				controller.enqueue(server);
				controller.close();
			},
		}),
	);

	const scrcpyOptions = new AdbScrcpyOptions2_3(
		{
			video: true,
			audio: false,
			control: true,
			maxSize: options.maxSize ?? 1280,
			videoBitRate: options.videoBitRate ?? 4_000_000,
		},
		{ version: SERVER_VERSION },
	);

	const client = await AdbScrcpyClient.start(
		adb,
		DefaultServerPath,
		scrcpyOptions,
	);

	// Drain the server log output so the connection doesn't block.
	void client.output.pipeTo(new WritableStream({ write() {} })).catch(() => {});

	const videoStream = await client.videoStream;
	if (!videoStream) {
		await client.close();
		throw new Error("Device did not provide a video stream");
	}

	const renderer = new BitmapVideoFrameRenderer(canvas);
	const decoder = new WebCodecsVideoDecoder({
		codec: videoStream.metadata.codec,
		renderer,
	});
	void videoStream.stream.pipeTo(decoder.writable).catch(() => {});

	let width = videoStream.width;
	let height = videoStream.height;
	videoStream.sizeChanged(({ width: w, height: h }) => {
		width = w;
		height = h;
	});

	const controller: ScrcpyControlMessageWriter | undefined = client.controller;

	return {
		get width() {
			return width;
		},
		get height() {
			return height;
		},
		hasControl: controller !== undefined,
		async injectTouch(action, normX, normY) {
			if (!controller) return;
			const isUp = action === AndroidMotionEventAction.Up;
			const isTap =
				action === AndroidMotionEventAction.Down ||
				action === AndroidMotionEventAction.Up;
			await controller.injectTouch({
				action,
				pointerId: MOUSE_POINTER_ID,
				pointerX: Math.round(normX * width),
				pointerY: Math.round(normY * height),
				videoWidth: width,
				videoHeight: height,
				pressure: isUp ? 0 : 1,
				actionButton: isTap ? 1 : 0,
				buttons: isUp ? 0 : 1,
			});
		},
		async stop() {
			decoder.dispose();
			await client.close();
		},
	};
}
