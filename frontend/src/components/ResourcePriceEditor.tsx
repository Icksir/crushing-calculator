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

const PROFESSIONS = [
  { name: 'Herrero', types: ['Sword', 'Dagger', 'Hammer', 'Shovel', 'Axe', 'Scythe', 'Pickaxe'] },
  { name: 'Escultor', types: ['Bow', 'Wand', 'Staff'] },
  { name: 'Joyero', types: ['Amulet', 'Ring'] },
  { name: 'Zapatero', types: ['Boots', 'Belt'] },
  { name: 'Sastre', types: ['Hat', 'Cloak', 'Backpack'] },
  { name: 'Fabricante', types: ['Shield', 'Trophy'] },
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

  // Load initial prices
  useEffect(() => {
    getIngredientPrices().then(setPrices).catch(console.error);
  }, []);

  const fetchProfitItems = async (page: number, currentSortBy = sortBy, currentSortOrder = sortOrder) => {
    setCalculatingProfit(true);
    try {
      const profession = PROFESSIONS.find(p => p.name === selectedProfession);
      if (!profession) return;
      
      const data = await getBestProfitItems(profession.types, minLevel, maxLevel, 0, minCostFilter, page, 10, currentSortBy, currentSortOrder);
      setProfitItems(data.items);
      setTotalPages(data.total_pages);
      setCurrentPage(data.page);
      
      // Scroll to results after a short delay to allow rendering
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
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

  const getCacheKey = (prof: string, min: number, max: number) => `resources_cache_${prof}_${min}_${max}`;

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

      const data = await getIngredientsByFilter(profession.types, minLevel, maxLevel);
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
      
      await updateIngredientPrices(updates);
      setHasChanges(false);
    } catch (error) {
      console.error("Failed to save prices", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros de Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <Label>Profesión</Label>
              <select 
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={selectedProfession} 
                onChange={e => setSelectedProfession(e.target.value)}
              >
                {PROFESSIONS.map(p => (
                  <option key={p.name} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Nivel Mínimo</Label>
              <Input 
                type="number" 
                value={minLevel} 
                onChange={e => setMinLevel(Number(e.target.value))}
                min={1} max={200}
              />
            </div>
            <div className="space-y-2">
              <Label>Nivel Máximo</Label>
              <Input 
                type="number" 
                value={maxLevel} 
                onChange={e => setMaxLevel(Number(e.target.value))}
                min={1} max={200}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => handleLoadResources(false)} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Cargar
              </Button>
              <Button onClick={() => handleLoadResources(true)} disabled={loading} variant="outline" size="icon" title="Forzar recarga">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button onClick={handleCalculateProfit} disabled={calculatingProfit} variant="secondary">
                {calculatingProfit ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Calculator className="w-4 h-4 mr-2" />}
                Buscar Oportunidades
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {resources.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recursos ({resources.length})</CardTitle>
            {hasChanges && (
              <Button onClick={handleSave} disabled={loading}>
                <Save className="w-4 h-4 mr-2" />
                Guardar Cambios
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] pr-4">
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
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate" title={resource.name}>{resource.name}</div>
                      <div className="text-xs text-muted-foreground">ID: {resource.id}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <Input 
                                type="number" 
                                placeholder={prices[resource.id]?.price === -1 ? "---" : "0"}
                                className={`text-right h-8 w-24 ${prices[resource.id]?.price === -1 ? 'opacity-50 bg-muted' : ''}`}
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
                        title={prices[resource.id]?.price === -1 ? "Marcar como disponible" : "Marcar como no disponible"}
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

      {profitItems.length > 0 && (
        <Card ref={resultsRef}>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
                <CardTitle>Oportunidades</CardTitle>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Switch id="analysis-mode" checked={showAnalysis} onCheckedChange={setShowAnalysis} />
                      <Label htmlFor="analysis-mode" className="cursor-pointer">Modo Análisis</Label>
                    </div>
                    <div className="flex items-center gap-2">
                        <Label className="whitespace-nowrap">Costo Mínimo:</Label>
                        <Input 
                            type="number" 
                            className="w-32" 
                            value={minCostFilter} 
                            onChange={(e) => setMinCostFilter(Number(e.target.value))}
                            onKeyDown={handleKeyDown}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Label className="whitespace-nowrap text-sm text-muted-foreground">Ordenar por:</Label>
                        <div className="flex items-center gap-2 border rounded-md p-1 bg-muted/20">
                            <Button 
                                variant={sortBy === 'profit' ? 'secondary' : 'ghost'} 
                                size="sm"
                                onClick={() => { setSortBy('profit'); fetchProfitItems(1, 'profit'); }}
                                className="h-7 text-xs"
                            >
                                Profit
                            </Button>
                            <Button 
                                variant={sortBy === 'risk' ? 'secondary' : 'ghost'} 
                                size="sm"
                                onClick={() => { setSortBy('risk'); fetchProfitItems(1, 'risk'); }}
                                className="h-7 text-xs"
                            >
                                Coef. Mínimo
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
                                className="h-7 w-7 p-0"
                                title={sortOrder === 'asc' ? "Ascendente" : "Descendente"}
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
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => onSelectItem?.({ id: item.id, name: item.name, img: item.img })}
                   >
                      <div className="flex items-center gap-4">
                        <div className="relative w-12 h-12 bg-muted rounded-md border overflow-hidden shrink-0">
                          {item.img && <Image src={item.img} alt={item.name} fill className="object-contain p-1" />}
                        </div>
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-muted-foreground">Nivel {item.level}</div>
                        </div>
                      </div>
                      
                      <div className="flex gap-8 text-right">
                        {showAnalysis ? (
                            <div className="flex gap-8">
                                <div>
                                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Gap de Rentabilidad</div>
                                    <div className={`text-lg font-bold ${heuristicColor}`}>
                                        {heuristicStatus}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {heuristicDesc}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Ratio (V100/Costo)</div>
                                    <div className="text-lg font-mono">
                                        {ratio.toFixed(2)}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Runas al 100%: {formatNumber(item.value_at_100)} k
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div>
                                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                                    Profit Potencial <span className="normal-case text-[10px] opacity-80">({item.last_coefficient || 100}%)</span>
                                  </div>
                                  <div className={`text-lg font-bold ${profitPotential >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatNumber(profitPotential)} k
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Costo: {formatNumber(item.craft_cost)} k
                                  </div>
                                </div>

                                <div>
                                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Coef. Mínimo Profit</div>
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
                        Página {currentPage} de {totalPages}
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
