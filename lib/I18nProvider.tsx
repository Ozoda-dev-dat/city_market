import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { translations, LANG_DEFAULT } from "./i18n";

export type Lang = "uz" | "ru";

const LANG_STORAGE_KEY = "app_language";

interface I18nContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(LANG_DEFAULT);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(LANG_STORAGE_KEY);
        if (stored === "uz" || stored === "ru") {
          setLangState(stored);
        }
      } catch {
        /* non-fatal: fall back to default language */
      }
    })();
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    AsyncStorage.setItem(LANG_STORAGE_KEY, l).catch(() => {});
  };

  const t = (key: string) => {
    return translations[lang][key] || key;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useTranslation must be used within I18nProvider");
  return ctx;
}
