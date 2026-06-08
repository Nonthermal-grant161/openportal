import { useUIStore } from "@/store/ui-store";
import { useTranslation } from "react-i18next";

export function ModeToggle() {
	const { t } = useTranslation();
	const { mode, setMode } = useUIStore();

	return (
		<div className="flex items-center gap-2 rounded-lg bg-secondary p-1">
			<button
				type="button"
				onClick={() => setMode("classic")}
				className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
					mode === "classic"
						? "bg-background text-foreground shadow-sm"
						: "text-muted-foreground hover:text-foreground"
				}`}
			>
				{t("classic")}
			</button>
			<button
				type="button"
				onClick={() => setMode("advanced")}
				className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
					mode === "advanced"
						? "bg-background text-foreground shadow-sm"
						: "text-muted-foreground hover:text-foreground"
				}`}
			>
				{t("advanced")}
			</button>
		</div>
	);
}
