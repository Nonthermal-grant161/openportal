import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ApkInstaller } from "@/components/apps/ApkInstaller";
import { AppCatalog } from "@/components/apps/AppCatalog";
import { useAppStore } from "@/store/app-store";

export function AppsPage() {
	const { t } = useTranslation("apps");
	const refreshInstalled = useAppStore((s) => s.refreshInstalled);

	useEffect(() => {
		refreshInstalled();
	}, [refreshInstalled]);

	return (
		<div className="mx-auto max-w-3xl space-y-6">
			<h1 className="text-2xl font-bold">{t("title")}</h1>
			<ApkInstaller />
			<AppCatalog />
		</div>
	);
}
