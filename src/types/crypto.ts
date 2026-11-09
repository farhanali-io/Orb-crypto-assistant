export type TimeFrame = 'hour' | 'day' | 'week' | 'month' | 'year' | 'day_marketcap';

export type BubbleSizeMode = 'market_cap' | 'volume' | 'performance' | 'equal';

export type Currency = 'USD' | 'EUR' | 'GBP' | 'BTC' | 'ETH';

export type FilterCategory = 'all' | 'favorites' | 'gainers' | 'losers';

export type ViewMode = 'bubbles' | 'split' | 'table';

export type ColorTheme = 'classic' | 'neon';

export interface ThemeColors {
  red: string;
  redCenter: string;
  redGlow: string;
  green: string;
  greenCenter: string;
  greenGlow: string;
  neutral: string;
  neutralCenter: string;
  neutralGlow: string;
}

export const THEME_CONFIGS: Record<ColorTheme, ThemeColors> = {
  classic: {
    red: '#FF2222',
    redCenter: '#1A0000',
    redGlow: '0 0 22px rgba(255,30,30,0.35)',
    green: '#00D97A',
    greenCenter: '#001A0F',
    greenGlow: '0 0 22px rgba(0,217,122,0.35)',
    neutral: '#5A1A1A',
    neutralCenter: '#140606',
    neutralGlow: '0 0 14px rgba(90,26,26,0.3)',
  },
  neon: {
    red: '#FF4D6D',
    redCenter: '#1A0008',
    redGlow: '0 0 22px rgba(255,77,109,0.35)',
    green: '#00FFAA',
    greenCenter: '#001A12',
    greenGlow: '0 0 22px rgba(0,255,170,0.35)',
    neutral: '#5A1A24',
    neutralCenter: '#140608',
    neutralGlow: '0 0 14px rgba(90,26,36,0.3)',
  },
};

export interface CryptoCoin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation?: number | null;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  price_change_percentage_1h_in_currency?: number;
  price_change_percentage_7d_in_currency?: number;
  price_change_percentage_30d_in_currency?: number;
  price_change_percentage_1y_in_currency?: number;
  circulating_supply: number;
  total_supply?: number | null;
  max_supply?: number | null;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  sparkline_in_7d?: {
    price: number[];
  };
  description?: string;
  homepage?: string;
  blockchain_site?: string;
  github?: string;
  twitter_screen_name?: string;
}

export interface MarketGlobalStats {
  totalMarketCap: number;
  totalVolume24h: number;
  btcDominance: number;
  ethDominance: number;
  marketCapChange24h: number;
  activeCryptos: number;
}
