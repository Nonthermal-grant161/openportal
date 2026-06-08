import { Check, Loader2, Zap } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { applyPreset, PRESETS } from "@/lib/adb/settings";
import { useDeviceStore } from "@/store/device-store";

export function PresetsPanel() {
	const { t } = useTranslation("settings");

	return (
		<div className="rounded-xl border border-border bg-card p-6">
			<h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
				{t("presets")}
			</h3>
			<p className="mb-4 text-sm text-muted-foreground">
				{t("presetsDescription")}
			</p>
			<div className="space-y-3">
				{PRESETS.map((preset) => (
					<PresetButton key={preset.id} preset={preset} />
				))}
			</div>
		</div>
	);
}

function PresetButton({
	preset,
}: { preset: (typeof PRESETS)[number] }) {
	const { t } = useTranslation();
	const [loading, setLoading] = useState(false);
	const [done, setDone] = useState(false);
	const adb = useDeviceStore((s) => s.adb);
	const refreshDeviceInfo = useDeviceStore((s) => s.refreshDeviceInfo);

	const handleApply = async () => {
		if (!adb || loading) return;
		setLoading(true);
		try {
			await applyPreset(adb, preset);
			setDone(true);
			await refreshDeviceInfo();
			setTimeout(() => setDone(false), 2000);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex items-center justify-between rounded-lg border border-border bg-background p-4">
			<div>
				<div className="flex items-center gap-2 text-sm font-medium">
					<Zap className="h-4 w-4" />
					{t(preset.nameKey)}
				</div>
				<p className="mt-1 text-xs text-muted-foreground">
					{t(preset.descriptionKey)}
				</p>
			</div>
			<button
				type="button"
				onClick={handleApply}
				disabled={loading}
				className="flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
			>
				{loading ? (
					<Loader2 className="h-4 w-4 animate-spin" />
				) : done ? (
					<Check className="h-4 w-4 text-emerald-500" />
				) : null}
				{t("common:apply")}
			</button>
		</div>
	);
}
