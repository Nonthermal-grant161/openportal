import { Button } from "@/components/ui/primitives";
import { launchApp } from "@/lib/adb/app-manager";
import { getIpAddress } from "@/lib/adb/device-info";
import { useDeviceStore } from "@/store/device-store";
import { Check, Copy, ExternalLink, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { SetupPanelProps } from "./registry";

const CONFIG_PORT = 8090;

export default function PortalCalendarSetup({ app }: SetupPanelProps) {
	const { t } = useTranslation("apps");
	const adb = useDeviceStore((s) => s.adb);
	const [working, setWorking] = useState(true);
	const [address, setAddress] = useState<string | null>(null);
	const [copied, setCopied] = useState(false);

	const url = address ? `http://${address}:${CONFIG_PORT}` : null;

	const detect = useCallback(async () => {
		if (!adb) {
			setWorking(false);
			return;
		}
		setWorking(true);
		setAddress(null);
		try {
			try {
				await launchApp(adb, app.packageName);
			} catch {}
			setAddress(await getIpAddress(adb));
		} catch {
			setAddress(null);
		} finally {
			setWorking(false);
		}
	}, [adb, app.packageName]);

	useEffect(() => {
		detect();
	}, [detect]);

	const handleCopy = async () => {
		if (!url) return;
		await navigator.clipboard.writeText(url);
		setCopied(true);
		setTimeout(() => setCopied(false), 1500);
	};

	return (
		<div className="flex flex-col gap-4">
			<p className="text-muted-foreground">{t("portalCalendar.intro")}</p>

			<ol className="flex list-decimal flex-col gap-1.5 pl-4 text-xs text-muted-foreground">
				<li>{t("portalCalendar.step1")}</li>
				<li>{t("portalCalendar.step2")}</li>
				<li>{t("portalCalendar.step3")}</li>
			</ol>

			{working ? (
				<div className="flex items-center gap-2 text-sm text-muted-foreground">
					<Loader2 className="h-4 w-4 animate-spin" />
					{t("portalCalendar.finding")}
				</div>
			) : url ? (
				<div className="flex flex-col gap-2">
					<span className="text-xs font-medium">
						{t("portalCalendar.addressLabel")}
					</span>
					<div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
						<a
							href={url}
							target="_blank"
							rel="noreferrer"
							className="inline-flex flex-1 items-center gap-1.5 truncate text-sm font-medium text-sky-500 hover:underline"
						>
							<ExternalLink className="h-3.5 w-3.5 shrink-0" />
							{url}
						</a>
						<button
							type="button"
							onClick={handleCopy}
							aria-label={t("portalCalendar.copy")}
							className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
						>
							{copied ? (
								<Check className="h-4 w-4 text-emerald-500" />
							) : (
								<Copy className="h-4 w-4" />
							)}
						</button>
					</div>
					<p className="text-xs text-muted-foreground">
						{t("portalCalendar.addressHint")}
					</p>
				</div>
			) : (
				<div className="flex flex-col gap-2">
					<p className="text-sm text-muted-foreground">
						{t("portalCalendar.noAddress")}
					</p>
					<div className="flex justify-end">
						<Button variant="secondary" onClick={detect} disabled={!adb}>
							{t("portalCalendar.retry")}
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
