import { useUIStore } from "@/store/ui-store";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";

// `g` then one of these jumps to the matching route.
export const NAV_SHORTCUTS: Record<string, string> = {
	d: "/",
	a: "/apps",
	f: "/files",
	p: "/screen",
	t: "/terminal",
	l: "/logcat",
	x: "/flags",
};

function isTypingTarget(target: EventTarget | null): boolean {
	if (!(target instanceof HTMLElement)) return false;
	const tag = target.tagName;
	return (
		tag === "INPUT" ||
		tag === "TEXTAREA" ||
		tag === "SELECT" ||
		target.isContentEditable
	);
}

/**
 * Global keyboard shortcuts:
 *  - `?`      toggle the help overlay
 *  - `g` then d/a/f/p/t/l/x  navigate
 *  - `m`      toggle Classic/Advanced mode
 */
export function useKeyboardShortcuts() {
	const navigate = useNavigate();
	const [helpOpen, setHelpOpen] = useState(false);
	const pendingG = useRef(false);
	const gTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.metaKey || e.ctrlKey || e.altKey) return;
			if (isTypingTarget(e.target)) return;

			if (e.key === "Escape") {
				setHelpOpen(false);
				pendingG.current = false;
				return;
			}

			if (e.key === "?") {
				e.preventDefault();
				setHelpOpen((v) => !v);
				return;
			}

			if (pendingG.current) {
				pendingG.current = false;
				if (gTimer.current) clearTimeout(gTimer.current);
				const route = NAV_SHORTCUTS[e.key.toLowerCase()];
				if (route) {
					e.preventDefault();
					navigate(route);
				}
				return;
			}

			if (e.key === "g") {
				pendingG.current = true;
				if (gTimer.current) clearTimeout(gTimer.current);
				gTimer.current = setTimeout(() => {
					pendingG.current = false;
				}, 800);
				return;
			}

			if (e.key === "m") {
				const { mode, setMode } = useUIStore.getState();
				setMode(mode === "advanced" ? "classic" : "advanced");
			}
		};

		window.addEventListener("keydown", handler);
		return () => {
			window.removeEventListener("keydown", handler);
			if (gTimer.current) clearTimeout(gTimer.current);
		};
	}, [navigate]);

	return { helpOpen, setHelpOpen };
}
