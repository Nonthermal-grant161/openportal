import { useDeviceStore } from "@/store/device-store";
import { Smartphone } from "lucide-react";
import { useTranslation } from "react-i18next";

export function DeviceCard() {
	const { t } = useTranslation("dashboard");
	const { deviceInfo, portalModel } = useDeviceStore();

	if (!deviceInfo || !portalModel) return null;

	return (
		<div className="flex items-start gap-6 rounded-xl border border-border bg-card p-6">
			<div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-secondary">
				<Smartphone className="h-10 w-10 text-muted-foreground" />
			</div>
			<div className="min-w-0 flex-1">
				<h2 className="text-xl font-semibold">{portalModel.displayName}</h2>
				<div className="mt-3 grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
					<InfoRow label={t("firmware")} value={deviceInfo.buildId} />
					<InfoRow
						label={t("android")}
						value={`${deviceInfo.androidVersion} (API ${deviceInfo.apiLevel})`}
					/>
					<InfoRow label={t("soc")} value={deviceInfo.socModel.toUpperCase()} />
					<InfoRow label={t("serial")} value={deviceInfo.serial} mono />
					<InfoRow label={t("kernel")} value={deviceInfo.kernelVersion} />
					<InfoRow
						label={t("securityPatch")}
						value={deviceInfo.securityPatch}
					/>
				</div>
			</div>
		</div>
	);
}

function InfoRow({
	label,
	value,
	mono,
}: { label: string; value: string; mono?: boolean }) {
	return (
		<div className="flex items-baseline gap-2">
			<span className="text-muted-foreground">{label}</span>
			<span className={`truncate ${mono ? "font-mono text-xs" : ""}`}>
				{value || "-"}
			</span>
		</div>
	);
}
