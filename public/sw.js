// Minimal runtime-caching service worker for OpenPortal.
// Strategy: network-first, falling back to cache so the app shell works offline
// after the first visit. Hashed Vite assets are cached on demand.
const CACHE = "openportal-v1";

self.addEventListener("install", () => {
	self.skipWaiting();
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		(async () => {
			const keys = await caches.keys();
			await Promise.all(
				keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)),
			);
			await self.clients.claim();
		})(),
	);
});

self.addEventListener("fetch", (event) => {
	const request = event.request;
	if (request.method !== "GET") return;

	const url = new URL(request.url);
	if (url.origin !== self.location.origin) return;

	event.respondWith(
		(async () => {
			const cache = await caches.open(CACHE);
			try {
				const fresh = await fetch(request);
				if (fresh && fresh.status === 200) {
					cache.put(request, fresh.clone());
				}
				return fresh;
			} catch (err) {
				const cached = await cache.match(request);
				if (cached) return cached;
				if (request.mode === "navigate") {
					const index =
						(await cache.match("./index.html")) ||
						(await cache.match("index.html")) ||
						(await cache.match("./"));
					if (index) return index;
				}
				throw err;
			}
		})(),
	);
});
