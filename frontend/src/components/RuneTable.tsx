'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { SafeImage } from '@/components/SafeImage';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ItemStat, RuneBreakdown, StatCatalogEntry } from '@/lib/api';
import { useRunePrices } from '@/context/RunePriceContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatNumber, formatDate, stripLeadingZeros, preventLeadingZeros, selectOnFocusIfZero } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useLanguage } from '@/context/LanguageContext';
import { Plus, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ExoEntry {
  canonical: string;
  value: number;
}

interface RuneTableProps {
  stats: ItemStat[];
  breakdown: RuneBreakdown[];
  onStatChange: (stats: ItemStat[]) => void;
  showTop3?: boolean;
  baseStatCount: number;
  exos: ExoEntry[];
  onExosChange: (exos: ExoEntry[]) => void;
  statCatalog: StatCatalogEntry[];
}

export const RuneTable: React.FC<RuneTableProps> = ({
  stats,
  breakdown,
  onStatChange,
  showTop3 = false,
  baseStatCount,
  exos,
  onExosChange,
  statCatalog,
}) => {
  const { runePrices, updatePrice } = useRunePrices();
  const { t } = useLanguage();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const handleStatValueChange = (index: number, newValue: number | string) => {
    if (index < baseStatCount) {
      const newStats = [...stats];
      newStats[index] = { ...newStats[index], value: newValue as number };
      onStatChange(newStats.slice(0, baseStatCount));
    } else {
      const exoIndex = index - baseStatCount;
      const newExos = [...exos];
      newExos[exoIndex] = { ...newExos[exoIndex], value: newValue as number };
      onExosChange(newExos);
    }
  };

  const normalizeValue = (val: number | string): number => {
    if (val === '' || val === '-') return 0;
    if (typeof val === 'string') {
      const num = parseInt(val, 10);
      return isNaN(num) ? 0 : num;
    }
    return val;
  };

  const rows = stats.map((stat, index) => {
    const result = breakdown.find(b => b.stat === stat.name);
    return {
      stat,
      index,
      result,
      isExo: index >= baseStatCount,
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

  // Calculate sorted unique values for ranking (including Total Sin Focus)
  const sortedValues = Array.from(new Set([
    totalSinFocus,
    ...rows.map(({ stat, result }) => {
      if (stat.value < 0) return 0;
      const count = result?.focus_count || 0;
      const runeName = result?.rune_name || stat.rune_name || '';
      const price = runePrices[runeName]?.price || 0;
      return Math.floor(count * price);
    })
  ])).sort((a, b) => b - a).filter(v => v > 0);

  const presentCanonicals = useMemo(() => {
    const set = new Set<string>();
    exos.forEach((e) => set.add(e.canonical));
    stats.slice(0, baseStatCount).forEach((stat) => {
      const entry = statCatalog.find((e) => e.label === stat.name);
      if (entry) set.add(entry.canonical);
    });
    return set;
  }, [exos, stats, baseStatCount, statCatalog]);

  const availableStats = useMemo(() => {
    return statCatalog.filter((e) => !presentCanonicals.has(e.canonical));
  }, [statCatalog, presentCanonicals]);

  const handleAddExo = (canonical: string) => {
    onExosChange([...exos, { canonical, value: 1 }]);
  };

  const handleRemoveExo = (exoIndex: number) => {
    onExosChange(exos.filter((_, i) => i !== exoIndex));
  };

  const handleStatKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (/^[0-9]$/.test(e.key)) {
      const input = e.currentTarget;
      const start = input.selectionStart ?? 0;
      const end = input.selectionEnd ?? 0;
      const val = input.value;
      const wouldBecome = val.slice(0, start) + e.key + val.slice(end);
      if (/^-?0\d/.test(wouldBecome)) {
        e.preventDefault();
        const stripped = stripLeadingZeros(wouldBecome);
        handleStatValueChange(index, parseInt(stripped, 10) || 0);
      }
    }
  };

  const renderExoAdder = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1"
          disabled={availableStats.length === 0}
        >
          <Plus className="h-4 w-4" />
          {t('add_exo')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
        {availableStats.length === 0 ? (
          <DropdownMenuItem disabled>{t('no_more_stats')}</DropdownMenuItem>
        ) : (
          availableStats.map((entry) => (
            <DropdownMenuItem
              key={entry.canonical}
              onClick={() => handleAddExo(entry.canonical)}
              className="gap-2"
            >
              {entry.rune_image && (
                <SafeImage
                  src={entry.rune_image}
                  alt=""
                  width={20}
                  height={20}
                  className="object-contain"
                  fallbackClassName="w-5 h-5 rounded-full"
                />
              )}
              <span>{entry.label}</span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (isMobile) {
    return (
      <div className="space-y-4">
        {rows.map(({ stat, index, result, isExo }) => {
            const count = result?.count || 0;
            const runeName = result?.rune_name || stat.rune_name || '';
            const price = runePrices[runeName]?.price || 0;
            const total = Math.floor(count * price);

            const focusCount = result?.focus_count || 0;
            const focusTotal = Math.floor(focusCount * price);

            let styleClass = 'text-purple-700 dark:text-purple-400';
            if (focusTotal > 0) {
              if (showTop3) {
                  if (focusTotal === sortedValues[0]) styleClass = 'text-green-600 dark:text-green-400 text-lg font-black';
                  else if (focusTotal === sortedValues[1]) styleClass = 'text-yellow-600 dark:text-yellow-400 text-lg font-bold';
                  else if (focusTotal === sortedValues[2]) styleClass = 'text-orange-600 dark:text-orange-400 text-lg font-bold';
              } else {
                  if (focusTotal === globalMax) styleClass = 'text-green-600 dark:text-green-400 text-lg';
              }
            }

            return (
              <div key={index} className={`rounded-lg border bg-card shadow-sm p-4 ${stat.value < 0 ? 'bg-red-100/50 dark:bg-red-900/20' : ''} ${isExo ? 'bg-amber-50/30 dark:bg-amber-950/10' : ''}`}>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative w-8 h-8 flex items-center justify-center bg-muted/50 rounded-md border border-border/50">
                      <SafeImage src={result?.rune_image} alt="" width={24} height={24} className="object-contain" fallbackClassName="w-4 h-4 rounded-full" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold capitalize">{stat.name}</h3>
                        {isExo && <Badge variant="secondary">{t('exo_badge')}</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{result?.rune_name || stat.rune_name || `${t('rune')} ${stat.name.substring(0,3)}`}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center gap-1 text-base bg-muted/30 rounded-md p-1 border">
                      <span className="text-muted-foreground w-8 text-right text-sm">{isExo ? '—' : stat.min}</span>
                      <span className="text-muted-foreground/30">·</span>
                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="-?[0-9]*"
                        className="w-16 h-8 text-center font-bold text-lg bg-background shadow-sm border-input focus-visible:ring-1 no-spinner"
                        value={stat.value}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          if (newValue === '' || newValue === '-') {
                            handleStatValueChange(index, newValue);
                          } else if (/^-?\d*$/.test(newValue)) {
                            const stripped = stripLeadingZeros(newValue);
                            const num = parseInt(stripped, 10) || 0;
                            handleStatValueChange(index, num);
                            // Force DOM correction — bypasses React reconciliation
                            // when parsed value equals previous state (e.g. "00" -> 0)
                            e.target.value = stripped === '' || stripped === '-' ? String(num) : stripped;
                          }
                        }}
                        onKeyDown={(e) => handleStatKeyDown(e, index)}
                        onFocus={selectOnFocusIfZero}
                        onBlur={() => {
                          const normalized = normalizeValue(stat.value);
                          if (normalized !== stat.value) {
                            handleStatValueChange(index, normalized);
                          }
                        }}
                      />
                      <span className="text-muted-foreground/30">·</span>
                      <span className="text-muted-foreground w-8 text-left text-sm">{isExo ? '—' : stat.max}</span>
                    </div>
                    {isExo && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-red-500"
                        onClick={() => handleRemoveExo(index - baseStatCount)}
                        title={t('remove_exo')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-0 text-sm">
                  <div className="space-y-2 p-3 rounded-t-md bg-blue-50/20 dark:bg-blue-950/10 border">
                    <h4 className="font-semibold text-blue-600 dark:text-blue-400">{t('without_focus')}</h4>
                    <div className="flex justify-between"><span>{t('quantity')}:</span> <Badge variant="outline" className="font-mono text-xs border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400">{result?.count?.toFixed(2) || '-'}</Badge></div>
                    <div className="flex justify-between"><span>{t('total')}:</span> <span className="font-bold text-blue-700 dark:text-blue-400">{total > 0 ? `${formatNumber(total)} k` : '-'}</span></div>
                  </div>
                  <div className="space-y-2 p-3 rounded-b-md bg-purple-50/20 dark:bg-purple-950/10 border border-t-0">
                    <h4 className="font-semibold text-purple-600 dark:text-purple-400">{t('with_focus')}</h4>
                    <div className="flex justify-between"><span>{t('quantity')}:</span> <Badge variant="outline" className="font-mono text-xs border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-400">{result?.focus_count?.toFixed(2) || '-'}</Badge></div>
                    <div className="flex justify-between"><span>{t('total')}:</span> <span className={`font-bold ${styleClass}`}>{focusTotal > 0 ? `${formatNumber(focusTotal)} k` : '-'}</span></div>
                  </div>
                </div>
              </div>
            );
        })}

        {/* Add Exo - Mobile */}
        <div className="rounded-lg border border-dashed bg-muted/20 p-4 flex items-center justify-center">
          {renderExoAdder()}
        </div>

        {/* TOTAL SIN FOCUS - Mobile */}
        <div className="rounded-lg border bg-muted/40 p-4 font-bold">
            <div className="flex justify-between items-center text-lg">
                <span>{t('total_without_focus')}</span>
                {(() => {
                 let styleClass = 'text-blue-700 dark:text-blue-400';
                 if (totalSinFocus > 0) {
                   if (showTop3) {
                      if (totalSinFocus === sortedValues[0]) styleClass = 'text-green-600 dark:text-green-400 text-xl font-black';
                      else if (totalSinFocus === sortedValues[1]) styleClass = 'text-yellow-600 dark:text-yellow-400 text-xl font-bold';
                      else if (totalSinFocus === sortedValues[2]) styleClass = 'text-orange-600 dark:text-orange-400 text-xl font-bold';
                   } else {
                      if (totalSinFocus === globalMax) styleClass = 'text-green-600 dark:text-green-400 text-xl';
                   }
                 }
                 return <span className={styleClass}>{formatNumber(totalSinFocus)} k</span>;
               })()}
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="w-[200px] pl-6">{t('characteristic')}</TableHead>
            <TableHead className="w-[220px] text-center">{t('roll')}</TableHead>
            <TableHead className="w-[180px]">{t('rune')}</TableHead>
            <TableHead className="w-[120px]">{t('unit_price')}</TableHead>
            <TableHead className="text-center bg-blue-50/50 dark:bg-blue-950/20 border-l border-r border-border/50" colSpan={2}>
              <span className="text-blue-600 dark:text-blue-400 font-semibold">{t('without_focus')}</span>
            </TableHead>
            <TableHead className="text-center bg-purple-50/50 dark:bg-purple-950/20" colSpan={2}>
              <span className="text-purple-600 dark:text-purple-400 font-semibold">{t('with_focus')}</span>
            </TableHead>
          </TableRow>
          <TableRow className="text-[10px] uppercase tracking-wider text-muted-foreground border-b-2 hover:bg-transparent">
            <TableHead className="pl-6 font-semibold">{t('stat')}</TableHead>
            <TableHead className="text-center font-semibold">{t('roll_values')}</TableHead>
            <TableHead className="font-semibold">{t('type')}</TableHead>
            <TableHead className="font-semibold">{t('kamas')}</TableHead>
            <TableHead className="text-right font-semibold border-l border-border/50 bg-blue-50/30 dark:bg-blue-950/10">{t('quantity')}</TableHead>
            <TableHead className="text-right font-semibold border-r border-border/50 bg-blue-50/30 dark:bg-blue-950/10">{t('total')}</TableHead>
            <TableHead className="text-right font-semibold bg-purple-50/30 dark:bg-purple-950/10">{t('quantity')}</TableHead>
            <TableHead className="text-right font-semibold bg-purple-50/30 dark:bg-purple-950/10">{t('total')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ stat, index, result, isExo }) => (
            <TableRow
              key={index}
              className={`group hover:bg-muted/30 transition-colors ${stat.value < 0 ? 'bg-red-100/50 dark:bg-red-900/20' : ''} ${isExo ? 'bg-amber-50/30 dark:bg-amber-950/10' : ''}`}
            >
              <TableCell className="font-medium pl-6 py-3">
                <div className="flex items-center gap-2">
                  <span className="capitalize">{stat.name}</span>
                  {isExo && <Badge variant="secondary">{t('exo_badge')}</Badge>}
                  {isExo && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-red-500 ml-auto"
                      onClick={() => handleRemoveExo(index - baseStatCount)}
                      title={t('remove_exo')}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-center gap-1 text-base bg-muted/30 rounded-md p-1 border border-transparent group-hover:border-border transition-colors">
                  <span className="text-muted-foreground w-8 text-right text-sm">{isExo ? '—' : stat.min}</span>
                  <span className="text-muted-foreground/30">·</span>

                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="-?[0-9]*"
                    className="w-16 h-8 text-center font-bold text-lg bg-background shadow-sm border-input focus-visible:ring-1 no-spinner"
                    value={stat.value}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      if (newValue === '' || newValue === '-') {
                        handleStatValueChange(index, newValue);
                      } else if (/^-?\d*$/.test(newValue)) {
                        const stripped = stripLeadingZeros(newValue);
                        const num = parseInt(stripped, 10) || 0;
                        handleStatValueChange(index, num);
                        // Force DOM correction — bypasses React reconciliation
                        // when parsed value equals previous state (e.g. "00" -> 0)
                        e.target.value = stripped === '' || stripped === '-' ? String(num) : stripped;
                      }
                    }}
                    onKeyDown={(e) => handleStatKeyDown(e, index)}
                    onFocus={selectOnFocusIfZero}
                    onBlur={() => {
                      const normalized = normalizeValue(stat.value);
                      if (normalized !== stat.value) {
                        handleStatValueChange(index, normalized);
                      }
                    }}
                  />

                  <span className="text-muted-foreground/30">·</span>
                  <span className="text-muted-foreground w-8 text-left text-sm">{isExo ? '—' : stat.max}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                   <div className="relative w-8 h-8 flex items-center justify-center bg-muted/50 rounded-md border border-border/50">
<SafeImage src={result?.rune_image} alt="" width={24} height={24} className="object-contain" fallbackClassName="w-4 h-4 rounded-full" />
                   </div>
                   <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                     {result?.rune_name || stat.rune_name || `${t('rune')} ${stat.name.substring(0,3)}`}
                   </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="relative">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <Input
                            type="number"
                            className="w-24 h-8 pr-6 text-right font-mono text-sm"
                            value={runePrices[result?.rune_name || stat.rune_name || '']?.price || 0}
                            min={0}
                            max={10000000}
                            onChange={(e) => {
                              const val = e.target.value;
                              const runeName = result?.rune_name || stat.rune_name;
                              if (!runeName) return;

                              if (val === '') {
                                updatePrice(runeName, 0);
                                return;
                              }
                              const stripped = stripLeadingZeros(val);
                              let num = Number(stripped);
                              if (isNaN(num)) return;
                              if (num < 0) num = 0;
                              if (num > 10000000) num = 10000000;
                              updatePrice(runeName, num);
                              // Force DOM correction
                              e.target.value = String(num);
                            }}
                            onKeyDown={(e) => {
                              preventLeadingZeros(e);
                              if (e.defaultPrevented) return;
                              const controlKeys = ['Backspace','Delete','Tab','ArrowLeft','ArrowRight','Home','End','Enter'];
                              const isDigit = /^[0-9]$/.test(e.key);
                              const isControl = controlKeys.includes(e.key);
                              if (e.key === '-') {
                                e.preventDefault();
                                return;
                              }
                              if (!isDigit && !isControl && e.key !== '.') {
                                e.preventDefault();
                                return;
                              }
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
                            onFocus={selectOnFocusIfZero}
                            onPaste={(e) => {
                              const text = e.clipboardData.getData('text');
                              const sanitized = text.replace(/[^0-9.]/g, '');
                              const stripped = stripLeadingZeros(sanitized);
                              const num = Number(stripped);
                              if (!Number.isNaN(num)) {
                                e.preventDefault();
                                let clamped = num;
                                if (clamped < 0) clamped = 0;
                                if (clamped > 10000000) clamped = 10000000;
                                const runeName = result?.rune_name || stat.rune_name;
                                if (runeName) updatePrice(runeName, clamped);
                              }
                            }}
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Actualizado: {formatDate(runePrices[result?.rune_name || stat.rune_name || '']?.updated_at)}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <span className="absolute right-2 top-2 text-[10px] text-muted-foreground pointer-events-none">k</span>
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
                    <span className="text-blue-700 dark:text-blue-400">{formatNumber(total)} k</span>
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
                          <SafeImage
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
                        if (total === sortedValues[0]) styleClass = 'text-green-600 dark:text-green-400 text-lg font-black animate-pulse';
                        else if (total === sortedValues[1]) styleClass = 'text-yellow-600 dark:text-yellow-400 text-lg font-bold animate-pulse';
                        else if (total === sortedValues[2]) styleClass = 'text-orange-600 dark:text-orange-400 text-lg font-bold animate-pulse';
                    } else {
                        if (total === globalMax) styleClass = 'text-green-600 dark:text-green-400 text-lg animate-pulse';
                    }
                  }

                  return total > 0 ? (
                    <span className={styleClass}>
                      {formatNumber(total)} k
                    </span>
                  ) : (
                    <span className="text-muted-foreground/30">-</span>
                  );
                })()}
              </TableCell>

            </TableRow>
          ))}

          {/* Add Exo Row - Desktop */}
          <TableRow className="border-t border-dashed hover:bg-transparent">
            <TableCell colSpan={8} className="py-2">
              <div className="flex items-center justify-center">
                {renderExoAdder()}
              </div>
            </TableCell>
          </TableRow>

          {/* TOTAL SIN FOCUS */}
          <TableRow className="bg-muted/40 hover:bg-muted/40 font-bold border-t-2">
            <TableCell colSpan={5} className="text-right text-base pr-4">{t('total_without_focus')}</TableCell>
            <TableCell
              className="text-right text-lg text-blue-700 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-950/10 border-r border-border/50"
            >
               {(() => {
                 let styleClass = 'text-blue-700 dark:text-blue-400';
                 if (totalSinFocus > 0) {
                   if (showTop3) {
                      if (totalSinFocus === sortedValues[0]) styleClass = 'text-green-600 dark:text-green-400 text-xl font-black animate-pulse';
                      else if (totalSinFocus === sortedValues[1]) styleClass = 'text-yellow-600 dark:text-yellow-400 text-xl font-bold animate-pulse';
                      else if (totalSinFocus === sortedValues[2]) styleClass = 'text-orange-600 dark:text-orange-400 text-xl font-bold animate-pulse';
                   } else {
                      if (totalSinFocus === globalMax) styleClass = 'text-green-600 dark:text-green-400 text-xl animate-pulse';
                   }
                 }
                 return (
                   <span className={styleClass}>
                     {formatNumber(totalSinFocus)} k
                   </span>
                 );
               })()}
            </TableCell>
            <TableCell colSpan={2} className="bg-purple-50/20 dark:bg-purple-950/10"></TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};
