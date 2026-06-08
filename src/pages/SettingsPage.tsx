import { useTranslation } from "react-i18next";
import { PresetsPanel } from "@/components/settings/PresetsPanel";
import { SettingsPanel } from "@/components/settings/SettingsPanel";

export function SettingsPage() {
	const { t } = useTranslation("settings");

	return (
		<div className="mx-auto max-w-3xl space-y-6">
			<h1 className="text-2xl font-bold">{t("title")}</h1>
			<PresetsPanel />
			<SettingsPanel />
		</div>
	);
}
