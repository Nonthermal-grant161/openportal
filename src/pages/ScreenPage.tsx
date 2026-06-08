import { Button, Card, PageHeader } from "@/components/ui/primitives";
import {
	canvasToPngBlob,
	captureScreen,
	drawScreenshot,
} from "@/lib/adb/screen";
import { downloadBlob } from "@/lib/utils/download";
import { useDeviceStore } from "@/store/device-store";
import { Camera, Download, Monitor, Play, Square } from "lucide-react";
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
	const [fps, setFps] = useState<number>(2);

	const mirroringRef = useRef(false);
	const fpsRef = useRef(fps);
	fpsRef.current = fps;

	const grab = useCallback(async (): Promise<boolean> => {
		if (!adb || !canvasRef.current) return false;
		const shot = await captureScreen(adb);
		drawScreenshot(canvasRef.current, shot);
		setHasImage(true);
		return true;
	}, [adb]);

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

	const stopMirror = useCallback(() => {
		mirroringRef.current = false;
		setMirroring(false);
	}, []);

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
				const wait = Math.max(0, 1000 / fpsRef.current - elapsed);
				await new Promise((r) => setTimeout(r, wait));
			}
		};
		void loop();
	}, [grab, stopMirror, t]);

	// Stop the capture loop when leaving the page.
	useEffect(() => () => stopMirror(), [stopMirror]);

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
						disabled={mirroring}
					>
						<Camera className="h-4 w-4" />
						{t("screen.capture")}
					</Button>

					{mirroring ? (
						<Button variant="danger" onClick={stopMirror}>
							<Square className="h-4 w-4" />
							{t("screen.stopMirror")}
						</Button>
					) : (
						<Button variant="secondary" onClick={startMirror}>
							<Play className="h-4 w-4" />
							{t("screen.startMirror")}
						</Button>
					)}

					<div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
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
					{/* Canvas is always mounted so refs are stable; hidden until first frame. */}
					<canvas
						ref={canvasRef}
						className={`max-h-[70vh] w-auto max-w-full rounded ${hasImage ? "" : "hidden"}`}
					/>
					{!hasImage && (
						<div className="flex flex-col items-center gap-2 py-20 text-center text-muted-foreground">
							<Monitor className="h-8 w-8" />
							<p className="text-sm">{t("screen.empty")}</p>
						</div>
					)}
				</div>

				<p className="mt-3 text-xs text-muted-foreground">
					{t("screen.mirrorNote")}
				</p>
			</Card>
		</div>
	);
}
