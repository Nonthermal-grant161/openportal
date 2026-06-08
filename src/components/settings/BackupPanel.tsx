import { Button, SectionTitle } from "@/components/ui/primitives";
import {
	exportProfile,
	importProfile,
	isDeviceProfile,
} from "@/lib/adb/backup";
import { downloadBlob } from "@/lib/utils/download";
import { useDeviceStore } from "@/store/device-store";
import { Download, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export function BackupPanel() {
	const { t } = useTranslation("settings");
	const adb = useDeviceStore((s) => s.adb);
	const portalModel = useDeviceStore((s) => s.portalModel);
	const refreshDeviceInfo = useDeviceStore((s) => s.refreshDeviceInfo);
	const [exporting, setExporting] = useState(false);
	const [importing, setImporting] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	const handleExport = async () => {
		if (!adb) return;
		setExporting(true);
		try {
			const profile = await exportProfile(adb);
			const name = portalModel?.codename ?? "portal";
			const stamp = new Date().toISOString().slice(0, 10);
			downloadBlob(
				JSON.stringify(profile, null, 2),
				`openportal-${name}-${stamp}.json`,
				"application/json",
			);
			toast.success(t("profileExported"));
		} catch (err) {
			toast.error(t("backup"), {
				description: err instanceof Error ? err.message : undefined,
			});
		} finally {
			setExporting(false);
		}
	};

	const handleImport = async (file: File) => {
		if (!adb) return;
		setImporting(true);
		try {
			const parsed = JSON.parse(await file.text());
			if (!isDeviceProfile(parsed)) {
				toast.error(t("invalidProfile"));
				return;
			}
			const result = await importProfile(adb, parsed);
			await refreshDeviceInfo();
			toast.success(t("profileImported", { count: result.applied }), {
				description:
					result.missingPackages.length > 0
						? t("missingPackagesNote", { count: result.missingPackages.length })
						: undefined,
			});
		} catch (err) {
			toast.error(t("invalidProfile"), {
				description: err instanceof Error ? err.message : undefined,
			});
		} finally {
			setImporting(false);
		}
	};

	return (
		<div className="rounded-xl border border-border bg-card p-6">
			<SectionTitle>{t("backup")}</SectionTitle>
			<p className="mb-4 text-sm text-muted-foreground">{t("backupDesc")}</p>
			<div className="flex flex-wrap gap-2">
				<Button variant="secondary" onClick={handleExport} loading={exporting}>
					<Download className="h-4 w-4" />
					{t("exportProfile")}
				</Button>
				<Button
					variant="secondary"
					onClick={() => inputRef.current?.click()}
					loading={importing}
				>
					<Upload className="h-4 w-4" />
					{t("importProfile")}
				</Button>
				<input
					ref={inputRef}
					type="file"
					accept="application/json,.json"
					className="hidden"
					onChange={(e) => {
						const file = e.target.files?.[0];
						if (file) handleImport(file);
						e.target.value = "";
					}}
				/>
			</div>
		</div>
	);
}
