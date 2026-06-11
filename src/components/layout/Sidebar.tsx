import { ConfirmDialog } from "@/components/ui/primitives";
import { useDeviceStore } from "@/store/device-store";
import { useUIStore } from "@/store/ui-store";
import {
	FileText,
	FolderOpen,
	Github,
	LayoutDashboard,
	LogOut,
	MonitorSmartphone,
	Package,
	SlidersHorizontal,
	Terminal,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router";

const NAV_ITEMS = [
	{
		to: "/",
		icon: LayoutDashboard,
		labelKey: "dashboard",
		mode: "all" as const,
	},
	{ to: "/apps", icon: Package, labelKey: "apps", mode: "all" as const },
	{
		to: "/screen",
		icon: MonitorSmartphone,
		labelKey: "screen",
		mode: "all" as const,
	},
	{
		to: "/files",
		icon: FolderOpen,
		labelKey: "files",
		mode: "advanced" as const,
	},
	{
		to: "/terminal",
		icon: Terminal,
		labelKey: "terminal",
		mode: "advanced" as const,
	},
	{
		to: "/logcat",
		icon: FileText,
		labelKey: "logcat",
		mode: "advanced" as const,
	},
	{
		to: "/flags",
		icon: SlidersHorizontal,
		labelKey: "flags",
		mode: "advanced" as const,
	},
];

export function Sidebar({
	mobileOpen,
	onClose,
}: {
	mobileOpen: boolean;
	onClose: () => void;
}) {
	const { t } = useTranslation();
	const { mode } = useUIStore();
	const state = useDeviceStore((s) => s.state);
	const disconnect = useDeviceStore((s) => s.disconnect);
	const [confirmDisconnect, setConfirmDisconnect] = useState(false);
	const connected = state === "connected";

	const visibleItems = NAV_ITEMS.filter(
		(item) => item.mode === "all" || mode === "advanced",
	);

	return (
		<>
			{/* Mobile backdrop */}
			{mobileOpen && (
				<button
					type="button"
					aria-label="Close menu"
					onClick={onClose}
					className="fixed inset-0 z-30 bg-black/50 md:hidden"
				/>
			)}

			<aside
				className={`fixed inset-y-0 left-0 z-40 flex h-full w-56 shrink-0 flex-col border-r border-border bg-card transition-transform md:static md:translate-x-0 ${
					mobileOpen ? "translate-x-0" : "-translate-x-full"
				}`}
			>
				<div className="flex items-center px-4 py-5">
					<span className="text-base font-semibold">{t("appName")}</span>
				</div>

				<nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
					{visibleItems.map((item) => (
						<NavLink
							key={item.to}
							to={item.to}
							end={item.to === "/"}
							onClick={onClose}
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
					<a
						href="https://github.com/andronedev/openportal"
						target="_blank"
						rel="noreferrer"
						className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
					>
						<Github className="h-4 w-4" />
						{t("sourceCode")}
					</a>
					{connected && (
						<button
							type="button"
							onClick={() => setConfirmDisconnect(true)}
							className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
						>
							<LogOut className="h-4 w-4" />
							{t("disconnect")}
						</button>
					)}
				</div>
			</aside>

			{connected && (
				<ConfirmDialog
					open={confirmDisconnect}
					onClose={() => setConfirmDisconnect(false)}
					onConfirm={disconnect}
					title={t("disconnectConfirmTitle")}
					message={t("disconnectConfirmMessage")}
					confirmLabel={t("disconnect")}
					danger
				/>
			)}
		</>
	);
}
