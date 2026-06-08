import { BackupPanel } from "@/components/settings/BackupPanel";
import { PresetsPanel } from "@/components/settings/PresetsPanel";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { useUIStore } from "@/store/ui-store";
import { useTranslation } from "react-i18next";

export function SettingsPage() {
	const { t } = useTranslation("settings");
	const mode = useUIStore((s) => s.mode);

	return (
		<div className="mx-auto max-w-4xl space-y-6">
			<h1 className="text-2xl font-bold">{t("title")}</h1>
			<PresetsPanel />
			<SettingsPanel />
			{mode === "advanced" && <BackupPanel />}
		</div>
	);
}
