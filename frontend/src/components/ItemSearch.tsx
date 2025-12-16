'use client';
import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { searchItems, ItemSearchResponse } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Search, Loader2 } from 'lucide-react';

interface ItemSearchProps {
  onSelect: (item: ItemSearchResponse) => void;
}

export const ItemSearch: React.FC<ItemSearchProps> = ({ onSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ItemSearchResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [lastSelected, setLastSelected] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length >= 2 && query !== lastSelected) {
        setLoading(true);
        try {
          const data = await searchItems(query);
          setResults(data);
          setIsOpen(true);
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      } else if (query.length < 2) {
        setResults([]);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, lastSelected]);

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <Input 
          placeholder="Buscar objeto (ej: Nidas)..." 
          value={query} 
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value !== lastSelected) {
               setLastSelected(''); 
            }
          }} 
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          className="pl-10 h-10 bg-muted/50 border-transparent focus:bg-background focus:border-primary/50 transition-all shadow-sm"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
      
      {isOpen && results.length > 0 && (
        <Card className="absolute top-full left-0 w-full max-h-[400px] overflow-auto z-50 mt-2 bg-popover/95 backdrop-blur-sm shadow-xl border-border/50 animate-in fade-in zoom-in-95 duration-200">
          <div className="p-1">
            {results.map((item) => (
              <div 
                key={item.id} 
                className="p-2 rounded-md hover:bg-accent hover:text-accent-foreground cursor-pointer flex items-center gap-3 transition-colors group"
                onClick={() => {
                  onSelect(item);
                  setIsOpen(false);
                  setQuery(item.name);
                  setLastSelected(item.name);
                }}
              >
                <div className="relative w-10 h-10 bg-muted rounded-md overflow-hidden border border-border/50 group-hover:border-primary/50 transition-colors">
                  {item.img ? (
                    <Image 
                      src={item.img} 
                      alt={item.name} 
                      fill
                      className="object-contain p-0.5" 
                    />
                  ) : (
                    <div className="w-full h-full bg-muted" />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-sm group-hover:text-primary transition-colors">{item.name}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">ID: {item.id}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
