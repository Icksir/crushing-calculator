'use client';
import { useState, useEffect, useCallback } from 'react';
import { StatCatalogEntry, getStatCatalog } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';

export function useStatCatalog() {
  const { language } = useLanguage();
  const [statCatalog, setStatCatalog] = useState<StatCatalogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const getLabel = useCallback(
    (canonical: string) => {
      const entry = statCatalog.find((e) => e.canonical === canonical);
      return entry?.label || canonical;
    },
    [statCatalog]
  );

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    getStatCatalog(language)
      .then((data) => {
        if (!cancelled) setStatCatalog(data);
      })
      .catch((err) => {
        console.error('Failed to load stat catalog', err);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [language]);

  return { statCatalog, isLoading, getLabel };
}
