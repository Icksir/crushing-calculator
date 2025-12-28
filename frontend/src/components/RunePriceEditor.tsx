'use client';
import React from 'react';
import { useRunePrices } from '@/context/RunePriceContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Coins, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDate } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';

export const RunePriceEditor = () => {
  const { runePrices, updatePrice, isLoading } = useRunePrices();
  const { t } = useLanguage();

  const runesList = Object.keys(runePrices).sort();

  return (
    <Card className="flex flex-col flex-1">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Coins className="w-5 h-5 text-yellow-600" />
          {t('rune_prices_title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <ScrollArea className="h-full pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {runesList.map(rune => {
                const data = runePrices[rune] || { price: 0 };
                return (
                  <div key={rune} className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2 flex-grow min-w-0">
                      {data.image_url ? (
                        <img src={data.image_url} alt={rune} className="w-8 h-8 object-contain flex-shrink-0" />
                      ) : (
                        <div className="w-8 h-8 bg-muted rounded flex items-center justify-center flex-shrink-0">
                          <ImageIcon className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                      <span className="text-sm font-medium">{rune}</span>
                    </div>
                    <div className="flex items-center gap-1 pl-2 w-[80px] sm:w-24 flex-shrink-0">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <Input 
                                type="number" 
                                className="text-right h-8"
                                value={data.price}
                                min={0}
                                max={10000000}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === '') {
                                    updatePrice(rune, 0);
                                    return;
                                  }
                                  let num = Number(val);
                                  if (isNaN(num)) return;
                                  if (num < 0) num = 0;
                                  if (num > 10000000) num = 10000000;
                                  updatePrice(rune, num);
                                }}
                                onKeyDown={(e) => {
                                  // Block minus sign and disallow non-numeric (except control/navigation keys)
                                  const controlKeys = ['Backspace','Delete','Tab','ArrowLeft','ArrowRight','Home','End','Enter'];
                                  const isDigit = /^[0-9]$/.test(e.key);
                                  const isControl = controlKeys.includes(e.key);
                                  // Allow '.' if user enters decimals; block only '-'
                                  if (e.key === '-') {
                                    e.preventDefault();
                                    return;
                                  }
                                  if (!isDigit && !isControl && e.key !== '.') {
                                    e.preventDefault();
                                    return;
                                  }
                                  // Prevent creating a value > 10000000 when typing another digit
                                  if (isDigit) {
                                    const input = e.currentTarget as HTMLInputElement;
                                    const start = input.selectionStart ?? input.value.length;
                                    const end = input.selectionEnd ?? input.value.length;
                                    const newValStr = input.value.slice(0, start) + e.key + input.value.slice(end);
                                    const newNum = Number(newValStr);
                                    if (!Number.isNaN(newNum) && newNum > 10000000) {
                                      e.preventDefault();
                                      return;
                                    }
                                  }
                                }}
                                onPaste={(e) => {
                                  const text = e.clipboardData.getData('text');
                                  const sanitized = text.replace(/[^0-9.]/g, '');
                                  const num = Number(sanitized);
                                  if (!Number.isNaN(num)) {
                                    e.preventDefault();
                                    let clamped = num;
                                    if (clamped < 0) clamped = 0;
                                    if (clamped > 10000000) clamped = 10000000;
                                    updatePrice(rune, clamped);
                                  }
                                }}
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Updated: {formatDate(data.updated_at)}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <span className="text-xs text-muted-foreground">k</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
