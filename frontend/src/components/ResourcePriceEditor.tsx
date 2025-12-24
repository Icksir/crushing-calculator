'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Ingredient, getIngredientsByFilter, getIngredientPrices, updateIngredientPrices, ProfitItem, getBestProfitItems, IngredientPriceData } from '@/lib/api';
import { Loader2, Save, Filter, Calculator, RefreshCw, Ban, ChevronLeft, ChevronRight, ArrowUp, ArrowDown } from 'lucide-react';
import Image from 'next/image';
import { Switch } from '@/components/ui/switch';
import { formatNumber, formatDate } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useLanguage } from '@/context/LanguageContext';
import { useRunePrices } from '@/context/RunePriceContext';

const PROFESSIONS = [
  { name: 'Blacksmith', types: ['Sword', 'Dagger', 'Hammer', 'Shovel', 'Axe', 'Scythe', 'Pickaxe'] },
  { name: 'Sculptor', types: ['Bow', 'Wand', 'Staff'] },
  { name: 'Jeweler', types: ['Amulet', 'Ring'] },
  { name: 'Shoemaker', types: ['Boots', 'Belt'] },
  { name: 'Tailor', types: ['Hat', 'Cloak', 'Backpack'] },
  { name: 'Manufacturer', types: ['Shield', 'Trophy'] },
];

interface ResourcePriceEditorProps {
  onSelectItem?: (item: { id: number; name: string; img: string }) => void;
}

export const ResourcePriceEditor = ({ onSelectItem }: ResourcePriceEditorProps) => {
  const [selectedProfession, setSelectedProfession] = useState(PROFESSIONS[0].name);
  const [minLevel, setMinLevel] = useState(10);
  const [maxLevel, setMaxLevel] = useState(60);
  const [loading, setLoading] = useState(false);
  const [resources, setResources] = useState<Ingredient[]>([]);
  const [prices, setPrices] = useState<Record<number, IngredientPriceData>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [profitItems, setProfitItems] = useState<ProfitItem[]>([]);
  const [calculatingProfit, setCalculatingProfit] = useState(false);
  const [minCostFilter, setMinCostFilter] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'profit' | 'risk'>('profit');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const resultsRef = useRef<HTMLDivElement>(null);
  const { t, language } = useLanguage();
  const { server } = useRunePrices();

  // Load initial prices
  useEffect(() => {
    getIngredientPrices(server).then(setPrices).catch(console.error);
  }, [server]);

  const fetchProfitItems = async (page: number, currentSortBy = sortBy, currentSortOrder = sortOrder) => {
    setCalculatingProfit(true);
    try {
      const profession = PROFESSIONS.find(p => p.name === selectedProfession);
      if (!profession) return;
      
      const data = await getBestProfitItems(profession.types, minLevel, maxLevel, 0, minCostFilter, page, 10, currentSortBy, currentSortOrder, language, server);
      setProfitItems(data.items);
      setTotalPages(data.total_pages);
      setCurrentPage(data.page);
      
      // Scroll to results after a short delay to allow rendering
      setTimeout(() => {
        if (resultsRef.current) {
          const element = resultsRef.current;
          const elementTop = element.getBoundingClientRect().top + window.pageYOffset;
          const offset = 70; // Adjust this value to account for navbar height
          window.scrollTo({ top: elementTop - offset, behavior: 'smooth' });
        }
      }, 100);
    } catch (error) {
      console.error("Failed to calculate profit", error);
    } finally {
      setCalculatingProfit(false);
    }
  };

  const handleCalculateProfit = () => {
    fetchProfitItems(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCalculateProfit();
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
        fetchProfitItems(newPage);
    }
  };

  const getCacheKey = (prof: string, min: number, max: number) => `resources_cache_${prof}_${min}_${max}_${language}`;

  const handleLoadResources = async (forceRefresh = false) => {
    setLoading(true);
    try {
      const profession = PROFESSIONS.find(p => p.name === selectedProfession);
      if (!profession) return;
      
      const cacheKey = getCacheKey(selectedProfession, minLevel, maxLevel);

      if (!forceRefresh) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          try {
            const { timestamp, data } = JSON.parse(cached);
            // Cache valid for 24 hours
            if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
              setResources(data);
              setLoading(false);
              return;
            }
          } catch (e) {
            console.error("Error parsing cache", e);
          }
        }
      }

      const data = await getIngredientsByFilter(profession.types, minLevel, maxLevel, language);
      setResources(data);
      
      localStorage.setItem(cacheKey, JSON.stringify({
        timestamp: Date.now(),
        data
      }));
    } catch (error) {
      console.error("Failed to load resources", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePriceChange = (id: number, price: number) => {
    setPrices(prev => {
        const current = prev[id] || { price: 0 };
        return { ...prev, [id]: { ...current, price } };
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const updates = resources
        .filter(r => prices[r.id] !== undefined)
        .map(r => ({ item_id: r.id, price: prices[r.id].price, name: r.name }));
      
      await updateIngredientPrices(updates, server);
      setHasChanges(false);
    } catch (error) {
      console.error("Failed to save prices", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Columna Izquierda: Controles */}
      <div className="w-full">
        <div className="space-y-6">
            <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="w-5 h-5" />
                    {t('search_filters')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="space-y-2">
                      <Label>{t('profession')}</Label>
                      <select 
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={selectedProfession} 
                        onChange={e => setSelectedProfession(e.target.value)}
                      >
                        {PROFESSIONS.map(p => (
                          <option key={p.name} value={p.name}>{t(p.name)}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>{t('min_level')}</Label>
                      <Input 
                        type="number" 
                        value={minLevel} 
                        onChange={e => setMinLevel(Number(e.target.value))}
                        min={1} max={200}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('max_level')}</Label>
                      <Input 
                        type="number" 
                        value={maxLevel} 
                        onChange={e => setMaxLevel(Number(e.target.value))}
                        min={1} max={200}
                      />
                    </div>
                    <div className="flex items-center gap-2 col-span-1">
                        <Button onClick={() => handleLoadResources(false)} disabled={loading}>
                          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                          {t('load')}
                        </Button>
                        <Button onClick={() => handleLoadResources(true)} variant="outline" size="icon" title={t('force_reload')}>
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                        <Button onClick={handleCalculateProfit} className="flex-1 min-w-0" disabled={calculatingProfit}>
                           <Calculator className="w-4 h-4 mr-0 sm:mr-2 flex-shrink-0" />
                           <span className="hidden sm:inline">{t('search_opportunities')}</span>
                           {calculatingProfit && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
                        </Button>
                    </div>
                  </div>
                </CardContent>
            </Card>

            {resources.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{t('resources')} ({resources.length})</CardTitle>
                {hasChanges && (
                  <Button onClick={handleSave} disabled={loading}>
                    <Save className="w-4 h-4 mr-2" />
                    {t('save_changes')}
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {resources.map(resource => (
                      <div key={resource.id} className="flex items-center gap-3 p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                        <div className="relative w-10 h-10 bg-muted rounded-md border overflow-hidden shrink-0">
                          {resource.img && (
                            <Image 
                              src={resource.img} 
                              alt={resource.name} 
                              fill
                              className="object-contain p-1"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="text-sm font-medium">{resource.name}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div>
                                  <Input 
                                    type="number" 
                                    placeholder={prices[resource.id]?.price === -1 ? "---" : "0"}
                                    className={`text-right h-8 w-[70px] ${prices[resource.id]?.price === -1 ? 'opacity-50 bg-muted' : ''}`}
                                    value={prices[resource.id]?.price === -1 ? '' : (prices[resource.id]?.price || '')}
                                    disabled={prices[resource.id]?.price === -1}
                                    onChange={e => handlePriceChange(resource.id, Number(e.target.value))}
                                  />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Actualizado: {formatDate(prices[resource.id]?.updated_at)}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 shrink-0 ${prices[resource.id]?.price === -1 ? 'text-destructive hover:text-destructive/90 bg-destructive/10' : 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'}`}
                            onClick={() => handlePriceChange(resource.id, prices[resource.id]?.price === -1 ? 0 : -1)}
                            title={prices[resource.id]?.price === -1 ? t('mark_available') : t('mark_unavailable')}
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
            )}
        </div>
      </div>

      
      {/* Columna de Oportunidades (aparece abajo en móvil o si no hay recursos) */}
      {profitItems.length > 0 && (
        <Card ref={resultsRef}>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between flex-wrap gap-4">
                <CardTitle>{t('opportunities')}</CardTitle>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Switch id="analysis-mode" checked={showAnalysis} onCheckedChange={setShowAnalysis} />
                      <Label htmlFor="analysis-mode" className="cursor-pointer">{t('analysis_mode')}</Label>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Label className="whitespace-nowrap flex-shrink-0">{t('min_cost')}</Label>
                        <Input 
                            type="number" 
                            className="w-full sm:w-32" 
                            value={minCostFilter} 
                            onChange={(e) => setMinCostFilter(Number(e.target.value))}
                            onKeyDown={handleKeyDown}
                        />
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                        <Label className="whitespace-nowrap text-sm text-muted-foreground flex-shrink-0">{t('sort_by')}</Label>
                        <div className="flex items-center gap-2 border rounded-md p-1 bg-muted/20 flex-grow sm:flex-grow-0">
                            <Button 
                                variant={sortBy === 'profit' ? 'secondary' : 'ghost'} 
                                size="sm"
                                onClick={() => { setSortBy('profit'); fetchProfitItems(1, 'profit'); }}
                                className="h-7 text-xs flex-1 sm:flex-none"
                            >
                                {t('profit')}
                            </Button>
                            <Button 
                                variant={sortBy === 'risk' ? 'secondary' : 'ghost'} 
                                size="sm"
                                onClick={() => { setSortBy('risk'); fetchProfitItems(1, 'risk'); }}
                                className="h-7 text-xs flex-1 sm:flex-none"
                            >
                                {t('min_coefficient')}
                            </Button>
                            <div className="w-px h-4 bg-border mx-1"></div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { 
                                    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
                                    setSortOrder(newOrder); 
                                    fetchProfitItems(1, undefined, newOrder); 
                                }}
                                className="h-7 w-7 p-0 flex-shrink-0"
                                title={sortOrder === 'asc' ? t('asc') : t('desc')}
                            >
                                {sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
               {profitItems.map(item => {
                 const profitPotential = item.estimated_rune_value - item.craft_cost;
                 const risk = item.min_coefficient;
                 
                 // Heuristic Logic
                 const ratio = item.value_at_100 / (item.craft_cost || 1); // Avoid division by zero
                 let heuristicStatus = "Neutro";
                 let heuristicColor = "text-muted-foreground";
                 let heuristicDesc = "Riesgo Moderado";
                 
                 if (ratio > 1.2) {
                    heuristicStatus = "Sobre-explotado";
                    heuristicColor = "text-red-600";
                    heuristicDesc = "Probable Coef. Bajo";
                 } else if (ratio < 0.3) {
                    heuristicStatus = "Oportunidad";
                    heuristicColor = "text-purple-600";
                    heuristicDesc = "Probable Coef. Alto";
                 }

                 let riskColorClass = "";
                 if (risk < 150) riskColorClass = "text-green-600 font-bold";
                 else if (risk < 500) riskColorClass = "text-yellow-500 font-semibold";
                 else riskColorClass = "text-red-500 font-bold";

                 return (
                   <div 
                      key={item.id} 
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => onSelectItem?.({ id: item.id, name: item.name, img: item.img })}
                   >
                      <div className="flex items-center gap-4">
                        <div className="relative w-12 h-12 bg-muted rounded-md border overflow-hidden shrink-0">
                          {item.img && <Image src={item.img} alt={item.name} fill className="object-contain p-1" />}
                        </div>
                        <div className="flex-auto">
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-muted-foreground">{t('level')} {item.level}</div>
                        </div>
                      </div>
                      
                      <div className="flex flex-row gap-4 sm:gap-8 w-full sm:w-auto text-right justify-between sm:justify-end items-start sm:items-center mt-4 sm:mt-0">
                        {showAnalysis ? (
                            <div className="flex flex-row gap-4 sm:gap-8 w-full sm:w-auto text-right justify-between sm:justify-end">
                                <div>
                                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t('gap')}</div>
                                    <div className={`text-lg font-bold ${heuristicColor}`}>
                                        {heuristicStatus}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {heuristicDesc}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t('details')}</div>
                                    <div className="text-lg font-mono">
                                        {ratio.toFixed(2)}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {t('estimated_value')}: {formatNumber(item.value_at_100)} k
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div>
                                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                                    {t('profit')} <span className="normal-case text-[10px] opacity-80">({item.last_coefficient || 100}%)</span>
                                  </div>
                                  <div className={`text-lg font-bold ${profitPotential >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatNumber(profitPotential)} k
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {t('craft_cost')} {formatNumber(item.craft_cost)} k
                                  </div>
                                </div>

                                <div>
                                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t('break_even')}</div>
                                  <div className={`text-lg ${riskColorClass}`}>
                                    {risk.toFixed(2)}%
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Necesario
                                  </div>
                                </div>
                            </>
                        )}
                      </div>
                   </div>
                 );
               })}
             </div>
             
             {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-6">
                    <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1 || calculatingProfit}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        {t('page')} {currentPage} {t('of')} {totalPages}
                    </span>
                    <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages || calculatingProfit}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
             )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
