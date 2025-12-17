'use client';

import { getRunePrices, RunePriceData } from './api';

let decorativeRunesCache: Record<string, RunePriceData> | null = null;

// Function to get a shuffled subset of an array
const getShuffledSubset = (array: [string, RunePriceData][], size: number) => {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, size);
};

export const getDecorativeRunes = async (): Promise<Record<string, RunePriceData>> => {
  if (decorativeRunesCache) {
    return decorativeRunesCache;
  }

  try {
    // Always fetch the canonical Spanish prices for a consistent decorative set
    const prices = await getRunePrices('es');
    const allRunes = Object.entries(prices).filter(([, data]) => data.image_url);

    if (allRunes.length === 0) {
      console.warn("Decorative runes source is empty or has no images.");
      return {};
    }
    
    // Select a random subset of runes for decoration
    const subsetSize = Math.min(allRunes.length, 28); // Show up to 28 runes
    const selectedRunes = getShuffledSubset(allRunes, subsetSize);

    decorativeRunesCache = Object.fromEntries(selectedRunes);
    return decorativeRunesCache;
  } catch (error) {
    console.error("Failed to fetch decorative runes:", error);
    return {}; // Return empty on error to prevent crashes
  }
};
