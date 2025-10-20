import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Import translations
import bh from "./locales/bh-IN/translations.json";
import en from "./locales/en-US/translations.json";
import hi from "./locales/hi-IN/translations.json";

const resources = {
  "en-US": { translation: en },
  "hi-IN": { translation: hi },
  "bh-IN": { translation: bh },
};

// AsyncStorage key to save user language
const LANGUAGE_KEY = "APP_LANGUAGE";
const getDeviceLanguage = () => {
  const locales = Localization.getLocales();
  return locales && locales.length > 0 ? locales[0].languageTag : "en-US";
};

const getStoredLanguage = async () => {
  const storedLang = await AsyncStorage.getItem(LANGUAGE_KEY);
  return storedLang || getDeviceLanguage();
};

i18n.use(initReactI18next).init({
  resources,
  lng: "en-US", // default language
  fallbackLng: "en-US",
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

// Change language dynamically
export const setAppLanguage = async (lng: string) => {
  await AsyncStorage.setItem(LANGUAGE_KEY, lng);
  i18n.changeLanguage(lng);
};

// Load stored language on app start
getStoredLanguage().then((lng) => i18n.changeLanguage(lng));

export default i18n;
