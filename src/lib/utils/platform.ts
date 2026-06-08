export function isWebUsbSupported(): boolean {
	return "usb" in navigator;
}

export function isSecureContext(): boolean {
	return globalThis.isSecureContext;
}

export function isChromiumBrowser(): boolean {
	const ua = navigator.userAgent;
	return (
		/Chrome|Chromium|Edg|Brave|OPR|Vivaldi/i.test(ua) && !/Firefox/i.test(ua)
	);
}

export function getPlatformSupport(): {
	webusb: boolean;
	secure: boolean;
	chromium: boolean;
	supported: boolean;
} {
	const webusb = isWebUsbSupported();
	const secure = isSecureContext();
	const chromium = isChromiumBrowser();
	return {
		webusb,
		secure,
		chromium,
		supported: webusb && secure && chromium,
	};
}
