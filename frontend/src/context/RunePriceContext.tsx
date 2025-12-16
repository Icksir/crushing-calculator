'use client';
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { getRunePrices, updateRunePrices, RunePriceData } from '@/lib/api';

interface RunePriceContextType {
  runePrices: Record<string, RunePriceData>;
  updatePrice: (stat: string, price: number) => void;
  refreshPrices: () => Promise<void>;
}

const RunePriceContext = createContext<RunePriceContextType | undefined>(undefined);

export const RunePriceProvider = ({ children }: { children: React.ReactNode }) => {
  const [runePrices, setRunePrices] = useState<Record<string, RunePriceData>>({});
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchPrices = async () => {
    try {
      const prices = await getRunePrices();
      setRunePrices(prices);
    } catch (e) {
      console.error("Failed to fetch rune prices", e);
    }
  };

  useEffect(() => {
    fetchPrices();
  }, []);

  const updatePrice = (stat: string, price: number) => {
    const currentData = runePrices[stat] || { price: 0 };
    const newPrices = { ...runePrices, [stat]: { ...currentData, price } };
    setRunePrices(newPrices);
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(() => {
      // Extract just the prices for the API
      const pricesOnly: Record<string, number> = {};
      Object.entries(newPrices).forEach(([key, val]) => {
        pricesOnly[key] = val.price;
      });
      updateRunePrices(pricesOnly).catch(e => console.error("Failed to save prices", e));
    }, 1000);
  };

  return (
    <RunePriceContext.Provider value={{ runePrices, updatePrice, refreshPrices: fetchPrices }}>
      {children}
    </RunePriceContext.Provider>
  );
};

export const useRunePrices = () => {
  const context = useContext(RunePriceContext);
  if (!context) throw new Error('useRunePrices must be used within a RunePriceProvider');
  return context;
};
