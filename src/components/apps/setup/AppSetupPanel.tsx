import { Modal, Spinner } from "@/components/ui/primitives";
import type { CatalogApp } from "@/lib/portal/catalog";
import { Suspense } from "react";
import { SETUP_PANELS } from "./registry";

/**
 * Hosts the custom setup panel for an app inside a modal. Looks the panel up by
 * its `setup.id` and lazy-loads it; renders nothing when the app has no custom
 * setup or no panel is registered for its id.
 */
export function AppSetupPanel({
	app,
	open,
	onClose,
}: {
	app: CatalogApp;
	open: boolean;
	onClose: () => void;
}) {
	const id = app.setup?.kind === "custom" ? app.setup.id : undefined;
	const Panel = id ? SETUP_PANELS[id] : undefined;

	return (
		<Modal open={open && !!Panel} onClose={onClose} title={app.name}>
			{Panel && (
				<Suspense
					fallback={
						<div className="flex justify-center py-6">
							<Spinner />
						</div>
					}
				>
					<Panel app={app} onClose={onClose} />
				</Suspense>
			)}
		</Modal>
	);
}
