import { Button } from "@/components/ui/primitives";
import { getPlatformSupport } from "@/lib/utils/platform";
import { useDeviceStore } from "@/store/device-store";
import { Usb } from "lucide-react";
import { useTranslation } from "react-i18next";

export function ConnectButton() {
	const { t } = useTranslation();
	const { state, connect } = useDeviceStore();

	if (state === "connected") return null;

	const support = getPlatformSupport();
	const isConnecting = state === "connecting" || state === "authenticating";

	return (
		<Button
			variant="primary"
			onClick={() => connect()}
			disabled={!support.supported || isConnecting}
			loading={isConnecting}
		>
			{!isConnecting && <Usb className="h-4 w-4" />}
			{isConnecting ? t("connecting") : t("connect")}
		</Button>
	);
}
