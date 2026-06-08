import { disableOverlay, setDefaultLauncher } from "@/lib/adb/app-manager";
import { PRESETS, applyPreset, putSetting } from "@/lib/adb/settings";
import { useAppStore } from "@/store/app-store";
import { useDeviceStore } from "@/store/device-store";
import { Download, Shield, Zap } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export function QuickActions() {
	const { t } = useTranslation("dashboard");

	return (
		<div className="rounded-xl border border-border bg-card p-6">
			<h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
				{t("quickActions")}
			</h3>
			<div className="grid gap-3 sm:grid-cols-3">
				<ActionButton
					icon={Download}
					label={t("installImmortal")}
					description={t("installImmortalDesc")}
					action="immortal"
				/>
				<ActionButton
					icon={Shield}
					label={t("blockOta")}
					description={t("blockOtaDesc")}
					action="ota"
				/>
				<ActionButton
					icon={Zap}
					label={t("applySettings")}
					description={t("applySettingsDesc")}
					action="settings"
				/>
			</div>
		</div>
	);
}

function ActionButton({
	icon: Icon,
	label,
	description,
	action,
}: {
	icon: React.ComponentType<{ className?: string }>;
	label: string;
	description: string;
	action: "immortal" | "ota" | "settings";
}) {
	const { t } = useTranslation("dashboard");
	const [loading, setLoading] = useState(false);
	const [done, setDone] = useState(false);
	const adb = useDeviceStore((s) => s.adb);
	const refreshDeviceInfo = useDeviceStore((s) => s.refreshDeviceInfo);
	const isInstalled = useAppStore((s) => s.isInstalled);

	const handleClick = async () => {
		if (!adb || loading) return;
		setLoading(true);
		try {
			switch (action) {
				case "immortal": {
					if (!isInstalled("com.immortal.launcher")) {
						toast.error(label, {
							description: t("immortalNotInstalled"),
						});
						return;
					}
					await setDefaultLauncher(adb, "com.immortal.launcher/.HomeActivity");
					await disableOverlay(adb, "com.facebook.aloha.rro.niu.android");
					break;
				}
				case "ota":
					await putSetting(adb, "global", "ota_disable_automatic_update", "1");
					break;
				case "settings": {
					const preset = PRESETS.find((p) => p.id === "recommended");
					if (preset) await applyPreset(adb, preset);
					break;
				}
			}
			setDone(true);
			await refreshDeviceInfo();
			toast.success(label, { description: t("actionApplied") });
			setTimeout(() => setDone(false), 2000);
		} catch (err) {
			toast.error(label, {
				description: err instanceof Error ? err.message : undefined,
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<button
			type="button"
			onClick={handleClick}
			disabled={loading}
			className="flex flex-col items-start gap-3 rounded-lg border border-border bg-background p-4 text-left transition-colors hover:bg-accent/50 disabled:opacity-50"
		>
			<Icon className={`h-5 w-5 ${done ? "text-emerald-500" : ""}`} />
			<div>
				<div className="text-sm font-medium">{label}</div>
				<div className="mt-1 text-xs text-muted-foreground">{description}</div>
			</div>
		</button>
	);
}
