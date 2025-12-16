'use client';
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ControlPanelProps {
  cost: number;
  setCost: (val: number) => void;
  coeff: number;
  setCoeff: (val: number) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ cost, setCost, coeff, setCoeff }) => {
  return (
    <div className="flex gap-4 p-4 border rounded-lg bg-gray-50">
      <div>
        <Label>Item Cost (Kamas)</Label>
        <Input type="number" value={cost} onChange={(e) => setCost(Number(e.target.value))} />
      </div>
      <div>
        <Label>Coefficient (%)</Label>
        <Input type="number" value={coeff} onChange={(e) => setCoeff(Number(e.target.value))} />
      </div>
    </div>
  );
};
