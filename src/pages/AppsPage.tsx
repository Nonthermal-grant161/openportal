import { ApkInstaller } from "@/components/apps/ApkInstaller";
import { AppCatalog } from "@/components/apps/AppCatalog";
import { InstalledAppsList } from "@/components/apps/InstalledAppsList";
import { useAppStore } from "@/store/app-store";
import { useUIStore } from "@/store/ui-store";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export function AppsPage() {
	const { t } = useTranslation("apps");
	const mode = useUIStore((s) => s.mode);
	const refreshInstalled = useAppStore((s) => s.refreshInstalled);

	useEffect(() => {
		refreshInstalled();
	}, [refreshInstalled]);

	return (
		<div className="mx-auto max-w-3xl space-y-6">
			<h1 className="text-2xl font-bold">{t("title")}</h1>
			<ApkInstaller />
			<AppCatalog />
			{mode === "advanced" && <InstalledAppsList />}
		</div>
	);
}
