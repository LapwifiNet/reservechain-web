import { I18n } from "i18n-js";
import { getLocales } from "expo-localization";
import en from "./en.json";
import es from "./es.json";
import it from "./it.json";

export const SUPPORTED = ["en", "es", "it"] as const;
export type Locale = (typeof SUPPORTED)[number];

export const i18n = new I18n({ en, es, it });
i18n.enableFallback = true;
i18n.defaultLocale = "en";

function detectLocale(): Locale {
  const tag = getLocales()[0]?.languageCode ?? "en";
  return (SUPPORTED as readonly string[]).includes(tag)
    ? (tag as Locale)
    : "en";
}

i18n.locale = detectLocale();

export function setLocale(locale: Locale) {
  i18n.locale = locale;
}

export function t(key: string, options?: Record<string, unknown>) {
  return i18n.t(key, options);
}
