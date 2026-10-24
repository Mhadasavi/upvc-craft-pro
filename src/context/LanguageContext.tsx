import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  AppLanguage,
  getInitialLanguage,
  applyLanguage,
  toggleLanguage as toggleLangUtil,
  translate,
} from '../utils/language';

interface LanguageContextType {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLangState] = useState<AppLanguage>(getInitialLanguage);

  useEffect(() => {
    applyLanguage(language);
  }, [language]);

  const setLanguage = (lang: AppLanguage) => {
    setLangState(lang);
    applyLanguage(lang);
  };

  const toggleLanguage = () => {
    setLangState((prev) => {
      const next = toggleLangUtil(prev);
      return next;
    });
  };

  const t = (key: string): string => {
    return translate(key, language);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fallback if rendered outside provider so it never crashes
    return {
      language: 'en',
      setLanguage: () => {},
      toggleLanguage: () => {},
      t: (key: string) => translate(key, 'en'),
    };
  }
  return context;
}
