import { Button } from "@/components/ui/primitives";
import { launchApp, runPostInstall } from "@/lib/adb/app-manager";
import { makeDirectory, pushFile } from "@/lib/adb/file-system";
import { useDeviceStore } from "@/store/device-store";
import { Check, ExternalLink, FileUp, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { SetupPanelProps } from "./registry";

const GUIDE_URL = "https://github.com/ram-nat/portal-gphotos#readme";

/**
 * Mirrors the project's `deploy.sh`: pushes the user's OAuth credentials, grants
 * the system permissions the app needs, and wires it up as the device's
 * screensaver. The Google Cloud project + Photos Picker API step happens outside
 * the app, so we link to the upstream guide for it.
 */
export default function GPhotosSetup({ app, onClose }: SetupPanelProps) {
	const { t } = useTranslation("apps");
	const adb = useDeviceStore((s) => s.adb);
	const inputRef = useRef<HTMLInputElement>(null);
	const [file, setFile] = useState<File | null>(null);
	const [working, setWorking] = useState(false);

	const pkg = app.packageName;
	const filesDir = `/sdcard/Android/data/${pkg}/files`;
	const setupCommands = [
		`pm grant ${pkg} android.permission.WRITE_SECURE_SETTINGS`,
		`appops set ${pkg} WRITE_SETTINGS allow`,
		`settings put secure screensaver_components ${pkg}/${pkg}.PhotoDreamService`,
		"settings put secure screensaver_activate_on_sleep 1",
	];

	const handleApply = async () => {
		if (!adb || !file) return;
		setWorking(true);
		try {
			// The app reads a file named exactly `client_secret.json`; the download
			// from Google Cloud is named differently, so push it under that name.
			const credentials = new File([file], "client_secret.json", {
				type: "application/json",
			});
			await makeDirectory(adb, filesDir);
			await pushFile(adb, filesDir, credentials);
			await runPostInstall(adb, setupCommands);
			await launchApp(adb, pkg);
			toast.success(app.name, { description: t("gphotos.done") });
			onClose();
		} catch (err) {
			toast.error(app.name, {
				description: err instanceof Error ? err.message : t("actionFailed"),
			});
		} finally {
			setWorking(false);
		}
	};

	return (
		<div className="flex flex-col gap-4">
			<p className="text-muted-foreground">{t("gphotos.intro")}</p>

			<ol className="flex list-decimal flex-col gap-1.5 pl-4 text-xs text-muted-foreground">
				<li>{t("gphotos.step1")}</li>
				<li>{t("gphotos.step2")}</li>
				<li>{t("gphotos.step3")}</li>
			</ol>

			<a
				href={GUIDE_URL}
				target="_blank"
				rel="noreferrer"
				className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-500 hover:underline"
			>
				<ExternalLink className="h-3.5 w-3.5" />
				{t("gphotos.guideLink")}
			</a>

			<div className="flex flex-col gap-2">
				<span className="text-xs font-medium">
					{t("gphotos.credentialsLabel")}
				</span>
				<input
					ref={inputRef}
					type="file"
					accept="application/json,.json"
					className="hidden"
					onChange={(e) => setFile(e.target.files?.[0] ?? null)}
				/>
				<button
					type="button"
					onClick={() => inputRef.current?.click()}
					disabled={working}
					className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-left text-xs transition-colors hover:border-foreground/30 disabled:opacity-50"
				>
					{file ? (
						<>
							<Check className="h-4 w-4 shrink-0 text-emerald-500" />
							<span className="truncate">{file.name}</span>
						</>
					) : (
						<>
							<FileUp className="h-4 w-4 shrink-0 text-muted-foreground" />
							<span className="text-muted-foreground">
								{t("gphotos.chooseFile")}
							</span>
						</>
					)}
				</button>
			</div>

			<div className="flex justify-end pt-1">
				<Button
					variant="primary"
					onClick={handleApply}
					disabled={!adb || !file || working}
				>
					{working ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : (
						t("gphotos.apply")
					)}
				</Button>
			</div>
		</div>
	);
}
