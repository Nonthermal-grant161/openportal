import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./i18n";
import "./index.css";

const root = document.getElementById("root");
if (root) {
	createRoot(root).render(
		<StrictMode>
			<App />
		</StrictMode>,
	);
}

// Register the service worker for offline support (production builds only).
if (import.meta.env.PROD && "serviceWorker" in navigator) {
	window.addEventListener("load", () => {
		navigator.serviceWorker
			.register(`${import.meta.env.BASE_URL}sw.js`)
			.catch(() => {
				// Offline support is best-effort; ignore registration failures.
			});
	});
}
