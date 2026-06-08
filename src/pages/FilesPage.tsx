import { FileBrowser } from "@/components/files/FileBrowser";
import { PageHeader } from "@/components/ui/primitives";
import { useTranslation } from "react-i18next";

export function FilesPage() {
	const { t } = useTranslation("tools");

	return (
		<div className="mx-auto max-w-4xl space-y-6">
			<PageHeader title={t("files.title")} />
			<FileBrowser />
		</div>
	);
}
