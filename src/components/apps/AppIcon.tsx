import { cn } from "@/lib/utils";
import { useState } from "react";

// Deterministic palette so the same app always gets the same colour.
const PALETTE = [
	"bg-rose-500/15 text-rose-500",
	"bg-orange-500/15 text-orange-500",
	"bg-amber-500/15 text-amber-600",
	"bg-emerald-500/15 text-emerald-500",
	"bg-teal-500/15 text-teal-500",
	"bg-sky-500/15 text-sky-500",
	"bg-indigo-500/15 text-indigo-500",
	"bg-violet-500/15 text-violet-500",
	"bg-fuchsia-500/15 text-fuchsia-500",
];
const DEFAULT_PALETTE = "bg-secondary text-foreground";

function hashString(value: string): number {
	let hash = 0;
	for (let i = 0; i < value.length; i++) {
		hash = (hash << 5) - hash + value.charCodeAt(i);
		hash |= 0;
	}
	return Math.abs(hash);
}

function initials(name: string): string {
	const words = name.trim().split(/\s+/).filter(Boolean);
	const first = words[0] ?? "";
	if (!first) return "?";
	if (words.length === 1) return first.slice(0, 2).toUpperCase();
	const second = words[1] ?? "";
	return (first.charAt(0) + second.charAt(0)).toUpperCase();
}

export function AppIcon({
	name,
	iconUrl,
	className,
}: {
	name: string;
	iconUrl?: string;
	className?: string;
}) {
	const [failed, setFailed] = useState(false);
	const palette = PALETTE[hashString(name) % PALETTE.length] ?? DEFAULT_PALETTE;

	if (iconUrl && !failed) {
		return (
			<img
				src={iconUrl}
				alt={name}
				onError={() => setFailed(true)}
				className={cn("object-cover", className)}
			/>
		);
	}

	return (
		<div
			className={cn(
				"flex items-center justify-center text-sm font-semibold",
				palette,
				className,
			)}
			aria-hidden="true"
		>
			{initials(name)}
		</div>
	);
}
