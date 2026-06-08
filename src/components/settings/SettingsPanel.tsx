import { getSetting, putSetting } from "@/lib/adb/settings";
import type { SettingsNamespace } from "@/lib/adb/settings";
import { useDeviceStore } from "@/store/device-store";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

interface SettingToggle {
	labelKey: string;
	descKey: string;
	namespace: SettingsNamespace;
	settingKey: string;
	onValue: string;
	offValue: string;
}

const SETTING_TOGGLES: SettingToggle[] = [
	{
		labelKey: "darkMode",
		descKey: "darkModeDesc",
		namespace: "secure",
		settingKey: "ui_night_mode",
		onValue: "2",
		offValue: "1",
	},
	{
		labelKey: "stayOn",
		descKey: "stayOnDesc",
		namespace: "global",
		settingKey: "stay_on_while_plugged_in",
		onValue: "7",
		offValue: "0",
	},
	{
		labelKey: "otaUpdates",
		descKey: "otaUpdatesDesc",
		namespace: "global",
		settingKey: "ota_disable_automatic_update",
		onValue: "1",
		offValue: "0",
	},
	{
		labelKey: "packageVerification",
		descKey: "packageVerificationDesc",
		namespace: "global",
		settingKey: "package_verifier_enable",
		onValue: "0",
		offValue: "1",
	},
	{
		labelKey: "hiddenApi",
		descKey: "hiddenApiDesc",
		namespace: "global",
		settingKey: "hidden_api_policy",
		onValue: "1",
		offValue: "0",
	},
];

export function SettingsPanel() {
	const { t } = useTranslation("settings");

	return (
		<div className="rounded-xl border border-border bg-card p-6">
			<h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
				{t("deviceSettings")}
			</h3>
			<div className="divide-y divide-border">
				{SETTING_TOGGLES.map((toggle) => (
					<SettingRow key={toggle.settingKey} toggle={toggle} />
				))}
			</div>
		</div>
	);
}

function SettingRow({ toggle }: { toggle: SettingToggle }) {
	const { t } = useTranslation("settings");
	const adb = useDeviceStore((s) => s.adb);
	const [value, setValue] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const isOn = value === toggle.onValue;

	const loadValue = useCallback(async () => {
		if (!adb) return;
		const val = await getSetting(adb, toggle.namespace, toggle.settingKey);
		setValue(val);
	}, [adb, toggle.namespace, toggle.settingKey]);

	useEffect(() => {
		loadValue();
	}, [loadValue]);

	const handleToggle = async () => {
		if (!adb || loading) return;
		setLoading(true);
		try {
			const newValue = isOn ? toggle.offValue : toggle.onValue;
			await putSetting(adb, toggle.namespace, toggle.settingKey, newValue);
			setValue(newValue);
		} catch (err) {
			toast.error(t(toggle.labelKey), {
				description: err instanceof Error ? err.message : undefined,
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
			<div>
				<div className="text-sm font-medium">{t(toggle.labelKey)}</div>
				<div className="text-xs text-muted-foreground">{t(toggle.descKey)}</div>
			</div>
			<button
				type="button"
				onClick={handleToggle}
				disabled={loading || value === null}
				className={`relative h-6 w-11 rounded-full transition-colors ${
					isOn ? "bg-emerald-500" : "bg-secondary"
				} disabled:opacity-50`}
			>
				{loading ? (
					<Loader2 className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 animate-spin" />
				) : (
					<div
						className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
							isOn ? "translate-x-5.5" : "translate-x-0.5"
						}`}
					/>
				)}
			</button>
		</div>
	);
}
