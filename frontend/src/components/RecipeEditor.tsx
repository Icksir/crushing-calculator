'use client';
import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Ingredient, getIngredientPrices, updateIngredientPrices } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Coins } from 'lucide-react';

interface RecipeEditorProps {
  recipe: Ingredient[];
  onTotalCostChange: (cost: number) => void;
}

export const RecipeEditor: React.FC<RecipeEditorProps> = ({ recipe, onTotalCostChange }) => {
  const [prices, setPrices] = useState<Record<number, number>>({});
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch prices on mount
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const storedPrices = await getIngredientPrices();
        setPrices(storedPrices);
      } catch (e) {
        console.error("Failed to fetch ingredient prices", e);
      }
    };
    fetchPrices();
  }, []);

  useEffect(() => {
    // Calculate total cost whenever prices change
    let total = 0;
    recipe.forEach(ing => {
      const price = prices[ing.id] || 0;
      total += price * ing.quantity;
    });
    onTotalCostChange(total);
  }, [prices, recipe, onTotalCostChange]);

  const handlePriceChange = (id: number, price: number, name: string) => {
    const newPrices = { ...prices, [id]: price };
    setPrices(newPrices);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(() => {
      updateIngredientPrices([{ item_id: id, price, name }])
        .catch(e => console.error("Failed to save ingredient price", e));
    }, 1000);
  };

  if (recipe.length === 0) return null;

  const totalCost = Object.entries(prices).reduce((acc, [id, price]) => {
    const ing = recipe.find(i => i.id === Number(id));
    if (!ing) return acc; // Only count ingredients in current recipe
    return acc + (price * ing.quantity);
  }, 0);

  return (
    <Card className="border-none shadow-md bg-card h-full flex flex-col">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Coins className="w-4 h-4 text-yellow-600" />
          Costo de Receta
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 flex flex-col min-h-0">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-3">
            {recipe.map((ing) => (
              <div key={ing.id} className="flex items-center gap-3 group">
                <div className="relative w-8 h-8 flex-shrink-0 bg-muted rounded-md border border-border/50 overflow-hidden">
                   {ing.img && (
                     <Image 
                       src={ing.img} 
                       alt={ing.name} 
                       width={32} 
                       height={32} 
                       className="w-full h-full object-contain p-0.5" 
                     />
                   )}
                   <div className="absolute bottom-0 right-0 bg-black/70 text-white text-[9px] px-1 rounded-tl-sm font-mono">x{ing.quantity}</div>
                </div>
                <div className="flex-grow min-w-0">
                  <div className="text-sm font-medium text-foreground/90 leading-tight line-clamp-2" title={ing.name}>{ing.name}</div>
                </div>
                <div className="w-28 flex-shrink-0">
                  <Input 
                    type="number" 
                    placeholder="Precio Unit." 
                    className="h-8 text-sm text-right px-2 bg-muted/30 border-transparent focus:bg-background focus:border-primary/50 transition-colors no-spinner"
                    value={prices[ing.id] || ''}
                    onChange={(e) => handlePriceChange(ing.id, Number(e.target.value), ing.name)}
                  />
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        <div className="p-4 bg-muted/20 border-t mt-auto">
          <div className="flex justify-between items-center">
            <span className="text-base font-medium text-muted-foreground">Total Estimado</span>
            <span className="font-bold text-xl text-primary">
              {totalCost.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">k</span>
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
