'use client';
import React from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { ItemStat, RuneBreakdown } from '@/lib/api';
import { useRunePrices } from '@/context/RunePriceContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface RuneTableProps {
  stats: ItemStat[];
  breakdown: RuneBreakdown[];
  onStatChange: (stats: ItemStat[]) => void;
  showTop3?: boolean;
}

export const RuneTable: React.FC<RuneTableProps> = ({ stats, breakdown, onStatChange, showTop3 = false }) => {
  const { runePrices, updatePrice } = useRunePrices();

  const handleStatValueChange = (index: number, newValue: number) => {
    const newStats = [...stats];
    newStats[index] = { ...newStats[index], value: newValue };
    onStatChange(newStats);
  };

  const rows = stats.map((stat, index) => {
    const result = breakdown.find(b => b.stat === stat.name);
    return {
      stat,
      index,
      result
    };
  });

  const totalSinFocus = rows.reduce((acc, { stat, result }) => {
    if (stat.value < 0) return acc;
    const count = result?.count || 0;
    const runeName = result?.rune_name || stat.rune_name || '';
    const price = runePrices[runeName]?.price || 0;
    return acc + Math.floor(count * price);
  }, 0);

  // Calculate max value for highlighting
  const maxFocusVal = rows.reduce((max, { stat, result }) => {
    if (stat.value < 0) return max;
    const count = result?.focus_count || 0;
    const runeName = result?.rune_name || stat.rune_name || '';
    const price = runePrices[runeName]?.price || 0;
    const total = Math.floor(count * price);
    return total > max ? total : max;
  }, 0);

  const globalMax = Math.max(totalSinFocus, maxFocusVal);

  // Calculate sorted unique values for ranking
  const sortedFocusValues = Array.from(new Set(rows.map(({ stat, result }) => {
    if (stat.value < 0) return 0;
    const count = result?.focus_count || 0;
    const runeName = result?.rune_name || stat.rune_name || '';
    const price = runePrices[runeName]?.price || 0;
    return Math.floor(count * price);
  }))).sort((a, b) => b - a).filter(v => v > 0);

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="w-[200px] pl-6">Característica</TableHead>
            <TableHead className="w-[220px] text-center">Tirada</TableHead>
            <TableHead className="w-[180px]">Runa</TableHead>
            <TableHead className="w-[120px]">Precio Unit.</TableHead>
            <TableHead className="text-center bg-blue-50/50 dark:bg-blue-950/20 border-l border-r border-border/50" colSpan={2}>
              <span className="text-blue-600 dark:text-blue-400 font-semibold">Sin Focus</span>
            </TableHead>
            <TableHead className="text-center bg-purple-50/50 dark:bg-purple-950/20" colSpan={2}>
              <span className="text-purple-600 dark:text-purple-400 font-semibold">Con Focus</span>
            </TableHead>
          </TableRow>
          <TableRow className="text-[10px] uppercase tracking-wider text-muted-foreground border-b-2 hover:bg-transparent">
            <TableHead className="pl-6 font-semibold">Stat</TableHead>
            <TableHead className="text-center font-semibold">Min · Actual · Max</TableHead>
            <TableHead className="font-semibold">Tipo</TableHead>
            <TableHead className="font-semibold">Kamas</TableHead>
            <TableHead className="text-right font-semibold border-l border-border/50 bg-blue-50/30 dark:bg-blue-950/10">Cant.</TableHead>
            <TableHead className="text-right font-semibold border-r border-border/50 bg-blue-50/30 dark:bg-blue-950/10">Total</TableHead>
            <TableHead className="text-right font-semibold bg-purple-50/30 dark:bg-purple-950/10">Cant.</TableHead>
            <TableHead className="text-right font-semibold bg-purple-50/30 dark:bg-purple-950/10">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ stat, index, result }) => (
            <TableRow 
              key={index} 
              className={`group hover:bg-muted/30 transition-colors ${stat.value < 0 ? 'bg-red-100/50 dark:bg-red-900/20' : ''}`}
            >
              <TableCell className="font-medium pl-6 py-3">
                <div className="flex items-center gap-2">
                  <span className="capitalize">{stat.name}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-center gap-1 text-base bg-muted/30 rounded-md p-1 border border-transparent group-hover:border-border transition-colors">
                  <span className="text-muted-foreground w-8 text-right text-sm">{stat.min}</span>
                  <span className="text-muted-foreground/30">·</span>
                  <Input 
                    type="number" 
                    className="w-16 h-8 text-center font-bold text-lg bg-background shadow-sm border-input focus-visible:ring-1 no-spinner"
                    value={stat.value}
                    onChange={(e) => handleStatValueChange(index, Number(e.target.value))}
                  />
                  <span className="text-muted-foreground/30">·</span>
                  <span className="text-muted-foreground w-8 text-left text-sm">{stat.max}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                   <div className="relative w-8 h-8 flex items-center justify-center bg-muted/50 rounded-md border border-border/50">
                     {result?.rune_image ? (
                       <Image 
                         src={result.rune_image} 
                         alt="" 
                         width={24} 
                         height={24} 
                         className="object-contain" 
                       />
                     ) : (
                       <div className="w-4 h-4 bg-muted-foreground/20 rounded-full" />
                     )}
                   </div>
                   <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                     {result?.rune_name || stat.rune_name || `Runa ${stat.name.substring(0,3)}`}
                   </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="relative">
                  <Input 
                    type="number" 
                    className="w-24 h-8 pr-6 text-right font-mono text-sm"
                    value={runePrices[result?.rune_name || stat.rune_name || '']?.price || 0}
                    onChange={(e) => {
                      const runeName = result?.rune_name || stat.rune_name;
                      if (runeName) updatePrice(runeName, Number(e.target.value));
                    }}
                  />
                  <span className="absolute right-2 top-2 text-[10px] text-muted-foreground">k</span>
                </div>
              </TableCell>
              
              {/* Sin Focus */}
              <TableCell className="text-right font-mono text-base border-l border-border/50 bg-blue-50/10 dark:bg-blue-950/5 group-hover:bg-blue-50/20 dark:group-hover:bg-blue-950/10 transition-colors">
                {result?.count ? (
                  <Badge variant="outline" className="font-mono font-normal text-sm border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400">
                    {result.count.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground/30">-</span>
                )}
              </TableCell>
              <TableCell className="text-right font-bold text-base border-r border-border/50 bg-blue-50/10 dark:bg-blue-950/5 group-hover:bg-blue-50/20 dark:group-hover:bg-blue-950/10 transition-colors">
                {(() => {
                  const count = result?.count || 0;
                  const runeName = result?.rune_name || stat.rune_name || '';
                  const price = runePrices[runeName]?.price || 0;
                  const total = Math.floor(count * price);
                  return total > 0 ? (
                    <span className="text-blue-700 dark:text-blue-400">{total.toLocaleString()} k</span>
                  ) : (
                    <span className="text-muted-foreground/30">-</span>
                  );
                })()}
              </TableCell>

              {/* Con Focus */}
              <TableCell className="text-right font-mono text-base bg-purple-50/10 dark:bg-purple-950/5 group-hover:bg-purple-50/20 dark:group-hover:bg-purple-950/10 transition-colors">
                <div className="flex items-center justify-end gap-2">
                    {result?.focus_image && result.focus_rune_name !== result.rune_name && (
                        <div className="w-5 h-5 relative" title={result.focus_rune_name}>
                          <Image 
                            src={result.focus_image} 
                            alt={result.focus_rune_name} 
                            fill
                            className="object-contain" 
                          />
                        </div>
                    )}
                    {result?.focus_count ? (
                      <Badge variant="outline" className="font-mono font-normal text-sm border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-400">
                        {result.focus_count.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground/30">-</span>
                    )}
                </div>
              </TableCell>
              <TableCell className="text-right font-bold text-base bg-purple-50/10 dark:bg-purple-950/5 group-hover:bg-purple-50/20 dark:group-hover:bg-purple-950/10 transition-colors">
                {(() => {
                  const count = result?.focus_count || 0;
                  const runeName = result?.rune_name || stat.rune_name || '';
                  const price = runePrices[runeName]?.price || 0;
                  const total = Math.floor(count * price);
                  
                  let styleClass = 'text-purple-700 dark:text-purple-400';
                  
                  if (total > 0) {
                    if (showTop3) {
                        if (total === sortedFocusValues[0]) styleClass = 'text-green-600 dark:text-green-400 text-lg font-black animate-pulse';
                        else if (total === sortedFocusValues[1]) styleClass = 'text-orange-600 dark:text-orange-400 text-lg font-bold animate-pulse';
                        else if (total === sortedFocusValues[2]) styleClass = 'text-yellow-600 dark:text-yellow-400 text-lg font-bold animate-pulse';
                    } else {
                        if (total === globalMax) styleClass = 'text-green-600 dark:text-green-400 text-lg animate-pulse';
                    }
                  }
                  
                  return total > 0 ? (
                    <span className={styleClass}>
                      {total.toLocaleString()} k
                    </span>
                  ) : (
                    <span className="text-muted-foreground/30">-</span>
                  );
                })()}
              </TableCell>
            </TableRow>
          ))}
          <TableRow className="bg-muted/50 font-bold border-t-2 border-border">
            <TableCell colSpan={4} className="text-right pr-6 py-4 text-muted-foreground uppercase text-xs tracking-wider">
              Total Estimado (Sin Focus)
            </TableCell>
            <TableCell className="border-l border-border/50 bg-blue-50/20 dark:bg-blue-950/10"></TableCell>
            <TableCell className="text-right text-lg border-r border-border/50 bg-blue-50/20 dark:bg-blue-950/10">
               <span className={`${totalSinFocus > 0 && totalSinFocus === globalMax ? 'text-green-600 dark:text-green-400 text-xl animate-pulse' : 'text-blue-700 dark:text-blue-400'}`}>
                 {totalSinFocus.toLocaleString()} k
               </span>
            </TableCell>
            <TableCell colSpan={2} className="bg-purple-50/20 dark:bg-purple-950/10"></TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};
