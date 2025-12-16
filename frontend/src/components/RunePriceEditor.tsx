'use client';
import React, { useState, useEffect } from 'react';
import { useRunePrices } from '@/context/RunePriceContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Coins, Image as ImageIcon } from 'lucide-react';
import { syncRuneImages } from '@/lib/api';

const COMMON_RUNES = [
  "Runa Agi",
  "Runa Al",
  "Runa Cri",
  "Runa Cu",
  "Runa Da",
  "Runa Da Agua",
  "Runa Da Aire",
  "Runa Da Cri",
  "Runa Da Emp",
  "Runa Da Fuego",
  "Runa Da Neutral",
  "Runa Da Por Ar",
  "Runa Da Por CC",
  "Runa Da Por Di",
  "Runa Da Por He",
  "Runa Da Reen",
  "Runa Da Tierra",
  "Runa Da Tram",
  "Runa Fu",
  "Runa Ga PA",
  "Runa Ga PM",
  "Runa Hui",
  "Runa Ini",
  "Runa Inte",
  "Runa Invo",
  "Runa Pla",
  "Runa Pod",
  "Runa Por Tram",
  "Runa Pot",
  "Runa Prospe",
  "Runa Re Agua",
  "Runa Re Agua Por",
  "Runa Re Aire",
  "Runa Re Aire Por",
  "Runa Re Cri",
  "Runa Re Emp",
  "Runa Re Fuego",
  "Runa Re Fuego Por",
  "Runa Re Neutral",
  "Runa Re Neutral Por",
  "Runa Re PA",
  "Runa Re PM",
  "Runa Re Por CC",
  "Runa Re Por Di",
  "Runa Re Tierra",
  "Runa Re Tierra Por",
  "Runa Ret PA",
  "Runa Ret PM",
  "Runa Sa",
  "Runa Sue",
  "Runa Vi",
  "Runa de caza"
];

export const RunePriceEditor = () => {
  const { runePrices, updatePrice, refreshPrices } = useRunePrices();

  useEffect(() => {
    const sync = async () => {
      try {
        await syncRuneImages();
        await refreshPrices();
      } catch (e) {
        console.error("Auto-sync failed", e);
      }
    };
    sync();
  }, []); // Run once on mount

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Coins className="w-5 h-5 text-yellow-600" />
          Precios de Runas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {COMMON_RUNES.map(rune => {
              const data = runePrices[rune] || { price: 0 };
              return (
                <div key={rune} className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2">
                    {data.image_url ? (
                      <img src={data.image_url} alt={rune} className="w-8 h-8 object-contain" />
                    ) : (
                      <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                        <ImageIcon className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                    <span className="text-sm font-medium">{rune}</span>
                  </div>
                  <div className="flex items-center gap-1 w-24">
                    <Input 
                      type="number" 
                      className="text-right h-8"
                      value={data.price}
                      onChange={e => updatePrice(rune, Number(e.target.value))}
                    />
                    <span className="text-xs text-muted-foreground">k</span>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
