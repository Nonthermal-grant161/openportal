import { useAppStore } from "@/store/app-store";
import { useDeviceStore } from "@/store/device-store";
import { useEffect, useState } from "react";
import { Outlet } from "react-router";
import { Header } from "./Header";
import { KeyboardShortcuts } from "./KeyboardShortcuts";
import { Sidebar } from "./Sidebar";

export function AppShell() {
	const [mobileOpen, setMobileOpen] = useState(false);
	const connected = useDeviceStore((s) => s.state === "connected");
	const refreshInstalled = useAppStore((s) => s.refreshInstalled);
	const checkUpdates = useAppStore((s) => s.checkUpdates);
	const refreshDefaultLauncher = useAppStore((s) => s.refreshDefaultLauncher);

	useEffect(() => {
		if (!connected) return;
		refreshInstalled().then(() => {
			checkUpdates();
			refreshDefaultLauncher();
		});
	}, [connected, refreshInstalled, checkUpdates, refreshDefaultLauncher]);

	return (
		<div className="flex h-screen">
			<Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
			<div className="flex min-w-0 flex-1 flex-col overflow-hidden">
				<Header onMenuClick={() => setMobileOpen(true)} />
				<main className="flex-1 overflow-y-auto p-4 md:p-6">
					<Outlet />
				</main>
			</div>
			<KeyboardShortcuts />
		</div>
	);
}
