'use client';
import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, XAxis, YAxis, Tooltip, Line, CartesianGrid } from 'recharts';
import { Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/context/LanguageContext';

interface HistoryData {
  date: string;
  coefficient: number;
}

interface CoefficientHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: number;
  server?: string;
}

const CoefficientHistoryModal: React.FC<CoefficientHistoryModalProps> = ({
  isOpen,
  onClose,
  itemId,
  server = 'Dakal',
}) => {
  const { t } = useLanguage();
  const [history, setHistory] = useState<HistoryData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchHistory = async () => {
        setLoading(true);
        try {
          const response = await fetch(`/api/items/${itemId}/history?server=${server}`);
          const data = await response.json();
          setHistory(data);
        } catch (error) {
          console.error('Failed to fetch coefficient history', error);
        } finally {
          setLoading(false);
        }
      };
      fetchHistory();
    }
  }, [isOpen, itemId, server]);

  if (!isOpen) {
    return null;
  }

  const formattedData = history.map(item => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
  }));

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <Card 
        className="w-full max-w-2xl animate-in fade-in-0 zoom-in-95 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader>
          <CardTitle>{t('coefficient_history_title')}</CardTitle>
        </CardHeader>
        <Button variant="ghost" size="icon" className="absolute top-3 right-3" onClick={onClose}>
            <X className="h-4 w-4" />
        </Button>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : history.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={formattedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="coefficient" stroke="#8884d8" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64">
              <p>No hay datos de historial para este objeto.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CoefficientHistoryModal;
