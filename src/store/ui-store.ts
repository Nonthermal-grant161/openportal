import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UIMode = "classic" | "advanced";
export type Theme = "light" | "dark" | "system";

interface UIStore {
	mode: UIMode;
	theme: Theme;
	sidebarCollapsed: boolean;

	setMode: (mode: UIMode) => void;
	setTheme: (theme: Theme) => void;
	toggleSidebar: () => void;
}

export const useUIStore = create<UIStore>()(
	persist(
		(set) => ({
			mode: "classic",
			theme: "dark",
			sidebarCollapsed: false,

			setMode: (mode) => set({ mode }),
			setTheme: (theme) => set({ theme }),
			toggleSidebar: () =>
				set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
		}),
		{
			name: "openportal-ui",
		},
	),
);
