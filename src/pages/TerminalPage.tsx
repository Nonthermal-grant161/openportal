import { PageHeader } from "@/components/ui/primitives";
import { execShell } from "@/lib/adb/shell";
import { useDeviceStore } from "@/store/device-store";
import { ChevronRight, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

interface TerminalEntry {
	id: number;
	command: string;
	output: string;
	exitCode: number;
	error?: boolean;
}

let entryId = 0;

export function TerminalPage() {
	const { t } = useTranslation("tools");
	const adb = useDeviceStore((s) => s.adb);
	const [input, setInput] = useState("");
	const [entries, setEntries] = useState<TerminalEntry[]>([]);
	const [busy, setBusy] = useState(false);
	const [history, setHistory] = useState<string[]>([]);
	const [historyIndex, setHistoryIndex] = useState(-1);

	const scrollRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	// biome-ignore lint/correctness/useExhaustiveDependencies: scroll to bottom whenever output changes
	useEffect(() => {
		if (scrollRef.current) {
			scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
		}
	}, [entries, busy]);

	const run = async () => {
		const command = input.trim();
		if (!command || busy || !adb) return;

		setHistory((prev) => [...prev, command]);
		setHistoryIndex(-1);
		setInput("");

		if (command === "clear") {
			setEntries([]);
			return;
		}
		if (command === "help") {
			setEntries((prev) => [
				...prev,
				{ id: ++entryId, command, output: t("terminal.help"), exitCode: 0 },
			]);
			return;
		}

		setBusy(true);
		try {
			const result = await execShell(adb, command);
			setEntries((prev) => [
				...prev,
				{
					id: ++entryId,
					command,
					output: result.stdout,
					exitCode: result.exitCode,
				},
			]);
		} catch (err) {
			setEntries((prev) => [
				...prev,
				{
					id: ++entryId,
					command,
					output: err instanceof Error ? err.message : String(err),
					exitCode: -1,
					error: true,
				},
			]);
		} finally {
			setBusy(false);
			inputRef.current?.focus();
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			e.preventDefault();
			run();
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			if (history.length === 0) return;
			const next =
				historyIndex === -1
					? history.length - 1
					: Math.max(0, historyIndex - 1);
			setHistoryIndex(next);
			setInput(history[next] ?? "");
		} else if (e.key === "ArrowDown") {
			e.preventDefault();
			if (historyIndex === -1) return;
			const next = historyIndex + 1;
			if (next >= history.length) {
				setHistoryIndex(-1);
				setInput("");
			} else {
				setHistoryIndex(next);
				setInput(history[next] ?? "");
			}
		}
	};

	return (
		<div className="mx-auto flex h-full max-w-4xl flex-col space-y-4">
			<PageHeader
				title={t("terminal.title")}
				description={t("terminal.description")}
			/>

			<div
				className="flex min-h-0 flex-1 cursor-text flex-col rounded-xl border border-border bg-black/50 font-mono text-xs"
				onClick={() => inputRef.current?.focus()}
				onKeyDown={() => {}}
				role="presentation"
			>
				<div ref={scrollRef} className="min-h-0 flex-1 overflow-auto p-4">
					<p className="text-muted-foreground">{t("terminal.welcome")}</p>
					{entries.map((entry) => (
						<div key={entry.id} className="mt-2">
							<div className="flex items-center gap-1 text-emerald-400">
								<ChevronRight className="h-3 w-3" />
								<span>{entry.command}</span>
							</div>
							{entry.output && (
								<pre
									className={`mt-0.5 whitespace-pre-wrap break-all ${
										entry.error ? "text-red-400" : "text-foreground/90"
									}`}
								>
									{entry.output}
								</pre>
							)}
							{entry.exitCode > 0 && (
								<p className="text-amber-400">
									{t("terminal.exitCode", { code: entry.exitCode })}
								</p>
							)}
						</div>
					))}
					{busy && (
						<div className="mt-2 flex items-center gap-2 text-muted-foreground">
							<Loader2 className="h-3 w-3 animate-spin" />
							{t("terminal.running")}
						</div>
					)}
				</div>

				<div className="flex items-center gap-2 border-t border-border px-4 py-3">
					<ChevronRight className="h-4 w-4 shrink-0 text-emerald-400" />
					<input
						ref={inputRef}
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder={t("terminal.placeholder")}
						spellCheck={false}
						autoCapitalize="off"
						autoComplete="off"
						className="flex-1 bg-transparent font-mono text-xs outline-none placeholder:text-muted-foreground"
					/>
				</div>
			</div>
		</div>
	);
}
