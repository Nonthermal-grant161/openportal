import { Button, Card, PageHeader } from "@/components/ui/primitives";
import {
	AndroidMotionEventAction,
	type ScrcpySession,
	isScrcpySupported,
	startScrcpy,
} from "@/lib/adb/scrcpy";
import {
	canvasToPngBlob,
	captureScreen,
	drawScreenshot,
} from "@/lib/adb/screen";
import { downloadBlob } from "@/lib/utils/download";
import { useDeviceStore } from "@/store/device-store";
import {
	Camera,
	Download,
	Monitor,
	MonitorPlay,
	Play,
	Square,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

const FPS_OPTIONS = [1, 2, 4] as const;

export function ScreenPage() {
	const { t } = useTranslation("tools");
	const adb = useDeviceStore((s) => s.adb);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [hasImage, setHasImage] = useState(false);
	const [capturing, setCapturing] = useState(false);
	const [mirroring, setMirroring] = useState(false);
	const [scrcpyActive, setScrcpyActive] = useState(false);
	const [scrcpyStarting, setScrcpyStarting] = useState(false);
	const [fps, setFps] = useState<number>(2);

	const mirroringRef = useRef(false);
	const scrcpyRef = useRef<ScrcpySession | null>(null);
	const pointerDownRef = useRef(false);
	const fpsRef = useRef(fps);
	fpsRef.current = fps;

	const scrcpySupported = isScrcpySupported();

	const grab = useCallback(async (): Promise<void> => {
		if (!adb || !canvasRef.current) return;
		const shot = await captureScreen(adb);
		drawScreenshot(canvasRef.current, shot);
		setHasImage(true);
	}, [adb]);

	const stopScrcpy = useCallback(async () => {
		const session = scrcpyRef.current;
		scrcpyRef.current = null;
		setScrcpyActive(false);
		if (session) await session.stop().catch(() => {});
	}, []);

	const stopMirror = useCallback(() => {
		mirroringRef.current = false;
		setMirroring(false);
	}, []);

	const handleCapture = async () => {
		setCapturing(true);
		try {
			await grab();
		} catch (err) {
			toast.error(t("screen.captureError"), {
				description: err instanceof Error ? err.message : t("screen.forbidden"),
			});
		} finally {
			setCapturing(false);
		}
	};

	const startMirror = useCallback(() => {
		if (mirroringRef.current) return;
		mirroringRef.current = true;
		setMirroring(true);

		const loop = async () => {
			while (mirroringRef.current) {
				const startedAt = performance.now();
				try {
					await grab();
				} catch (err) {
					toast.error(t("screen.captureError"), {
						description:
							err instanceof Error ? err.message : t("screen.forbidden"),
					});
					stopMirror();
					return;
				}
				const elapsed = performance.now() - startedAt;
				await new Promise((r) =>
					setTimeout(r, Math.max(0, 1000 / fpsRef.current - elapsed)),
				);
			}
		};
		void loop();
	}, [grab, stopMirror, t]);

	const startMirrorScrcpy = async () => {
		if (!adb || !canvasRef.current || scrcpyRef.current) return;
		stopMirror();
		setScrcpyStarting(true);
		try {
			const session = await startScrcpy(
				adb,
				canvasRef.current,
				`${import.meta.env.BASE_URL}scrcpy-server`,
			);
			scrcpyRef.current = session;
			setScrcpyActive(true);
			setHasImage(true);
		} catch (err) {
			toast.error(t("screen.scrcpyError"), {
				description: err instanceof Error ? err.message : undefined,
			});
		} finally {
			setScrcpyStarting(false);
		}
	};

	// Tear everything down when leaving the page.
	useEffect(() => {
		return () => {
			mirroringRef.current = false;
			scrcpyRef.current?.stop().catch(() => {});
			scrcpyRef.current = null;
		};
	}, []);

	const normalized = (e: React.PointerEvent<HTMLCanvasElement>) => {
		const rect = e.currentTarget.getBoundingClientRect();
		const nx = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
		const ny = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
		return { nx, ny };
	};

	const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
		if (!scrcpyRef.current) return;
		pointerDownRef.current = true;
		e.currentTarget.setPointerCapture(e.pointerId);
		const { nx, ny } = normalized(e);
		void scrcpyRef.current.injectTouch(AndroidMotionEventAction.Down, nx, ny);
	};

	const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
		if (!scrcpyRef.current || !pointerDownRef.current) return;
		const { nx, ny } = normalized(e);
		void scrcpyRef.current.injectTouch(AndroidMotionEventAction.Move, nx, ny);
	};

	const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
		if (!scrcpyRef.current || !pointerDownRef.current) return;
		pointerDownRef.current = false;
		const { nx, ny } = normalized(e);
		void scrcpyRef.current.injectTouch(AndroidMotionEventAction.Up, nx, ny);
	};

	const handleDownload = async () => {
		if (!canvasRef.current || !hasImage) return;
		try {
			const blob = await canvasToPngBlob(canvasRef.current);
			const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
			downloadBlob(blob, `portal-screenshot-${stamp}.png`, "image/png");
		} catch (err) {
			toast.error(t("screen.captureError"), {
				description: err instanceof Error ? err.message : undefined,
			});
		}
	};

	const liveBusy = mirroring || scrcpyActive || scrcpyStarting;

	return (
		<div className="mx-auto max-w-4xl space-y-6">
			<PageHeader
				title={t("screen.title")}
				description={t("screen.description")}
			/>

			<Card>
				<div className="mb-4 flex flex-wrap items-center gap-2">
					<Button
						variant="primary"
						onClick={handleCapture}
						loading={capturing}
						disabled={liveBusy}
					>
						<Camera className="h-4 w-4" />
						{t("screen.capture")}
					</Button>

					{scrcpyActive ? (
						<Button variant="danger" onClick={stopScrcpy}>
							<Square className="h-4 w-4" />
							{t("screen.stopScrcpy")}
						</Button>
					) : (
						<Button
							variant="secondary"
							onClick={startMirrorScrcpy}
							loading={scrcpyStarting}
							disabled={!scrcpySupported || mirroring}
							title={
								scrcpySupported ? undefined : t("screen.scrcpyUnsupported")
							}
						>
							<MonitorPlay className="h-4 w-4" />
							{t("screen.mirrorScrcpy")}
						</Button>
					)}

					{mirroring ? (
						<Button variant="danger" onClick={stopMirror}>
							<Square className="h-4 w-4" />
							{t("screen.stopMirror")}
						</Button>
					) : (
						<Button
							variant="ghost"
							onClick={startMirror}
							disabled={scrcpyActive || scrcpyStarting}
						>
							<Play className="h-4 w-4" />
							{t("screen.startMirror")}
						</Button>
					)}

					<div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
						{!scrcpyActive && (
							<>
								<span>{t("screen.refreshRate")}</span>
								<select
									value={fps}
									onChange={(e) => setFps(Number(e.target.value))}
									className="rounded-md border border-border bg-background px-2 py-1 text-sm"
								>
									{FPS_OPTIONS.map((option) => (
										<option key={option} value={option}>
											{t("screen.fps", { fps: option })}
										</option>
									))}
								</select>
							</>
						)}
						<Button
							variant="ghost"
							onClick={handleDownload}
							disabled={!hasImage}
						>
							<Download className="h-4 w-4" />
							{t("screen.download")}
						</Button>
					</div>
				</div>

				<div className="flex items-center justify-center overflow-auto rounded-lg border border-border bg-black/40 p-2">
					<canvas
						ref={canvasRef}
						onPointerDown={handlePointerDown}
						onPointerMove={handlePointerMove}
						onPointerUp={handlePointerUp}
						className={`max-h-[70vh] w-auto max-w-full rounded ${
							hasImage ? "" : "hidden"
						} ${scrcpyActive ? "cursor-pointer touch-none" : ""}`}
					/>
					{!hasImage && (
						<div className="flex flex-col items-center gap-2 py-20 text-center text-muted-foreground">
							<Monitor className="h-8 w-8" />
							<p className="text-sm">{t("screen.empty")}</p>
						</div>
					)}
				</div>

				{scrcpyActive && (
					<p className="mt-3 text-xs text-muted-foreground">
						{t("screen.controlHint")}
					</p>
				)}
				<p className="mt-3 text-xs text-muted-foreground">
					{t("screen.mirrorNote")}
				</p>
			</Card>
		</div>
	);
}
