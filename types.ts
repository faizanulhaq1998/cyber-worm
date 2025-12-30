export type Direction = 'up' | 'down' | 'left' | 'right';
export type PriceColor = 'green' | 'red';
export type ContractType = 'rise' | 'fall';

export interface TickData {
  id: string;
  quote: number;
  lastDigit: number;
  color: PriceColor;
  timestamp: number;
  direction: Direction;
}

export interface WormPosition {
  x: number;
  y: number;
  color?: PriceColor;
}

export interface ThemeConfig {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  bg: string;
  panelBg: string;
  border: string;
  digitGlow: boolean;
}

export interface AppStats {
  totalTicks: number;
  greenTicks: number;
  redTicks: number;
  evenDigits: number;
  oddDigits: number;
  profit: number;
  wins: number;
  losses: number;
  consecutiveLosses: number;
}

export interface StrategyConfig {
  baseStake: number;
  martingaleMultiplier: number;
  maxStake: number;
  martingaleEnabled: boolean;
  maxLossStreak: number;
}

export interface PillarConfig {
  cycling: boolean; // New Digit Cycling Logic
  pattern: boolean; // New Pattern Match Logic
}

export interface TradeHistoryItem {
  id: string;
  type: ContractType;
  entry: number;
  exit: number | null;
  result: 'win' | 'loss';
  timestamp: number;
}

export interface TradeState {
  status: 'idle' | 'proposing' | 'buying' | 'running';
  type: ContractType | null;
  entryPrice: number | null;
  ticksLeft: number;
  result: 'win' | 'loss' | 'pending' | null;
  proposalId?: string;
  reqId?: number; // Added for request matching
  pattern?: string; // Tracks the pattern that triggered this trade
}

export interface Market {
  id: string;
  name: string;
}