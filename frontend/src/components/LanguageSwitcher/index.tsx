'use client';
import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import { usePathname, useRouter } from 'next/navigation';
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
  const { language } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();

  const handleLanguageChange = (newLang: string) => {
    if (!pathname) return;
    const segments = pathname.split('/');
    // segments[0] is empty string because path starts with /
    // segments[1] is the locale
    segments[1] = newLang;
    const newPath = segments.join('/');
    router.push(newPath);
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
