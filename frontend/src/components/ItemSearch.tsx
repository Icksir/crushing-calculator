'use client';
import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { searchItems, ItemSearchResponse } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Search, Loader2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

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
  const { t, language } = useLanguage();

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
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setLastSelected('');
  }, [language]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length >= 2 && query !== lastSelected) {
        setLoading(true);
        try {
          const data = await searchItems(query, language);
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
  }, [query, lastSelected, language]);

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <Input 
          placeholder={t('search_object')}
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
          className="pl-12 h-12 text-base bg-muted/30 border-input/50 shadow-inner focus:bg-background focus:border-primary/80 transition-all"
        />
        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
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
                    <div className="w-full h-full bg-muted-foreground/20" />
                  )}
                </div>
                <span className="font-medium text-sm">{item.name}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
      
      {isOpen && !loading && query.length >= 2 && results.length === 0 && (
         <Card className="absolute top-full left-0 w-full z-50 mt-2 p-4 bg-popover/95 backdrop-blur-sm shadow-xl border-border/50">
           <p className="text-sm text-muted-foreground text-center">{t('no_results')}</p>
         </Card>
      )}
    </div>
  );
};
