import { EmptyState } from "@/components/ui/primitives";
import { useDeviceStore } from "@/store/device-store";
import { Usb } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ConnectButton } from "./ConnectButton";

export function ConnectGate({ children }: { children: React.ReactNode }) {
	const state = useDeviceStore((s) => s.state);

	if (state === "connected") return <>{children}</>;

	return <NeedsDeviceEmptyState />;
}

function NeedsDeviceEmptyState() {
	const { t } = useTranslation();

	return (
		<EmptyState
			icon={Usb}
			title={t("needsDeviceTitle")}
			description={t("needsDeviceDescription")}
		>
			<ConnectButton />
		</EmptyState>
	);
}
