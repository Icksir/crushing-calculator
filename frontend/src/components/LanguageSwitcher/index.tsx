'use client';
import React from 'react';
import { useLanguage, Language } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const flags: Record<string, string> = {
  es: '🇪🇸',
  en: '🇬🇧',
  fr: '🇫🇷',
  pt: '🇧🇷',
};

export const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();

  const handleLanguageChange = (newLang: Language) => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    const segments = url.pathname.split('/');
    // segments[0] is empty string because path starts with /
    // segments[1] is the locale
    segments[1] = newLang;
    url.pathname = segments.join('/');
    window.history.pushState({}, '', `${url.pathname}${url.search}${url.hash}`);
    document.documentElement.lang = newLang;
    setLanguage(newLang);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <span className="text-2xl">{flags[language]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => handleLanguageChange('es')}>
          <span className="mr-2 text-lg">{flags.es}</span> Español
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleLanguageChange('en')}>
          <span className="mr-2 text-lg">{flags.en}</span> English
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleLanguageChange('fr')}>
          <span className="mr-2 text-lg">{flags.fr}</span> Français
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleLanguageChange('pt')}>
          <span className="mr-2 text-lg">{flags.pt}</span> Português
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
