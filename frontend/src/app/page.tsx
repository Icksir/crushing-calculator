'use client';
import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { ItemSearch } from '@/components/ItemSearch';
import { RuneTable } from '@/components/RuneTable';
import { RecipeEditor } from '@/components/RecipeEditor';
import { RunePriceProvider, useRunePrices } from '@/context/RunePriceContext';
import { ItemSearchResponse, ItemStat, CalculateResponse, calculateProfit, getItemDetails, Ingredient, saveItemCoefficient } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Calculator as CalculatorIcon, Coins, Percent } from 'lucide-react';
import { ResourcePriceEditor } from '@/components/ResourcePriceEditor';
import { RunePriceEditor } from '@/components/RunePriceEditor';

const Calculator = () => {
  const [activeTab, setActiveTab] = useState<'calculator' | 'runes' | 'resources'>('calculator');
  const [selectedItem, setSelectedItem] = useState<ItemSearchResponse | null>(null);
  const [stats, setStats] = useState<ItemStat[]>([]);
  const [recipe, setRecipe] = useState<Ingredient[]>([]);
  const [cost, setCost] = useState<number>(0);
  const [coeff, setCoeff] = useState<number | ''>(100);
  const [itemLevel, setItemLevel] = useState<number>(200);
  const [result, setResult] = useState<CalculateResponse | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showTop3, setShowTop3] = useState(false);
  
  const { runePrices } = useRunePrices();

  const handleSelect = async (item: ItemSearchResponse) => {
    setSelectedItem(item);
    setStats(item.stats); 
    setResult(null);
    setRecipe([]);
    setCoeff(''); // Reset to empty while loading
    setLoadingDetails(true);
    
    try {
      const details = await getItemDetails(item.id);
      if (details) {
        setItemLevel(details.level);
        if (details.last_coefficient) {
          setCoeff(details.last_coefficient);
        } else {
          setCoeff(100);
        }
        // Fix for unique values where max is missing/zero
        const processedStats = details.stats.map(stat => {
          const max = stat.max || stat.min;
          const min = stat.min;
          return {
            ...stat,
            max: max,
            value: Math.floor((min + max) / 2)
          };
        });
        setStats(processedStats);
        setRecipe(details.recipe);
      }
    } catch (e) {
      console.error("Failed to fetch details", e);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    const calculate = async () => {
      if (!selectedItem || stats.length === 0) return;
      
      try {
        // Transform runePrices to simple Record<string, number> for the backend
        const simpleRunePrices: Record<string, number> = {};
        Object.entries(runePrices).forEach(([key, val]) => {
          simpleRunePrices[key] = val.price;
        });

        const res = await calculateProfit({
          item_level: itemLevel,
          stats,
          coefficient: coeff === '' ? 0 : coeff,
          item_cost: cost,
          rune_prices: simpleRunePrices
        });
        setResult(res);
      } catch (error) {
        console.error("Calculation failed", error);
      }
    };

    const timer = setTimeout(calculate, 300);
    return () => clearTimeout(timer);
  }, [stats, cost, coeff, runePrices, selectedItem, itemLevel]);

  // Save coefficient history
  useEffect(() => {
    if (!selectedItem) return;

    const saveCoeff = async () => {
      try {
        if (coeff !== '') {
          await saveItemCoefficient(selectedItem.id, coeff);
        }
      } catch (e) {
        console.error("Failed to save coefficient", e);
      }
    };

    const timer = setTimeout(saveCoeff, 2000);
    return () => clearTimeout(timer);
  }, [coeff, selectedItem]);

  const liveMetrics = useMemo(() => {
    if (!result?.breakdown) return { totalValue: 0, profit: 0, breakEvenCoeff: 0 };

    const sinFocusTotal = result.breakdown.reduce((acc, item) => {
      const currentStat = stats.find(s => s.name === item.stat);
      if (currentStat && currentStat.value < 0) return acc;

      const runeName = item.rune_name || currentStat?.rune_name || '';
      const price = runePrices[runeName]?.price || 0;
      return acc + Math.floor(item.count * price);
    }, 0);

    const maxFocusTotal = result.breakdown.reduce((max, item) => {
      const currentStat = stats.find(s => s.name === item.stat);
      if (currentStat && currentStat.value < 0) return max;

      const runeName = item.rune_name || currentStat?.rune_name || '';
      const price = runePrices[runeName]?.price || 0;
      const val = Math.floor((item.focus_count || 0) * price);
      return val > max ? val : max;
    }, 0);

    const bestTotal = Math.max(sinFocusTotal, maxFocusTotal);
    
    // Calculate break-even coefficient
    // If current total (at current coeff) is X, then X = BaseValue * (CurrentCoeff/100)
    // BaseValue = X / (CurrentCoeff/100)
    // We want NewTotal = Cost
    // BaseValue * (NewCoeff/100) = Cost
    // (X / (CurrentCoeff/100)) * (NewCoeff/100) = Cost
    // X * NewCoeff / CurrentCoeff = Cost
    // NewCoeff = (Cost * CurrentCoeff) / X
    
    const breakEvenCoeff = bestTotal > 0 ? (cost * (coeff === '' ? 100 : coeff)) / bestTotal : 0;

    return {
      totalValue: bestTotal,
      profit: bestTotal - cost,
      breakEvenCoeff
    };
  }, [result, runePrices, cost, coeff, stats]);

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 flex flex-col font-sans">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto max-w-[1600px] flex h-16 items-center gap-4 px-4">
          <div className="flex items-center gap-2 font-bold text-xl mr-4 text-primary">
            <CalculatorIcon className="w-6 h-6" />
            <span>DofusCrush</span>
          </div>
          <div className="flex-1 max-w-md">
             <ItemSearch onSelect={handleSelect} />
          </div>
          <div className="ml-auto flex items-center gap-4 text-sm text-muted-foreground">
            <span className="hidden sm:inline-block">Dofus 3.4 Calculator</span>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto max-w-[1600px] p-4 md:p-8 space-y-8">
        <div className="flex gap-2 border-b pb-4 overflow-x-auto">
          <Button variant={activeTab === 'calculator' ? 'default' : 'ghost'} onClick={() => setActiveTab('calculator')}>Calculadora</Button>
          <Button variant={activeTab === 'runes' ? 'default' : 'ghost'} onClick={() => setActiveTab('runes')}>Precios Runas</Button>
          <Button variant={activeTab === 'resources' ? 'default' : 'ghost'} onClick={() => setActiveTab('resources')}>Precios Recursos</Button>
        </div>

        <div className={activeTab === 'calculator' ? 'block' : 'hidden'}>
          {selectedItem ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Item Header & Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Item Info Card */}
              <Card className="lg:col-span-2 border-none shadow-lg bg-gradient-to-br from-card to-muted/20 overflow-hidden relative">
                <CardContent className="p-0 flex flex-col md:flex-row relative z-10">
                  <div className="flex-1 p-6 md:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                      <div className="relative bg-card rounded-xl p-2 border shadow-sm">
                        {selectedItem.img ? (
                          <Image 
                            src={selectedItem.img} 
                            alt={selectedItem.name} 
                            width={100} 
                            height={100} 
                            className="object-contain" 
                          />
                        ) : (
                          <div className="w-[100px] h-[100px] bg-muted rounded-md" />
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-1 text-center sm:text-left space-y-2">
                      <div className="flex flex-col sm:flex-row items-center gap-3 justify-center sm:justify-start">
                        <h1 className="text-3xl font-extrabold tracking-tight lg:text-4xl">{selectedItem.name}</h1>
                        <Badge variant="secondary" className="w-fit px-3 py-1 text-sm h-fit justify-center shrink-0 whitespace-nowrap">Nivel {itemLevel}</Badge>
                      </div>
                      <p className="text-muted-foreground max-w-md">
                        Ajusta las estadísticas y el precio para calcular el beneficio de rompimiento.
                      </p>
                    </div>
                  </div>

                  <div className="w-full md:w-72 bg-muted/30 p-6 md:p-8 border-t md:border-t-0 md:border-l border-border/50 flex flex-col justify-center gap-4">
                    <div className="flex items-center gap-3 bg-background/80 p-3 rounded-lg border shadow-sm">
                      <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-md text-yellow-700 dark:text-yellow-500">
                        <Coins size={20} />
                      </div>
                      <div className="flex flex-col flex-1">
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground">Costo Objeto</span>
                        <div className="flex items-center gap-1">
                          <Input 
                            type="number" 
                            value={cost} 
                            onChange={(e) => setCost(Number(e.target.value))} 
                            className="h-8 w-full text-right font-mono text-xl border-none shadow-none focus-visible:ring-0 p-0 bg-transparent no-spinner"
                          />
                          <span className="text-base font-bold">K</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 bg-background/80 p-3 rounded-lg border shadow-sm">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-md text-blue-700 dark:text-blue-500">
                        <Percent size={20} />
                      </div>
                      <div className="flex flex-col flex-1">
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground">Coeficiente</span>
                        <div className="flex items-center gap-1">
                          <Input 
                            type="number" 
                            value={coeff} 
                            onChange={(e) => setCoeff(e.target.value === '' ? '' : Number(e.target.value))} 
                            className="h-8 w-full text-right font-bold text-xl border-none shadow-none focus-visible:ring-0 p-0 bg-transparent no-spinner"
                            placeholder={loadingDetails ? "---" : "100"}
                          />
                          <span className="text-base font-bold">%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Profit Summary Card */}
              <Card className="border-none shadow-lg bg-card flex flex-col justify-center relative overflow-hidden">
                <div className={`absolute inset-0 opacity-5 ${liveMetrics.profit > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Beneficio Estimado (Max)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-1">
                    <div className={`text-5xl font-black tracking-tighter ${liveMetrics.profit > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {result ? `${liveMetrics.profit.toLocaleString()}` : '---'} <span className="text-xl font-normal text-muted-foreground">k</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Mejor escenario (Sin Focus o Con Focus) vs Costo.
                    </p>
                  </div>
                  
                  {result && (
                    <div className="mt-6 space-y-2">
                      <div className="flex justify-between text-base">
                        <span className="text-muted-foreground">Valor Runas (Max):</span>
                        <span className="font-medium">{liveMetrics.totalValue.toLocaleString()} k</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-base">
                        <span className="text-muted-foreground">Costo Craft:</span>
                        <span className="font-medium">{cost.toLocaleString()} k</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-base items-center pt-1">
                        <span className="text-muted-foreground">Coeficiente Mínimo:</span>
                        <span className={`font-bold px-2 py-0.5 rounded ${
                          liveMetrics.breakEvenCoeff <= (coeff === '' ? 0 : coeff) 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {liveMetrics.breakEvenCoeff.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
              {/* Left Column: Recipe */}
              <div className="xl:col-span-1 space-y-6">
                {loadingDetails ? (
                   <div className="flex items-center justify-center p-8 text-muted-foreground">
                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-2"></div>
                     Cargando receta...
                   </div>
                ) : (
                   <RecipeEditor recipe={recipe} onTotalCostChange={setCost} />
                )}
              </div>

              {/* Right Column: Rune Table */}
              <div className="xl:col-span-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                   <div>
                     <h2 className="text-2xl font-bold tracking-tight">Desglose de Runas</h2>
                     <p className="text-muted-foreground text-sm">Ajusta las tiradas para ver el resultado exacto.</p>
                   </div>
                   <div className="flex items-center space-x-2 bg-card p-2 rounded-lg border shadow-sm">
                      <Switch id="show-top-3" checked={showTop3} onCheckedChange={setShowTop3} />
                      <Label htmlFor="show-top-3" className="text-sm font-medium cursor-pointer">Mostrar Top 3</Label>
                   </div>
                </div>
                <RuneTable 
                  stats={stats} 
                  breakdown={result?.breakdown || []} 
                  onStatChange={setStats}
                  showTop3={showTop3}
                />
              </div>
            </div>
          </div>
          ) : (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="bg-muted/30 p-8 rounded-full">
              <CalculatorIcon size={64} className="text-muted-foreground/50" />
            </div>
            <div className="max-w-md space-y-2">
              <h2 className="text-3xl font-bold tracking-tight">Calculadora de Rompimiento</h2>
              <p className="text-muted-foreground text-lg">
                Busca un objeto en la barra superior para comenzar a calcular beneficios, recetas y runas.
              </p>
            </div>
          </div>
          )}
        </div>

        <div className={activeTab === 'runes' ? 'block' : 'hidden'}>
          <RunePriceEditor />
        </div>
        
        <div className={activeTab === 'resources' ? 'block' : 'hidden'}>
          <ResourcePriceEditor 
            onSelectItem={(item) => {
              setActiveTab('calculator');
              handleSelect({ ...item, stats: [] });
            }} 
          />
        </div>
      </main>
    </div>
  );
};

export default function Home() {
  return (
    <RunePriceProvider>
      <Calculator />
    </RunePriceProvider>
  );
}
