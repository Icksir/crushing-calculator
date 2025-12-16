import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://127.0.0.1:8000', // Backend URL (using IP to avoid localhost IPv6 issues)
});

export interface RunePriceData {
  price: number;
  image_url?: string | null;
  updated_at?: string | null;
}

export const getRunePrices = async () => {
  const res = await api.get<Record<string, RunePriceData>>('/api/prices/runes');
  return res.data;
};

export const syncRuneImages = async () => {
  const res = await api.post('/api/prices/runes/sync-images');
  return res.data;
};

export const updateRunePrices = async (prices: Record<string, number>) => {
  await api.post('/api/prices/runes', { prices });
};

export interface IngredientPriceData {
  price: number;
  updated_at?: string | null;
}

export const getIngredientPrices = async () => {
  const res = await api.get<Record<number, IngredientPriceData>>('/api/prices/ingredients');
  return res.data;
};

export const updateIngredientPrices = async (updates: { item_id: number; price: number; name?: string }[]) => {
  await api.post('/api/prices/ingredients', updates);
};

export const saveItemCoefficient = async (itemId: number, coefficient: number) => {
  await api.post(`/api/items/${itemId}/coefficient`, { coefficient });
};

export const getIngredientsByFilter = async (types: string[], minLevel: number, maxLevel: number) => {
  const res = await api.get<Ingredient[]>('/api/items/ingredients/filter', {
    params: {
      types: types.join(','),
      min_level: minLevel,
      max_level: maxLevel
    }
  });
  return res.data;
};

export interface ProfitItem {
  id: number;
  name: string;
  img: string;
  level: number;
  min_coefficient: number;
  craft_cost: number;
  estimated_rune_value: number;
  value_at_100: number;
  last_coefficient?: number;
}

export interface PaginatedProfitResponse {
  items: ProfitItem[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
}

export const getBestProfitItems = async (types: string[], minLevel: number, maxLevel: number, minProfit: number = 0, minCraftCost: number = 0, page: number = 1, limit: number = 10, sortBy: string = 'profit', sortOrder: string = 'desc') => {
  const res = await api.get<PaginatedProfitResponse>('/api/items/profit/best', {
    params: {
      types: types.join(','),
      min_level: minLevel,
      max_level: maxLevel,
      min_profit: minProfit,
      min_craft_cost: minCraftCost,
      page,
      limit,
      sort_by: sortBy,
      sort_order: sortOrder
    }
  });
  return res.data;
};

export interface ItemStat {
  name: string;
  value: number;
  min: number;
  max: number;
  rune_name?: string;
}

export interface ItemSearchResponse {
  id: number;
  name: string;
  img: string;
  stats: ItemStat[];
  level?: number;
}

export interface Ingredient {
  id: number;
  name: string;
  img: string;
  quantity: number;
}

export interface ItemDetailsResponse {
  id: number;
  name: string;
  img: string;
  level: number;
  stats: ItemStat[];
  recipe: Ingredient[];
  last_coefficient?: number;
  last_coefficient_date?: string | null;
}

export interface CalculateRequest {
  item_level: number;
  stats: ItemStat[];
  coefficient: number;
  item_cost: number;
  rune_prices: Record<string, number>;
}

export interface RuneBreakdown {
  stat: string;
  rune_name: string;
  rune_image?: string;
  weight: number;
  count: number;
  value: number;
  
  focus_rune_name: string;
  focus_image?: string;
  focus_count: number;
  focus_value: number;
  // Helper for UI
  price?: number;
}

export interface CalculateResponse {
  total_estimated_value: number;
  net_profit: number;
  max_focus_profit: number;
  best_focus_stat: string | null;
  breakdown: RuneBreakdown[];
  item_cost: number;
  coefficient: number;
}

export const searchItems = async (query: string) => {
  const response = await api.get<ItemSearchResponse[]>(`/api/items/search?query=${query}`);
  return response.data;
};

export const getItemDetails = async (id: number) => {
  const response = await api.get<ItemDetailsResponse>(`/api/items/${id}`);
  return response.data;
};

export const calculateProfit = async (data: CalculateRequest) => {
  const response = await api.post<CalculateResponse>('/api/calculate', data);
  return response.data;
};
