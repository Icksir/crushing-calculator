'use client';
import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { getRunePrices, updateRunePrices, RunePriceData } from '@/lib/api';
import { useLanguage } from './LanguageContext';

interface RunePriceContextType {
  runePrices: Record<string, RunePriceData>;
  isLoading: boolean;
  updatePrice: (stat: string, price: number) => void;
  refreshPrices: () => Promise<void>;
  server: string;
  setServer: (server: string) => void;
}

const RunePriceContext = createContext<RunePriceContextType | undefined>(undefined);

export const RunePriceProvider = ({ children }: { children: React.ReactNode }) => {
  const { language, isInitialized } = useLanguage();
  const [runePrices, setRunePrices] = useState<Record<string, RunePriceData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [server, setServerState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('selectedServer') || 'Dakal';
    }
    return 'Dakal';
  });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const setServer = (newServer: string) => {
    setServerState(newServer);
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedServer', newServer);
    }
  };

  const fetchPrices = async (lang: string, srv: string) => {
    setIsLoading(true);
    try {
      const prices = await getRunePrices(lang, srv);
      setRunePrices(prices);
    } catch (e) {
      console.error("Failed to fetch rune prices", e);
      setRunePrices({}); // Clear on error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isInitialized) {
      fetchPrices(language, server);
    }
  }, [language, isInitialized, server]);

  const updatePrice = (stat: string, price: number) => {
    // Do not allow updates while loading to prevent race conditions
    if (isLoading) return; 

    const currentData = runePrices[stat] || { price: 0 };
    const newPrices = { ...runePrices, [stat]: { ...currentData, price } };
    setRunePrices(newPrices);
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(() => {
      const pricesOnly: Record<string, number> = {};
      Object.entries(newPrices).forEach(([key, val]) => {
        pricesOnly[key] = val.price;
      });
      updateRunePrices(pricesOnly, language, server).catch(e => console.error("Failed to save prices", e));
    }, 1000);
  };

  return (
    <RunePriceContext.Provider value={{ 
      runePrices, 
      isLoading, 
      updatePrice, 
      refreshPrices: () => fetchPrices(language, server),
      server,
      setServer
    }}>
      {children}
    </RunePriceContext.Provider>
  );
};

export const useRunePrices = () => {
  const context = useContext(RunePriceContext);
  if (!context) throw new Error('useRunePrices must be used within a RunePriceProvider');
  return context;
};
