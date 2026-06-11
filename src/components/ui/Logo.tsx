import { cn } from "@/lib/utils";
import { useId } from "react";

export function LogoMark({ className }: { className?: string }) {
	const id = useId();
	return (
		<svg
			viewBox="0 0 32 32"
			className={cn("shrink-0", className)}
			aria-hidden="true"
		>
			<defs>
				<linearGradient id={id} x1="0" y1="1" x2="1" y2="0">
					<stop offset="0" stopColor="#7c3aed" />
					<stop offset="1" stopColor="#a78bfa" />
				</linearGradient>
			</defs>
			<path
				d="M 27.5 13.5 L 27.5 20.5 A 7 7 0 0 1 20.5 27.5 L 11.5 27.5 A 7 7 0 0 1 4.5 20.5 L 4.5 11.5 A 7 7 0 0 1 11.5 4.5 L 18.5 4.5"
				fill="none"
				stroke={`url(#${id})`}
				strokeWidth="4.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<circle cx="25.45" cy="6.55" r="2.1" fill="#a78bfa" />
		</svg>
	);
}

export function LogoWordmark({ className }: { className?: string }) {
	return (
		<span className={cn("tracking-tight", className)}>
			Open
			<span className="text-violet-600 dark:text-violet-400">Portal</span>
		</span>
	);
}
