import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";

const LANGUAGES = [
	{ code: "en", label: "EN" },
	{ code: "fr", label: "FR" },
];

export function LanguageSwitcher() {
	const { i18n, t } = useTranslation();
	const current = i18n.resolvedLanguage ?? i18n.language;

	return (
		<label
			className="flex items-center gap-1.5 text-muted-foreground"
			title={t("language")}
		>
			<Languages className="h-4 w-4" />
			<select
				value={LANGUAGES.some((l) => l.code === current) ? current : "en"}
				onChange={(e) => i18n.changeLanguage(e.target.value)}
				className="cursor-pointer rounded-md bg-transparent py-1 text-sm font-medium text-foreground outline-none"
				aria-label={t("language")}
			>
				{LANGUAGES.map((lang) => (
					<option key={lang.code} value={lang.code}>
						{lang.label}
					</option>
				))}
			</select>
		</label>
	);
}
