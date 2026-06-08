import { ConnectionStatus } from "@/components/connection/ConnectionStatus";
import { ModeToggle } from "./ModeToggle";

export function Header() {
	return (
		<header className="flex h-14 items-center justify-between border-b border-border px-6">
			<ConnectionStatus />
			<ModeToggle />
		</header>
	);
}
