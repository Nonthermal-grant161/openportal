import { useTranslation } from "react-i18next";
import { useDeviceStore } from "@/store/device-store";
import { useUIStore } from "@/store/ui-store";

interface StatusItem {
	labelKey: string;
	value: boolean;
	positiveKey?: string;
	negativeKey?: string;
	advancedOnly?: boolean;
}

export function StatusGrid() {
	const { t } = useTranslation("dashboard");
	const { deviceInfo } = useDeviceStore();
	const { mode } = useUIStore();

	if (!deviceInfo) return null;

	const items: StatusItem[] = [
		{ labelKey: "testHarness", value: deviceInfo.testHarnessActive, positiveKey: "active", negativeKey: "inactive" },
		{ labelKey: "adbPersistent", value: deviceInfo.adbPersistent, positiveKey: "active", negativeKey: "inactive" },
		{ labelKey: "otaBlocked", value: deviceInfo.otaBlocked, positiveKey: "blocked", negativeKey: "active" },
		{ labelKey: "hiddenApiUnlocked", value: deviceInfo.hiddenApiDisabled, positiveKey: "unlocked", negativeKey: "locked", advancedOnly: true },
		{ labelKey: "bootloaderLocked", value: deviceInfo.bootloaderLocked, positiveKey: "locked", negativeKey: "unlocked", advancedOnly: true },
		{ labelKey: "oemUnlockAllowed", value: deviceInfo.oemUnlockAllowed, positiveKey: "allowed", negativeKey: "blocked", advancedOnly: true },
	];

	const visibleItems = items.filter(
		(item) => !item.advancedOnly || mode === "advanced",
	);

	return (
		<div className="rounded-xl border border-border bg-card p-6">
			<h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
				{t("status")}
			</h3>
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
				{visibleItems.map((item) => (
					<div
						key={item.labelKey}
						className="flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-2"
					>
						<div
							className={`h-2 w-2 shrink-0 rounded-full ${
								item.value ? "bg-emerald-500" : "bg-zinc-500"
							}`}
						/>
						<div className="min-w-0">
							<div className="truncate text-xs text-muted-foreground">
								{t(item.labelKey)}
							</div>
							<div className="text-sm font-medium">
								{t(item.value ? (item.positiveKey ?? "active") : (item.negativeKey ?? "inactive"))}
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
