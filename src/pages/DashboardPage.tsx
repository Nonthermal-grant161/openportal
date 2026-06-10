import { DeviceCard } from "@/components/dashboard/DeviceCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { StatusGrid } from "@/components/dashboard/StatusGrid";
import { StorageBar } from "@/components/dashboard/StorageBar";
import { ScreenMirror } from "@/components/screen/ScreenMirror";
import { useAppStore } from "@/store/app-store";
import { useDeviceStore } from "@/store/device-store";
import { MonitorSmartphone } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export function DashboardPage() {
	const { t } = useTranslation("dashboard");
	const adb = useDeviceStore((s) => s.adb);
	const refreshInstalled = useAppStore((s) => s.refreshInstalled);
	const [showScreen, setShowScreen] = useState(false);

	useEffect(() => {
		refreshInstalled();
	}, [refreshInstalled]);

	return (
		<div className="mx-auto max-w-4xl space-y-6">
			<h1 className="text-2xl font-bold">{t("title")}</h1>

			{adb &&
				(showScreen ? (
					<ScreenMirror autoStart onClose={() => setShowScreen(false)} />
				) : (
					<button
						type="button"
						onClick={() => setShowScreen(true)}
						className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3 text-sm text-muted-foreground transition-colors hover:bg-accent/30 hover:text-foreground"
					>
						<MonitorSmartphone className="h-4 w-4" />
						{t("showScreen")}
					</button>
				))}

			<DeviceCard />
			<StatusGrid />
			<StorageBar />
			<QuickActions />
		</div>
	);
}
