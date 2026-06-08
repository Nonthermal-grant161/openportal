import { getPlatformSupport } from "@/lib/utils/platform";
import { useDeviceStore } from "@/store/device-store";
import { ArrowRight, Monitor, Usb } from "lucide-react";
import { useTranslation } from "react-i18next";
import { BrowserCheck } from "./BrowserCheck";

export function ConnectScreen() {
	const { t } = useTranslation();
	const { state, error, connect } = useDeviceStore();
	const support = getPlatformSupport();

	const isConnecting = state === "connecting" || state === "authenticating";

	return (
		<div className="flex min-h-screen flex-col items-center justify-center px-6">
			<div className="w-full max-w-md space-y-8">
				<div className="text-center">
					<div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-foreground/5">
						<Monitor className="h-8 w-8" />
					</div>
					<h1 className="text-3xl font-bold tracking-tight">{t("appName")}</h1>
					<p className="mt-2 text-muted-foreground">
						{t("connectDescription")}
					</p>
				</div>

				<BrowserCheck />

				<button
					type="button"
					onClick={() => connect()}
					disabled={!support.supported || isConnecting}
					className="flex w-full items-center justify-center gap-3 rounded-xl bg-foreground px-6 py-4 text-lg font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
				>
					{isConnecting ? (
						<div className="h-5 w-5 animate-spin rounded-full border-2 border-background border-t-transparent" />
					) : (
						<Usb className="h-5 w-5" />
					)}
					{isConnecting ? t("connecting") : t("connectYourPortal")}
				</button>

				{error && (
					<div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
						{error}
					</div>
				)}

				<div className="space-y-3">
					<Step number={1} text={t("step1")} />
					<Step number={2} text={t("step2")} />
					<Step number={3} text={t("step3")} />
				</div>

				<details className="rounded-lg border border-border bg-card/50 px-4 py-3 text-sm">
					<summary className="cursor-pointer text-muted-foreground hover:text-foreground">
						{t("usbGuideTitle")}
					</summary>
					<p className="mt-2 text-muted-foreground">{t("usbGuideBody")}</p>
				</details>
			</div>
		</div>
	);
}

function Step({ number, text }: { number: number; text: string }) {
	return (
		<div className="flex items-center gap-3 text-sm text-muted-foreground">
			<div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium text-foreground">
				{number}
			</div>
			<span>{text}</span>
			<ArrowRight className="ml-auto h-3 w-3 opacity-30" />
		</div>
	);
}
