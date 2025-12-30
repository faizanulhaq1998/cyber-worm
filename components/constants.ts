import { ThemeConfig, Market } from '../types';

export const THEMES: Record<string, ThemeConfig> = {
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    primary: '#00ffea',
    secondary: '#ff00ff',
    bg: 'bg-[#0a0a14]',
    panelBg: 'bg-[#0a0a14]/90',
    border: 'border-[#00ffea]',
    digitGlow: true,
  },
  neon: {
    id: 'neon',
    name: 'Futuristic Neon',
    primary: '#00ff88',
    secondary: '#ff0088',
    bg: 'bg-[#000011]',
    panelBg: 'bg-[#00050f]/90',
    border: 'border-[#00ff88]',
    digitGlow: true,
  },
  dark: {
    id: 'dark',
    name: 'Dark Professional',
    primary: '#00d4ff',
    secondary: '#ff6b6b',
    bg: 'bg-[#121212]',
    panelBg: 'bg-[#1e1e1e]/95',
    border: 'border-[#333]',
    digitGlow: false,
  },
};

export const MARKETS: Market[] = [
  { id: 'R_10', name: 'Volatility 10 Index' },
  { id: 'R_25', name: 'Volatility 25 Index' },
  { id: 'R_50', name: 'Volatility 50 Index' },
  { id: 'R_75', name: 'Volatility 75 Index' },
  { id: 'R_100', name: 'Volatility 100 Index' },
  { id: 'stpRNG', name: 'Step Index 100' },
];

export const SPEED_SETTINGS = {
  fast: 300,
  medium: 500,
  slow: 800,
};

export const BORDER_DIGITS = {
  top: [0, 2, 4, 6, 8],    // Even
  right: [1, 3, 5, 7, 9],  // Odd (1 bottom, 9 top)
  bottom: [8, 6, 4, 2, 0], // Even (8 left, 0 right end)
  left: [1, 3, 5, 7, 9],   // Odd (1 top, 9 bottom)
};