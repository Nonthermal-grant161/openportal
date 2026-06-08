import { ScreenMirror } from "@/components/screen/ScreenMirror";
import { PageHeader } from "@/components/ui/primitives";
import { useTranslation } from "react-i18next";

export function ScreenPage() {
	const { t } = useTranslation("tools");

	return (
		<div className="mx-auto max-w-4xl space-y-6">
			<PageHeader title={t("screen.title")} />
			<ScreenMirror autoStart />
		</div>
	);
}
