'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations } from "@/constants/translations"; // Ajusta la ruta

export type Language = 'es' | 'en' | 'fr' | 'pt';

interface LanguageContextType {
  language: Language;
  isInitialized: boolean;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children, initialLanguage = 'es' }: { children: ReactNode, initialLanguage?: Language }) => {
  const [language, setLanguageState] = useState<Language>(initialLanguage);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Sincronizar el estado cuando initialLanguage cambia (cuando se navega a una ruta diferente)
    setLanguageState(initialLanguage);
    localStorage.setItem('language', initialLanguage);
    setIsInitialized(true); 
  }, [initialLanguage]);

  const handleSetLanguage = (lang: Language) => {
    localStorage.setItem('language', lang);
    setLanguageState(lang);
  };

  const t = (key: string) => {
    return translations[language]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, isInitialized, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
