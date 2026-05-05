'use client';
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ItemStat } from '@/lib/api';
import { useRunePrices } from '@/context/RunePriceContext';
import { stripLeadingZeros, preventLeadingZeros, selectOnFocusIfZero } from '@/lib/utils';

interface StatEditorProps {
  stats: ItemStat[];
  onChange: (stats: ItemStat[]) => void;
}

export const StatEditor: React.FC<StatEditorProps> = ({ stats, onChange }) => {
  const { runePrices, updatePrice } = useRunePrices();

  const handleStatChange = (index: number, newValue: number) => {
    const newStats = [...stats];
    newStats[index] = { ...newStats[index], value: newValue };
    onChange(newStats);
  };

  return (
    <div className="space-y-4 border p-4 rounded-lg">
      <h3 className="font-bold text-lg">Stats & Rune Prices</h3>
      {stats.length === 0 && <p className="text-gray-500">Select an item to edit stats.</p>}
      {stats.map((stat, index) => (
        <div key={index} className="flex items-center gap-4">
          <Label className="w-32 truncate" title={stat.name}>{stat.name}</Label>
          <div className="flex flex-col">
             <Label className="text-xs text-gray-500">Value</Label>
             <Input 
                type="number" 
                value={stat.value} 
                onChange={(e) => {
                  const stripped = stripLeadingZeros(e.target.value);
                  const num = Number(stripped) || 0;
                  handleStatChange(index, num);
                  // Force DOM correction
                  e.target.value = String(num);
                }}
                onKeyDown={(e) => preventLeadingZeros(e)}
                onFocus={selectOnFocusIfZero}
                onBlur={(e) => {
                  const num = Number(stripLeadingZeros(e.target.value)) || 0;
                  handleStatChange(index, num);
                  e.target.value = String(num);
                }}
                className="w-24"
              />
          </div>
          <div className="flex flex-col">
             <Label className="text-xs text-gray-500">Rune Price</Label>
             <Input 
                type="number" 
                value={runePrices[stat.name]?.price || 0} 
                onChange={(e) => {
                  const stripped = stripLeadingZeros(e.target.value);
                  const num = Number(stripped) || 0;
                  updatePrice(stat.name, num);
                  // Force DOM correction
                  e.target.value = String(num);
                }}
                onKeyDown={(e) => preventLeadingZeros(e)}
                onFocus={selectOnFocusIfZero}
                onBlur={(e) => {
                  const num = Number(stripLeadingZeros(e.target.value)) || 0;
                  updatePrice(stat.name, num);
                  e.target.value = String(num);
                }}
                className="w-24"
                placeholder="Price"
              />
          </div>
        </div>
      ))}
    </div>
  );
};
