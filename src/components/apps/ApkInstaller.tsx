import { FileUp, Loader2 } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppStore } from "@/store/app-store";

export function ApkInstaller() {
	const { t } = useTranslation("apps");
	const installFile = useAppStore((s) => s.installFile);
	const installTasks = useAppStore((s) => s.installTasks);
	const [dragOver, setDragOver] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	const handleFile = useCallback(
		async (file: File) => {
			if (!file.name.endsWith(".apk")) return;
			try {
				await installFile(file);
			} catch {
				// error is in the task state
			}
		},
		[installFile],
	);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			setDragOver(false);
			const file = e.dataTransfer.files[0];
			if (file) handleFile(file);
		},
		[handleFile],
	);

	const handleChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (file) handleFile(file);
		},
		[handleFile],
	);

	const activeTask = installTasks.find(
		(t) => t.status !== "done" && t.status !== "error",
	);

	return (
		<div className="space-y-3">
			<div
				onDragOver={(e) => {
					e.preventDefault();
					setDragOver(true);
				}}
				onDragLeave={() => setDragOver(false)}
				onDrop={handleDrop}
				onClick={() => inputRef.current?.click()}
				onKeyDown={(e) => {
					if (e.key === "Enter") inputRef.current?.click();
				}}
				className={`flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
					dragOver
						? "border-foreground/50 bg-accent/50"
						: "border-border hover:border-foreground/30 hover:bg-accent/30"
				}`}
			>
				{activeTask ? (
					<>
						<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
						<div>
							<p className="text-sm font-medium">{activeTask.fileName}</p>
							<p className="text-xs text-muted-foreground">
								{activeTask.status} — {activeTask.progress}%
							</p>
						</div>
						<div className="h-1.5 w-48 overflow-hidden rounded-full bg-secondary">
							<div
								className="h-full rounded-full bg-foreground transition-all"
								style={{ width: `${activeTask.progress}%` }}
							/>
						</div>
					</>
				) : (
					<>
						<FileUp className="h-8 w-8 text-muted-foreground" />
						<div>
							<p className="text-sm text-muted-foreground">
								{t("dragDropApk")}
							</p>
						</div>
					</>
				)}

				<input
					ref={inputRef}
					type="file"
					accept=".apk"
					className="hidden"
					onChange={handleChange}
				/>
			</div>

			{installTasks
				.filter((t) => t.status === "error")
				.map((task) => (
					<div
						key={task.id}
						className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400"
					>
						{task.fileName}: {task.error}
					</div>
				))}
		</div>
	);
}
