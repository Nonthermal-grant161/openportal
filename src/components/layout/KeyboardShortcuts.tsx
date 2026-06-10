import { Modal } from "@/components/ui/primitives";
import {
	NAV_SHORTCUTS,
	useKeyboardShortcuts,
} from "@/hooks/use-keyboard-shortcuts";
import { useTranslation } from "react-i18next";

const NAV_LABEL_KEYS: Record<string, string> = {
	d: "dashboard",
	a: "apps",
	f: "files",
	p: "screen",
	t: "terminal",
	l: "logcat",
	x: "flags",
};

function Keys({ keys }: { keys: string[] }) {
	return (
		<span className="flex items-center gap-1">
			{keys.map((k, i) => (
				<kbd
					// biome-ignore lint/suspicious/noArrayIndexKey: static fixed-order list
					key={i}
					className="rounded border border-border bg-secondary px-1.5 py-0.5 font-mono text-xs"
				>
					{k}
				</kbd>
			))}
		</span>
	);
}

function Row({ keys, label }: { keys: string[]; label: string }) {
	return (
		<div className="flex items-center justify-between gap-4">
			<span className="text-muted-foreground">{label}</span>
			<Keys keys={keys} />
		</div>
	);
}

export function KeyboardShortcuts() {
	const { t } = useTranslation();
	const { helpOpen, setHelpOpen } = useKeyboardShortcuts();

	return (
		<Modal
			open={helpOpen}
			onClose={() => setHelpOpen(false)}
			title={t("keyboardShortcuts")}
		>
			<div className="space-y-2 text-sm">
				<Row keys={["?"]} label={t("shortcutHelp")} />
				<Row keys={["m"]} label={t("shortcutToggleMode")} />
				<div className="mt-3 space-y-2 border-t border-border pt-3">
					{Object.entries(NAV_SHORTCUTS).map(([key]) => (
						<Row
							key={key}
							keys={["g", key]}
							label={t(NAV_LABEL_KEYS[key] ?? key)}
						/>
					))}
				</div>
			</div>
		</Modal>
	);
}
