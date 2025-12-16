'use client';
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Ingredient, getIngredientsByFilter, getIngredientPrices, updateIngredientPrices, ProfitItem, getBestProfitItems } from '@/lib/api';
import { Loader2, Save, Filter, Calculator, RefreshCw, Ban } from 'lucide-react';
import Image from 'next/image';

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
  const [prices, setPrices] = useState<Record<number, number>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [profitItems, setProfitItems] = useState<ProfitItem[]>([]);
  const [calculatingProfit, setCalculatingProfit] = useState(false);

  // Load initial prices
  useEffect(() => {
    getIngredientPrices().then(setPrices).catch(console.error);
  }, []);

  const handleCalculateProfit = async () => {
    setCalculatingProfit(true);
    try {
      const profession = PROFESSIONS.find(p => p.name === selectedProfession);
      if (!profession) return;
      
      const data = await getBestProfitItems(profession.types, minLevel, maxLevel);
      setProfitItems(data);
    } catch (error) {
      console.error("Failed to calculate profit", error);
    } finally {
      setCalculatingProfit(false);
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
    setPrices(prev => ({ ...prev, [id]: price }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const updates = resources
        .filter(r => prices[r.id] !== undefined)
        .map(r => ({ item_id: r.id, price: prices[r.id], name: r.name }));
      
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
                      <Input 
                        type="number" 
                        placeholder={prices[resource.id] === -1 ? "---" : "0"}
                        className={`text-right h-8 w-24 ${prices[resource.id] === -1 ? 'opacity-50 bg-muted' : ''}`}
                        value={prices[resource.id] === -1 ? '' : (prices[resource.id] || '')}
                        disabled={prices[resource.id] === -1}
                        onChange={e => handlePriceChange(resource.id, Number(e.target.value))}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 shrink-0 ${prices[resource.id] === -1 ? 'text-destructive hover:text-destructive/90 bg-destructive/10' : 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'}`}
                        onClick={() => handlePriceChange(resource.id, prices[resource.id] === -1 ? 0 : -1)}
                        title={prices[resource.id] === -1 ? "Marcar como disponible" : "Marcar como no disponible"}
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
        <Card>
          <CardHeader>
            <CardTitle>Mejores Oportunidades (Top 10)</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
               {profitItems.map(item => (
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
                    <div className="text-right space-y-1">
                      {(() => {
                        const coeff = (item.last_coefficient !== undefined && item.last_coefficient !== null) ? item.last_coefficient : 100;
                        return (
                          <>
                            <div className="flex flex-col items-end">
                              <div className="text-lg font-bold text-green-600">
                                Min: {item.min_coefficient.toFixed(2)}%
                              </div>
                              <div className={`text-sm font-semibold ${coeff >= item.min_coefficient ? 'text-green-500' : 'text-red-500'}`}>Actual: {coeff}%</div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Costo: {item.craft_cost.toLocaleString()} k | Valor Runas ({coeff}%): {Math.floor(item.estimated_rune_value * (coeff / 100)).toLocaleString()} k
                            </div>
                          </>
                        );
                      })()}
                    </div>
                 </div>
               ))}
             </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
