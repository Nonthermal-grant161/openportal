import {
	LayoutDashboard,
	Package,
	Settings,
	FolderOpen,
	Terminal,
	LogOut,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router";
import { useDeviceStore } from "@/store/device-store";
import { useUIStore } from "@/store/ui-store";

const NAV_ITEMS = [
	{ to: "/", icon: LayoutDashboard, labelKey: "dashboard", mode: "all" as const },
	{ to: "/apps", icon: Package, labelKey: "apps", mode: "all" as const },
	{ to: "/settings", icon: Settings, labelKey: "settings", mode: "all" as const },
	{ to: "/files", icon: FolderOpen, labelKey: "files", mode: "advanced" as const },
	{ to: "/terminal", icon: Terminal, labelKey: "terminal", mode: "advanced" as const },
];

export function Sidebar() {
	const { t } = useTranslation();
	const { mode } = useUIStore();
	const disconnect = useDeviceStore((s) => s.disconnect);

	const visibleItems = NAV_ITEMS.filter(
		(item) => item.mode === "all" || mode === "advanced",
	);

	return (
		<aside className="flex h-full w-56 shrink-0 flex-col border-r border-border bg-card">
			<div className="flex items-center gap-2 px-4 py-5">
				<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background text-sm font-bold">
					OP
				</div>
				<span className="text-sm font-semibold">{t("appName")}</span>
			</div>

			<nav className="flex-1 space-y-1 px-3 py-2">
				{visibleItems.map((item) => (
					<NavLink
						key={item.to}
						to={item.to}
						end={item.to === "/"}
						className={({ isActive }) =>
							`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
								isActive
									? "bg-accent text-accent-foreground font-medium"
									: "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
							}`
						}
					>
						<item.icon className="h-4 w-4" />
						{t(item.labelKey)}
					</NavLink>
				))}
			</nav>

			<div className="border-t border-border p-3">
				<button
					type="button"
					onClick={disconnect}
					className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
				>
					<LogOut className="h-4 w-4" />
					{t("disconnect")}
				</button>
			</div>
		</aside>
	);
}
