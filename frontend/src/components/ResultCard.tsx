'use client';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalculateResponse } from '@/lib/api';

interface ResultCardProps {
  result: CalculateResponse | null;
}

export const ResultCard: React.FC<ResultCardProps> = ({ result }) => {
  if (!result) return null;

  const isProfit = result.net_profit > 0;

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Results</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-sm text-gray-500">Total Estimated Value</div>
            <div className="text-xl font-bold">{result.total_estimated_value.toLocaleString()} K</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Net Profit</div>
            <div className={`text-xl font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
              {result.net_profit.toLocaleString()} K
            </div>
          </div>
        </div>
        
        <h4 className="font-semibold mb-2">Rune Breakdown</h4>
        <div className="space-y-1">
          {result.breakdown.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm border-b py-1">
              <span>{item.stat} (x{item.count})</span>
              <span>{item.value.toLocaleString()} K</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
