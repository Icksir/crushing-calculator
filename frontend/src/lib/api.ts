import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '',
});

export interface RunePriceData {
  price: number;
  image_url?: string | null;
  updated_at?: string | null;
}

export const getRunePrices = async (lang: string = "es", server: string = "Dakal") => {
  const res = await api.get<Record<string, RunePriceData>>('/api/prices/runes', {
    params: { lang, server }
  });
  return res.data;
};

export const syncRuneImages = async (server: string = "Dakal") => {
  const res = await api.post('/api/prices/runes/sync-images', {}, { params: { server } });
  return res.data;
};

export const updateRunePrices = async (prices: Record<string, number>, lang: string = "es", server: string = "Dakal") => {
  await api.post('/api/prices/runes', { prices }, { params: { lang, server } });
};

export interface IngredientPriceData {
  price: number;
  updated_at?: string | null;
}

export const getIngredientPrices = async (server: string = "Dakal") => {
  const res = await api.get<Record<number, IngredientPriceData>>('/api/prices/ingredients', { params: { server } });
  return res.data;
};

export const updateIngredientPrices = async (updates: { item_id: number; price: number; name?: string }[], server: string = "Dakal") => {
  await api.post('/api/prices/ingredients', updates, { params: { server } });
};

export const saveItemCoefficient = async (
  itemId: number, 
  coefficient: number, 
  craft_cost: number,
  rune_value: number,
  profit: number,
  lang: string = "es", 
  server: string = "Dakal"
) => {
  await api.post(`/api/items/${itemId}/coefficient`, { 
    coefficient,
    craft_cost,
    rune_value,
    profit
  }, { params: { lang, server } });
};

export const submitPredictionData = async (
  itemId: number, 
  coefficient: number, 
  craft_cost: number,
  rune_value: number,
  profit: number,
  lang: string = "es", 
  server: string = "Dakal"
) => {
  await api.post(`/api/items/${itemId}/prediction`, { 
    coefficient,
    craft_cost,
    rune_value,
    profit
  }, { params: { lang, server } });
};

export const getIngredientsByFilter = async (types: string[], minLevel: number, maxLevel: number, lang: string = "es") => {
  const res = await api.get<Ingredient[]>('/api/items/ingredients/filter', {
    params: {
      types: types.join(','),
      min_level: minLevel,
      max_level: maxLevel,
      lang,
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

export const getBestProfitItems = async (types: string[], minLevel: number, maxLevel: number, minProfit: number = 0, minCraftCost: number = 0, page: number = 1, limit: number = 10, sortBy: string = 'profit', sortOrder: string = 'desc', lang: string = "es", server: string = "Dakal") => {
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
      sort_order: sortOrder,
      lang,
      server,
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
  lang?: string;
  server?: string;
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

export interface StatCatalogEntry {
  canonical: string;
  label: string;
  rune_name: string;
  rune_image?: string;
}

export const getStatCatalog = async (lang: string = "es") => {
  const res = await api.get<StatCatalogEntry[]>('/api/stats/catalog', {
    params: { lang }
  });
  return res.data;
};

export interface MaintenanceResponse {
  active: boolean;
  messages: Record<string, string>;
}

export const searchItems = async (query: string, lang: string = "es") => {
  const response = await api.get<ItemSearchResponse[]>(`/api/items/search?query=${query}&lang=${lang}`);
  return response.data;
};

export const getItemDetails = async (id: number, lang: string = "es", server: string = "Dakal") => {
  const response = await api.get<ItemDetailsResponse>(`/api/items/${id}`, { params: { lang, server } });
  return response.data;
};

export const calculateProfit = async (data: CalculateRequest) => {
  const response = await api.post<CalculateResponse>('/api/calculate', data);
  return response.data;
};

export const getMaintenanceStatus = async (): Promise<MaintenanceResponse> => {
  const res = await api.get('/api/maintenance', {
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
  return res.data;
};

export interface SuggestionComment {
  id: number;
  text: string;
  created_at?: string | null;
}

export interface SuggestionResponse {
  id: number;
  text: string;
  created_at?: string | null;
  likes: number;
  dislikes: number;
  status: string;
  user_vote?: number | null;
  comments: SuggestionComment[];
}

export interface VoteResponse {
  status: string;
  likes: number;
  dislikes: number;
  user_vote?: number | null;
}

export const postSuggestion = async (text: string) => {
  const res = await api.post('/api/suggestions', { text, website: '' });
  return res.data;
};

export const getSuggestions = async (limit: number = 50, offset: number = 0, sort: string = 'newest') => {
  const res = await api.get<SuggestionResponse[]>('/api/suggestions', {
    params: { limit, offset, sort }
  });
  return res.data;
};

export const voteSuggestion = async (id: number, vote: 1 | -1): Promise<VoteResponse> => {
  const res = await api.post(`/api/suggestions/${id}/vote`, { vote });
  return res.data;
};

export const validateAdminKey = async (adminKey: string) => {
  const res = await api.post('/api/suggestions/validate', {}, {
    headers: { 'X-Admin-Key': adminKey }
  });
  return res.data;
};

export const completeSuggestion = async (id: number, adminKey: string) => {
  const res = await api.patch(`/api/suggestions/${id}/complete`, {}, {
    headers: { 'X-Admin-Key': adminKey }
  });
  return res.data;
};

export const dismissSuggestion = async (id: number, adminKey: string) => {
  const res = await api.patch(`/api/suggestions/${id}/dismiss`, {}, {
    headers: { 'X-Admin-Key': adminKey }
  });
  return res.data;
};

export const reopenSuggestion = async (id: number, adminKey: string) => {
  const res = await api.patch(`/api/suggestions/${id}/reopen`, {}, {
    headers: { 'X-Admin-Key': adminKey }
  });
  return res.data;
};

export const deleteSuggestion = async (id: number, adminKey: string) => {
  const res = await api.delete(`/api/suggestions/${id}`, {
    headers: { 'X-Admin-Key': adminKey }
  });
  return res.data;
};

export const addComment = async (id: number, text: string, adminKey: string) => {
  const res = await api.post(`/api/suggestions/${id}/comments`, { text }, {
    headers: { 'X-Admin-Key': adminKey }
  });
  return res.data;
};

export const updateComment = async (suggestionId: number, commentId: number, text: string, adminKey: string) => {
  const res = await api.patch(`/api/suggestions/${suggestionId}/comments/${commentId}`, { text }, {
    headers: { 'X-Admin-Key': adminKey }
  });
  return res.data;
};

export const deleteComment = async (suggestionId: number, commentId: number, adminKey: string) => {
  const res = await api.delete(`/api/suggestions/${suggestionId}/comments/${commentId}`, {
    headers: { 'X-Admin-Key': adminKey }
  });
  return res.data;
};

export const getComments = async (id: number) => {
  const res = await api.get<SuggestionComment[]>(`/api/suggestions/${id}/comments`);
  return res.data;
};
