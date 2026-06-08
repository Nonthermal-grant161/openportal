import { useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router";
import { AppShell } from "@/components/layout/AppShell";
import { ConnectScreen } from "@/components/connection/ConnectScreen";
import { MOCK_DEVICE_INFO } from "@/lib/adb/mock";
import { resolveModel } from "@/lib/portal/models";
import { DashboardPage } from "@/pages/DashboardPage";
import { AppsPage } from "@/pages/AppsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { useDeviceStore } from "@/store/device-store";
import { useTheme } from "@/hooks/use-theme";

function useDemoMode() {
	const isDemo = new URLSearchParams(window.location.search).has("demo");
	useEffect(() => {
		if (isDemo) {
			useDeviceStore.setState({
				state: "connected",
				deviceInfo: MOCK_DEVICE_INFO,
				portalModel: resolveModel(MOCK_DEVICE_INFO.codename),
			});
		}
	}, [isDemo]);
	return isDemo;
}

export default function App() {
	const state = useDeviceStore((s) => s.state);
	useTheme();
	useDemoMode();

	if (state !== "connected") {
		return <ConnectScreen />;
	}

	return (
		<BrowserRouter>
			<Routes>
				<Route element={<AppShell />}>
					<Route index element={<DashboardPage />} />
					<Route path="apps" element={<AppsPage />} />
					<Route path="settings" element={<SettingsPage />} />
				</Route>
			</Routes>
		</BrowserRouter>
	);
}
