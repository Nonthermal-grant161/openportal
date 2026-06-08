import { useDeviceStore } from "@/store/device-store";
import { useTranslation } from "react-i18next";

export function ConnectionStatus() {
	const { t } = useTranslation();
	const { state, portalModel } = useDeviceStore();

	const statusConfig = {
		disconnected: { color: "bg-zinc-500", label: t("disconnected") },
		connecting: { color: "bg-amber-500 animate-pulse", label: t("connecting") },
		authenticating: {
			color: "bg-amber-500 animate-pulse",
			label: t("connecting"),
		},
		connected: {
			color: "bg-emerald-500",
			label: portalModel?.displayName ?? t("connected"),
		},
		error: { color: "bg-red-500", label: t("error") },
	};

	const config = statusConfig[state];

	return (
		<div className="flex items-center gap-2">
			<div className={`h-2 w-2 rounded-full ${config.color}`} />
			<span className="text-sm text-muted-foreground">{config.label}</span>
		</div>
	);
}
