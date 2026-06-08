import { AlertTriangle, Chrome, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getPlatformSupport } from "@/lib/utils/platform";

export function BrowserCheck() {
	const { t } = useTranslation();
	const support = getPlatformSupport();

	if (support.supported) return null;

	return (
		<div className="flex flex-col gap-3">
			{!support.chromium && (
				<div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
					<Chrome className="h-5 w-5 shrink-0 text-amber-500" />
					<span>{t("browserNotSupported")}</span>
				</div>
			)}
			{!support.secure && (
				<div className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm">
					<Lock className="h-5 w-5 shrink-0 text-red-500" />
					<span>{t("httpsRequired")}</span>
				</div>
			)}
			{support.chromium && support.secure && !support.webusb && (
				<div className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm">
					<AlertTriangle className="h-5 w-5 shrink-0 text-red-500" />
					<span>WebUSB is not available in this browser</span>
				</div>
			)}
		</div>
	);
}
