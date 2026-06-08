import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { DeviceCard } from "@/components/dashboard/DeviceCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { StatusGrid } from "@/components/dashboard/StatusGrid";
import { StorageBar } from "@/components/dashboard/StorageBar";
import { useAppStore } from "@/store/app-store";
import { useUIStore } from "@/store/ui-store";

export function DashboardPage() {
	const { t } = useTranslation("dashboard");
	const { mode } = useUIStore();
	const refreshInstalled = useAppStore((s) => s.refreshInstalled);

	useEffect(() => {
		refreshInstalled();
	}, [refreshInstalled]);

	return (
		<div className="mx-auto max-w-3xl space-y-6">
			<h1 className="text-2xl font-bold">{t("title")}</h1>
			<DeviceCard />
			<StatusGrid />
			<StorageBar />
			{mode === "classic" && <QuickActions />}
		</div>
	);
}
