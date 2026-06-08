import { useEffect } from "react";
import { useUIStore } from "@/store/ui-store";

export function useTheme() {
	const theme = useUIStore((s) => s.theme);

	useEffect(() => {
		const root = document.documentElement;

		if (theme === "system") {
			const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
			root.classList.toggle("dark", isDark);
		} else {
			root.classList.toggle("dark", theme === "dark");
		}
	}, [theme]);
}
