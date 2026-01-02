'use client';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { ItemSearch } from '@/components/ItemSearch';
import { RuneTable } from '@/components/RuneTable';
import { RecipeEditor } from '@/components/RecipeEditor';
import { RunePriceProvider, useRunePrices } from '@/context/RunePriceContext';
import { ItemSearchResponse, ItemStat, CalculateResponse, calculateProfit, getItemDetails, Ingredient, saveItemCoefficient, submitPredictionData } from '@/lib/api';
import { formatNumber, formatDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Calculator as CalculatorIcon, Coins, Percent, Save, Loader2, Settings, History } from 'lucide-react';
import { ResourcePriceEditor } from '@/components/ResourcePriceEditor';
import { RunePriceEditor } from '@/components/RunePriceEditor';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useLanguage } from '@/context/LanguageContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import CoefficientHistoryModal from '@/components/modals/CoefficientHistoryModal';
import { WhatsNewBanner } from '@/components/WhatsNewBanner';
import { Footer } from '@/components/Footer';

const SERVERS = [
  'Dakal', 'Brial', 'Draconiros', 'Hell Mina', 'Imagiro', 'Kourial',
  'Mikhal', 'Orukam', 'Rafal', 'Salar', 'Tal Kasha', 'Tylezia'
];

const Calculator = () => {
  const [activeTab, setActiveTab] = useState<'calculator' | 'runes' | 'resources'>('calculator');
  const [selectedItem, setSelectedItem] = useState<ItemSearchResponse | null>(null);
  const [stats, setStats] = useState<ItemStat[]>([]);
  const [recipe, setRecipe] = useState<Ingredient[]>([]);
  const [cost, setCost] = useState<number>(0);
  const [coeff, setCoeff] = useState<number | ''>(100);
  const [lastCoeffDate, setLastCoeffDate] = useState<string | null>(null);
  const [itemLevel, setItemLevel] = useState<number>(200);
  const [displayLevel, setDisplayLevel] = useState<string>("200");
  const [result, setResult] = useState<CalculateResponse | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showTop3, setShowTop3] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [visibleRunes, setVisibleRunes] = useState(7);
  const [isHydrated, setIsHydrated] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [coeffChanged, setCoeffChanged] = useState(false);

  const runesContainerRef = useRef<HTMLDivElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { runePrices, server, setServer } = useRunePrices();
  const { t, language } = useLanguage();
  const prevLanguageRef = useRef(language);
  const lastSavedCoeffRef = useRef<number | ''>(100);
  const lastAutoSentCoeffRef = useRef<string | null>(null);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (coeff !== lastSavedCoeffRef.current) {
      setCoeffChanged(true);
    } else {
      setCoeffChanged(false);
    }
  }, [coeff]);

  const ServerSwitcher = () => {
    if (!isHydrated) {
      return (
        <Button variant="ghost" size="sm" className="gap-2" disabled>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm font-medium">{t('loading')}</span>
        </Button>
      );
    }

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            <span className="text-sm font-medium">{server}</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {SERVERS.map((srv) => (
            <DropdownMenuItem 
              key={srv} 
              onClick={() => setServer(srv)}
              className={server === srv ? 'bg-accent' : ''}
            >
              {srv}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const CombinedSwitcher = () => {
    const pathname = usePathname();
    const router = useRouter();

    const handleLanguageChange = (newLang: string) => {
        if (!pathname) return;
        const segments = pathname.split('/');
        segments[1] = newLang;
        const newPath = segments.join('/');
        router.push(newPath);
    };

    const flags: Record<string, string> = {
        es: '🇪🇸',
        en: '🇬🇧',
        fr: '🇫🇷',
        pt: '🇧🇷',
    };

    if (!isHydrated) {
        return (
            <Button variant="ghost" size="icon" disabled>
                <Loader2 className="h-4 w-4 animate-spin" />
            </Button>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Settings className="h-5 w-5" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem disabled>
                    <span className="text-sm font-medium text-muted-foreground">{t('server')}</span>
                </DropdownMenuItem>
                {SERVERS.map((srv) => (
                    <DropdownMenuItem
                        key={srv}
                        onClick={() => setServer(srv)}
                        className={server === srv ? 'bg-accent' : ''}
                    >
                        {srv}
                    </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled>
                    <span className="text-sm font-medium text-muted-foreground">{t('language')}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleLanguageChange('es')}>
                    <span className="mr-2 text-lg">{flags.es}</span> Español
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleLanguageChange('en')}>
                    <span className="mr-2 text-lg">{flags.en}</span> English
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleLanguageChange('fr')}>
                    <span className="mr-2 text-lg">{flags.fr}</span> Français
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleLanguageChange('pt')}>
                    <span className="mr-2 text-lg">{flags.pt}</span> Português
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
  };

  useEffect(() => {
    if (prevLanguageRef.current !== language) {
      setSelectedItem(null);
      setStats([]);
      setRecipe([]);
      setCost(0);
      setCoeff(100);
      setLastCoeffDate(null);
      setItemLevel(200);
      setDisplayLevel("200");
      setResult(null);
      setLoadingDetails(false);
      setIsSaving(false);
      setActiveTab('calculator');
      lastSavedCoeffRef.current = 100;
      setCoeffChanged(false);
      
      prevLanguageRef.current = language;
    }
  }, [language]);

  useEffect(() => {
    // Reset calculator state when server changes
    setSelectedItem(null);
    setStats([]);
    setRecipe([]);
    setCost(0);
    setCoeff(100);
    setLastCoeffDate(null);
    setItemLevel(200);
    setDisplayLevel("200");
    setResult(null);
    setLoadingDetails(false);
    setShowTop3(false);
    setIsSaving(false);
    setActiveTab('calculator');
    lastSavedCoeffRef.current = 100;
    setCoeffChanged(false);
  }, [server]);

  useEffect(() => {
    const calculateVisibleRunes = () => {
      if (runesContainerRef.current) {
        const availableSpace = runesContainerRef.current.offsetWidth;
        const runeSlotWidth = 32 + 12; // 32px for rune, 12px for gap
        const count = Math.floor(availableSpace / runeSlotWidth);
        setVisibleRunes(Math.max(0, count));
      }
    };

    const observer = new ResizeObserver(calculateVisibleRunes);
    const container = runesContainerRef.current;

    if (container) {
      observer.observe(container);
    }

    // Initial calculation after a short delay for rendering
    const timerId = setTimeout(calculateVisibleRunes, 50);

    return () => {
      if (container) {
        observer.unobserve(container);
      }
      clearTimeout(timerId);
    };
  }, [language, runePrices]); // Rerun when language or data changes

  const handleSelect = async (item: ItemSearchResponse) => {
    setActiveTab('calculator');
    setSelectedItem(item);
    setStats(item.stats); 
    setResult(null);
    setRecipe([]);
    setCoeff(''); 
    setLastCoeffDate(null);
    setLoadingDetails(true);
    setDisplayLevel("Cargando...");
    
    // --- NUEVO: Reseteamos la referencia de autoguardado ---
    lastAutoSentCoeffRef.current = null; 
    // ------------------------------------------------------

    try {
      const details = await getItemDetails(item.id, language, server);
      if (details) {
        setItemLevel(details.level);
        setDisplayLevel(details.level.toString());
        if (details.last_coefficient) {
          setCoeff(details.last_coefficient);
          lastSavedCoeffRef.current = details.last_coefficient;
        } else {
          setCoeff(100);
          lastSavedCoeffRef.current = 100;
        }
        setCoeffChanged(false);
        setLastCoeffDate(details.last_coefficient_date ?? null);
        
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
          rune_prices: simpleRunePrices,
          lang: language,
          server: server,
        });
        setResult(res);
      } catch (error) {
        console.error("Calculation failed", error);
      }
    };

    const timer = setTimeout(calculate, 300);
    return () => clearTimeout(timer);
  }, [stats, cost, coeff, runePrices, selectedItem, itemLevel, server]);

  const handleSaveCoefficient = async () => {
    if (!selectedItem || coeff === '') return;
    
    setIsSaving(true);
    try {
      await saveItemCoefficient(
        selectedItem.id, 
        coeff, 
        cost,
        liveMetrics.totalValue,
        liveMetrics.profit,
        language, 
        server
      );
      setLastCoeffDate(new Date().toISOString());
      lastSavedCoeffRef.current = coeff;
      setCoeffChanged(false);
    } catch (e) {
      console.error("Failed to save coefficient", e);
    } finally {
      setIsSaving(false);
    }
  };

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
    
    // Calculate break-even coefficient based on Value at 100%
    // Use the coefficient from the result to ensure consistency
    const resultCoeffFactor = (result.coefficient || 100) / 100;
    let breakEvenCoeff = 0;

    if (resultCoeffFactor > 0) {
        // Recalculate totals using raw float counts to get precise ValueAt100
        const sinFocusTotalRaw = result.breakdown.reduce((acc, item) => {
            const currentStat = stats.find(s => s.name === item.stat);
            if (currentStat && currentStat.value < 0) return acc;

            const runeName = item.rune_name || currentStat?.rune_name || '';
            const price = runePrices[runeName]?.price || 0;
            return acc + (item.count * price);
        }, 0);

        const maxFocusTotalRaw = result.breakdown.reduce((max, item) => {
            const currentStat = stats.find(s => s.name === item.stat);
            if (currentStat && currentStat.value < 0) return max;

            const runeName = item.rune_name || currentStat?.rune_name || '';
            const price = runePrices[runeName]?.price || 0;
            const val = (item.focus_count || 0) * price;
            return val > max ? val : max;
        }, 0);

        const bestTotalRaw = Math.max(sinFocusTotalRaw, maxFocusTotalRaw);
        const valueAt100 = bestTotalRaw / resultCoeffFactor;
        
        if (valueAt100 > 0) {
            breakEvenCoeff = (cost / valueAt100) * 100;
        }
    }

    return {
      totalValue: bestTotal,
      profit: bestTotal - cost,
      breakEvenCoeff
    };
  }, [result, runePrices, cost, coeff, stats]);

  const handleAutomaticSave = async () => {
    // Validaciones
    if (!selectedItem || coeff === '' || cost <= 0 || isSaving) return;
    
    // Validar que existan métricas calculadas
    if (liveMetrics.totalValue <= 0) return;
    
    // Evitar duplicados (convertimos a String para comparar seguro)
    if (String(coeff) === String(lastAutoSentCoeffRef.current)) return;

    // Determinar el coeficiente a enviar
    let coefficientToSend = Number(coeff);
    // Si el coeficiente es 100 y no ha sido modificado (es el default), usar el break-even
    if (coeff === 100 && !coeffChanged) {
      coefficientToSend = liveMetrics.breakEvenCoeff;
    }

    try {
      await submitPredictionData(
        selectedItem.id, 
        coefficientToSend, 
        cost,
        liveMetrics.totalValue, // Lee directo del estado
        liveMetrics.profit,     // Lee directo del estado
        language,
        server
      );
      
      lastAutoSentCoeffRef.current = String(coeff);
    } catch (e) {
      console.warn("Fallo silencioso en auto-envío", e);
    }
  };

  // --- EFFECT DEL DEBOUNCE (5 SEGUNDOS) ---
  useEffect(() => {
    // Si faltan datos críticos, limpiamos y no hacemos nada
    if (!selectedItem || coeff === '' || isSaving) {
        if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
        return;
    }

    // Limpiar timeout anterior
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Configurar nuevo timeout
    autoSaveTimeoutRef.current = setTimeout(() => {
      handleAutomaticSave(); // <--- CORRECCIÓN: Llamada vacía, sin argumentos
    }, 5000);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
    // Quitamos 'handleAutomaticSave' de las dependencias para evitar re-ejecuciones infinitas si la función no tiene useCallback
  }, [coeff, cost, selectedItem, runePrices, isSaving, liveMetrics, language, server]);

  // Auto-save effect: debounce coefficient changes and submit to prediction dataset
  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      handleAutomaticSave();
    }, 5000); // 5-second debounce

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [coeff, cost, selectedItem, runePrices, isSaving, liveMetrics, language, server, handleAutomaticSave]);

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 flex flex-col font-sans">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto max-w-[1600px] flex h-16 items-center justify-between gap-6 px-4">
          
          <div className="flex items-center gap-8 flex-1 min-w-0">
            {/* Left: Logo */}
            <div className="flex items-center gap-2 font-bold text-xl text-primary flex-shrink-0">
              <Image 
                src="/logo.svg" 
                alt="Kamaskope Logo" 
                width={32} 
                height={32} 
                className="w-8 h-8 object-contain" 
              />
              <span className="hidden sm:inline">Kamaskope</span>
            </div>
            
            {/* Search Bar */}
            <div className="w-full max-w-xl">
                 <ItemSearch onSelect={handleSelect} />
            </div>
          </div>

          {/* Right: Server and Language Switchers */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            <ServerSwitcher />
            <LanguageSwitcher />
          </div>
          <div className="md:hidden">
            <CombinedSwitcher />
          </div>

        </div>
      </header>

      <main className="flex-1 container mx-auto max-w-[1600px] p-4 md:p-8 space-y-8">
        <div className="flex justify-between items-center border-b pb-4 gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex gap-2 overflow-x-auto">
              <Button variant={activeTab === 'calculator' ? 'default' : 'ghost'} onClick={() => setActiveTab('calculator')} className="h-10 flex-shrink-0">{t('calculator')}</Button>
              <Button variant={activeTab === 'runes' ? 'default' : 'ghost'} onClick={() => setActiveTab('runes')} className="h-10 flex-shrink-0">{t('rune_prices')}</Button>
              <Button variant={activeTab === 'resources' ? 'default' : 'ghost'} onClick={() => setActiveTab('resources')} className="h-10 flex-shrink-0">{t('resource_prices')}</Button>
            </div>
          </div>
          <div 
            className="hidden md:flex flex-1 items-center justify-end gap-3 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%)]"
          >
            {Object.entries(runePrices)
              .filter(([name, rune]) => {
                const n = name.toLowerCase();
                return (n.includes('rune') || n.includes('runa')) && rune.image_url;
              })
              // 4. AUMENTA este número. En lugar de calcularlo, pon un fijo alto (ej. 30 o 40).
              // Al tener overflow-hidden, las que sobren simplemente no se verán, pero el espacio estará lleno.
              .slice(0, 30) 
              .map(([name, rune]) => (
                // ... (tu código del item sigue igual)
                <div key={name} className="relative w-8 h-8 opacity-40 hover:opacity-100 transition-opacity cursor-pointer shrink-0" title={name}>
                  <Image src={rune.image_url!} alt="" fill className="object-contain" sizes="32px"/>
                </div>
              ))}
          </div>
        </div>

        {activeTab === 'calculator' && !selectedItem && (
          <div className="mt-6">
            <WhatsNewBanner />
          </div>
        )}

        <div className={activeTab === 'calculator' ? 'block' : 'hidden'}>
          {selectedItem ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Item Header & Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Item Info Card */}
            <Card className="lg:col-span-2 border-none shadow-lg bg-gradient-to-br from-card to-muted/20 relative">
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
                        <Badge variant="secondary" className="w-fit px-3 py-1 text-sm h-fit justify-center shrink-0 whitespace-nowrap">{displayLevel === "Cargando..." ? displayLevel : `${t('level')} ${displayLevel}`}</Badge>
                      </div>
                      <p className="text-muted-foreground max-w-md">
                        {t('page_description')}
                      </p>
                    </div>
                  </div>

                  <div className="w-full md:w-72 bg-muted/30 p-6 md:p-8 border-t md:border-t-0 md:border-l border-border/50 flex flex-col justify-center gap-4">
                    <div className="flex items-center gap-3 bg-background/80 p-3 rounded-lg border shadow-sm">
                      <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-md text-yellow-700 dark:text-yellow-500">
                        <Coins size={20} />
                      </div>
                      <div className="flex flex-col flex-1">
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground">{t('object_cost')}</span>
                        <div className="flex items-center gap-1">
                          <Input 
                            type="number" 
                            value={cost} 
                            min={0}
                            max={10000000}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '') {
                                setCost(0);
                                return;
                              }
                              let num = Number(val);
                              if (isNaN(num)) return;
                              if (num < 0) num = 0;
                              if (num > 10000000) num = 10000000;
                              setCost(num);
                            }}
                            onKeyDown={(e) => {
                              // Block minus sign and disallow non-numeric (except control/navigation keys)
                              const controlKeys = ['Backspace','Delete','Tab','ArrowLeft','ArrowRight','Home','End','Enter'];
                              const isDigit = /^[0-9]$/.test(e.key);
                              const isControl = controlKeys.includes(e.key);
                              // Allow '.' if user enters decimals; block only '-'
                              if (e.key === '-') {
                                e.preventDefault();
                                return;
                              }
                              if (!isDigit && !isControl && e.key !== '.') {
                                e.preventDefault();
                                return;
                              }
                              // Prevent creating a value > 10000000 when typing another digit
                              if (isDigit) {
                                const input = e.currentTarget as HTMLInputElement;
                                const start = input.selectionStart ?? input.value.length;
                                const end = input.selectionEnd ?? input.value.length;
                                const newValStr = input.value.slice(0, start) + e.key + input.value.slice(end);
                                const newNum = Number(newValStr);
                                if (!Number.isNaN(newNum) && newNum > 10000000) {
                                  e.preventDefault();
                                  return;
                                }
                              }
                            }}
                            onPaste={(e) => {
                              const text = e.clipboardData.getData('text');
                              const sanitized = text.replace(/[^0-9.]/g, '');
                              const num = Number(sanitized);
                              if (!Number.isNaN(num)) {
                                e.preventDefault();
                                let clamped = num;
                                if (clamped < 0) clamped = 0;
                                if (clamped > 10000000) clamped = 10000000;
                                setCost(clamped);
                              }
                            }}
                            className="h-8 w-full text-right font-mono text-xl border-none shadow-none focus-visible:ring-0 p-0 pr-2 bg-transparent no-spinner"
                          />
                          <span className="text-base font-bold">K</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-3 bg-background/80 p-3 rounded-lg border shadow-sm">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-md text-blue-700 dark:text-blue-500">
                          <Percent size={20} />
                        </div>
                        <div className="flex flex-col flex-1">
                          <span className="text-[10px] uppercase font-semibold text-muted-foreground">{t('coefficient')}</span>
                          <div className="flex items-center gap-1">
                            <Input 
                              type="number" 
                              value={coeff} 
                              min={0}
                              max={4000}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === '') {
                                  setCoeff('');
                                  return;
                                }
                                let num = Number(val);
                                if (isNaN(num)) return;
                                if (num < 0) num = 0;
                                if (num > 4000) num = 4000;
                                setCoeff(num);
                              }} 
                              onKeyDown={(e) => {
                                // Block minus sign and disallow non-numeric (except control/navigation keys)
                                const controlKeys = ['Backspace','Delete','Tab','ArrowLeft','ArrowRight','Home','End','Enter'];
                                const isDigit = /^[0-9]$/.test(e.key);
                                const isControl = controlKeys.includes(e.key);
                                // Allow '.' if user enters decimals; block only '-'
                                if (e.key === '-') {
                                  e.preventDefault();
                                  return;
                                }
                                if (!isDigit && !isControl && e.key !== '.') {
                                  e.preventDefault();
                                  return;
                                }
                                // Prevent creating a value > 4000 when typing another digit
                                if (isDigit) {
                                  const input = e.currentTarget as HTMLInputElement;
                                  const start = input.selectionStart ?? input.value.length;
                                  const end = input.selectionEnd ?? input.value.length;
                                  const newValStr = input.value.slice(0, start) + e.key + input.value.slice(end);
                                  const newNum = Number(newValStr);
                                  if (!Number.isNaN(newNum) && newNum > 4000) {
                                    e.preventDefault();
                                    return;
                                  }
                                }
                              }}
                              onPaste={(e) => {
                                const text = e.clipboardData.getData('text');
                                const sanitized = text.replace(/[^0-9.]/g, '');
                                const num = Number(sanitized);
                                if (!Number.isNaN(num)) {
                                  e.preventDefault();
                                  let clamped = num;
                                  if (clamped < 0) clamped = 0;
                                  if (clamped > 4000) clamped = 4000;
                                  setCoeff(clamped);
                                }
                              }}
                              className="h-8 w-full text-right font-bold text-xl border-none shadow-none focus-visible:ring-0 p-0 pr-2 bg-transparent no-spinner"
                              placeholder={loadingDetails ? "---" : "100"}
                            />
                            <span className="text-base font-bold">%</span>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className={`h-8 w-8 ml-1 text-muted-foreground hover:text-primary ${coeffChanged ? 'animate-pulse' : ''}`}
                              onClick={handleSaveCoefficient}
                              disabled={isSaving || coeff === ''}
                              title={t('save_coefficient')}
                            >
                              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 ml-1 text-muted-foreground hover:text-primary"
                              onClick={() => setShowHistory(true)}
                              disabled={!selectedItem}
                              title="Ver historial"
                            >
                              <History className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      {lastCoeffDate && (
                        <div className="text-[10px] text-muted-foreground text-right px-1">
                          Actualizado: {formatDate(lastCoeffDate)}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Profit Summary Card */}
              <Card className="border-none shadow-lg bg-card flex flex-col justify-center relative overflow-hidden">
                <div className={`absolute inset-0 opacity-5 ${liveMetrics.profit > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t('estimated_profit_max')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-1">
                    <div className={`text-5xl font-black tracking-tighter ${liveMetrics.profit > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {result ? `${formatNumber(liveMetrics.profit)}` : '---'} <span className="text-xl font-normal text-muted-foreground">k</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t('profit_description')}
                    </p>
                  </div>
                  
                  {result && (
                    <div className="mt-6 space-y-2">
                      <div className="flex justify-between text-base">
                        <span className="text-muted-foreground">{t('max_rune_value')}</span>
                        <span className="font-medium">{formatNumber(liveMetrics.totalValue)} k</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-base">
                        <span className="text-muted-foreground">{t('craft_cost')}</span>
                        <span className="font-medium">{formatNumber(cost)} k</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-base items-center pt-1">
                        <span className="text-muted-foreground">{t('min_coefficient')}:</span>
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
                     {t('loading')}
                   </div>
                ) : (
                   <RecipeEditor recipe={recipe} onTotalCostChange={setCost} />
                )}
              </div>

              {/* Right Column: Rune Table */}
              <div className="xl:col-span-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                   <div>
                     <h2 className="text-2xl font-bold tracking-tight">{t('rune_breakdown')}</h2>
                     <p className="text-muted-foreground text-sm">{t('rune_breakdown_desc')}</p>
                   </div>
                   <div className="flex items-center space-x-2 bg-card p-2 rounded-lg border shadow-sm">
                      <Switch id="show-top-3" checked={showTop3} onCheckedChange={setShowTop3} />
                      <Label htmlFor="show-top-3" className="text-sm font-medium cursor-pointer">Top 3</Label>
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
          <div className="flex flex-col items-center justify-center min-h-[40vh] text-center space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="bg-muted/30 p-8 rounded-full">
              <CalculatorIcon size={64} className="text-muted-foreground/50" />
            </div>
            <div className="max-w-md space-y-2">
              <h2 className="text-3xl font-bold tracking-tight">{t('crushing_calculator_title')}</h2>
              <p className="text-muted-foreground text-lg">
                {t('no_item_found')}
              </p>
            </div>
          </div>
          )}
        </div>

        <div className={activeTab === 'runes' ? 'flex flex-col flex-1' : 'hidden'}>
          <RunePriceEditor />
        </div>
        
        <div className={activeTab === 'resources' ? 'block' : 'hidden'}>
          <div className="space-y-6">
            <ResourcePriceEditor 
              onSelectItem={(item) => {
                setActiveTab('calculator');
                handleSelect({ ...item, stats: [] });
              }} 
            />
          </div>
        </div>
      </main>

      {!selectedItem && <Footer />}

      {selectedItem && (
        <CoefficientHistoryModal
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
          itemId={selectedItem.id}
          server={server}
        />
      )}
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
