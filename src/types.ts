export interface Plot {
  id: number;
  cropType: string | null;
  plantedAt: number | null;
  isReady: boolean;
  multiplier: number;
  isFertilized: boolean; // New: Permanent boost
}

export type WeatherType = 'SUNNY' | 'RAINY' | 'STORMY';

export interface GameState {
  coins: number;
  plots: Plot[];
  kangals: number;
  highScore: number;
  weather: WeatherType; // New: Current weather
  hasLightningRod: boolean; // New: Upgrade
  xp: number; // New: Experience points
  level: number; // New: Player level
  stats: {
    totalHarvests: number;
    totalCoinsEarned: number;
  };
  claimedQuests: number[]; // IDs of claimed quests
  lastDailyReward: string | null; // ISO string
}

export interface Crop {
  id: string;
  name: string;
  price: number;
  sellValue: number;
  growTime: number;
  icon: string;
}

export const CROPS: Crop[] = [
  { id: 'wheat', name: 'Buğday', price: 10, sellValue: 25, growTime: 10, icon: '🌾' },
  { id: 'corn', name: 'Mısır', price: 25, sellValue: 60, growTime: 20, icon: '🌽' },
  { id: 'tomato', name: 'Domates', price: 50, sellValue: 130, growTime: 40, icon: '🍅' },
  { id: 'pumpkin', name: 'Kabak', price: 100, sellValue: 300, growTime: 80, icon: '🎃' },
  { id: 'eggplant', name: 'Patlıcan', price: 200, sellValue: 650, growTime: 120, icon: '🍆' },
  { id: 'watermelon', name: 'Karpuz', price: 500, sellValue: 1800, growTime: 240, icon: '🍉' },
  { id: 'sunflower', name: 'Ayçiçeği', price: 1000, sellValue: 4000, growTime: 480, icon: '🌻' },
  { id: 'strawberry', name: 'Çilek', price: 2000, sellValue: 9000, growTime: 600, icon: '🍓' },
  { id: 'lavender', name: 'Lavanta', price: 5000, sellValue: 25000, growTime: 1200, icon: '🪻' },
  { id: 'pineapple', name: 'Ananas', price: 10000, sellValue: 60000, growTime: 2400, icon: '🍍' },
];

export const KANGAL_PRICE = 150;
export const PLOT_PRICE = 500;
export const LUCK_PACK_PRICE = 250;
export const WATERING_PACK_PRICE = 300;
export const BRONZE_PACK_PRICE = 150;
export const GOLD_PACK_PRICE = 1000;
export const LIGHTNING_ROD_PRICE = 2500;
export const FERTILIZER_PRICE = 1500;
