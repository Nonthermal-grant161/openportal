import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import appsEn from "@/locales/en/apps.json";
import commonEn from "@/locales/en/common.json";
import dashboardEn from "@/locales/en/dashboard.json";
import toolsEn from "@/locales/en/tools.json";

import appsFr from "@/locales/fr/apps.json";
import commonFr from "@/locales/fr/common.json";
import dashboardFr from "@/locales/fr/dashboard.json";
import toolsFr from "@/locales/fr/tools.json";

i18n
	.use(LanguageDetector)
	.use(initReactI18next)
	.init({
		resources: {
			en: {
				common: commonEn,
				dashboard: dashboardEn,
				apps: appsEn,
				tools: toolsEn,
			},
			fr: {
				common: commonFr,
				dashboard: dashboardFr,
				apps: appsFr,
				tools: toolsFr,
			},
		},
		fallbackLng: "en",
		defaultNS: "common",
		interpolation: {
			escapeValue: false,
		},
	});

export default i18n;
