import React from 'react';
import { ThemeConfig, AppStats, TickData, ContractType, TradeHistoryItem, StrategyConfig, PillarConfig } from '../types';
import { MARKETS } from './constants';
import { Scene } from '../utils/expertEngine';

interface ControlPanelProps {
  isConnected: boolean;
  isConnecting: boolean;
  isAuthorized: boolean;
  isPaused: boolean;
  autoTradeEnabled: boolean;
  currentScene: Scene | null;
  selectedMarket: string;
  stats: AppStats;
  lastTick: TickData | null;
  history: TickData[];
  onToggleConnection: () => void;
  onTogglePause: () => void;
  onToggleAutoTrade: () => void;
  onMarketChange: (marketId: string) => void;
  onTradeAction: (type: ContractType) => void;
  theme: ThemeConfig;
  tradeDisabled: boolean;
  apiToken: string;
  setApiToken: (token: string) => void;
  tradeHistory: TradeHistoryItem[];
  accountBalance: string;
  currency: string;
  // New props for duration
  duration: number;
  setDuration: (val: number) => void;
  durationUnit: string;
  setDurationUnit: (val: string) => void;
  // New props for Strategy
  strategy: StrategyConfig;
  setStrategy: (strat: StrategyConfig) => void;
  currentStake: number;
  // Pillar Config
  pillarConfig: PillarConfig;
  setPillarConfig: (cfg: PillarConfig) => void;
  // Sequence Mode
  isSequenceMode: boolean;
  setIsSequenceMode: (enabled: boolean) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  isConnected, isConnecting, isAuthorized, isPaused, autoTradeEnabled, currentScene, selectedMarket, stats, theme, onToggleConnection, onTogglePause, onToggleAutoTrade, onMarketChange, onTradeAction, tradeDisabled, apiToken, setApiToken, tradeHistory, history, accountBalance, currency, duration, setDuration, durationUnit, setDurationUnit, strategy, setStrategy, currentStake, pillarConfig, setPillarConfig, isSequenceMode, setIsSequenceMode
}) => {
  // Calculate Confidence Colors
  const confidence = currentScene?.confidence || 0;
  let confidenceColor = '#4b5563'; // gray-600
  if (confidence > 40) confidenceColor = '#facc15'; // yellow-400
  if (confidence > 85) confidenceColor = '#22c55e'; // green-500

  const handleStrategyChange = (key: keyof StrategyConfig, value: any) => {
      setStrategy({ ...strategy, [key]: value });
  };

  const PillarToggle = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
    <button 
        onClick={isSequenceMode ? undefined : onClick}
        disabled={isSequenceMode}
        className={`flex-1 py-2 px-1 rounded border text-[9px] font-black uppercase transition-all flex flex-col items-center justify-center gap-1 ${active ? 'bg-blue-900/40 border-blue-400 text-blue-200 shadow-[0_0_10px_rgba(59,130,246,0.2)]' : 'bg-gray-900/40 border-gray-700 text-gray-500 hover:bg-gray-800'} ${isSequenceMode ? 'cursor-not-allowed opacity-80' : ''}`}
    >
        <span>{label}</span>
        <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-blue-400 shadow-[0_0_5px_#60a5fa]' : 'bg-gray-600'}`} />
    </button>
  );

  return (
    <div className="flex-1 min-w-[320px] max-w-full lg:max-w-[420px] rounded-xl p-5 border backdrop-blur-md" style={{ backgroundColor: 'rgba(5, 5, 15, 0.95)', borderColor: theme.primary, boxShadow: `0 0 30px ${theme.primary}20` }}>
      {/* API INTERFACE */}
      <div className="mb-6 border-b border-white/5 pb-4">
        <div className="flex justify-between items-center mb-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">
          <span>Deriv Protocol</span>
          <span className={`transition-colors duration-500 ${isConnected ? 'text-green-400' : (isConnecting ? 'text-yellow-400' : 'text-red-500')}`}>
            {isConnected ? 'ONLINE' : (isConnecting ? 'ESTABLISHING...' : 'OFFLINE')}
          </span>
        </div>
        
        {isAuthorized && (
            <div className="mb-4 bg-gray-900/50 rounded p-3 border border-white/10 flex justify-between items-center">
                <div>
                    <div className="text-[8px] text-gray-500 uppercase tracking-widest mb-1">Account Balance</div>
                    <div className="text-xl font-black text-white">{accountBalance} <span className="text-[10px] text-gray-400">{currency}</span></div>
                </div>
                 <div className="text-right">
                    <div className="text-[8px] text-gray-500 uppercase tracking-widest mb-1">Session P/L</div>
                    <div className={`text-xl font-black ${stats.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{stats.profit > 0 ? '+' : ''}{stats.profit.toFixed(2)}</div>
                </div>
            </div>
        )}

        <div className="space-y-3">
          <div className="space-y-1">
             <label className="text-[8px] text-gray-500 font-bold uppercase tracking-wider block">Market</label>
             <select value={selectedMarket} onChange={(e) => onMarketChange(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded px-3 py-2 text-[10px] font-bold focus:outline-none transition-all" style={{ borderColor: theme.primary, color: theme.primary }}>
               {MARKETS.map(m => <option key={m.id} value={m.id} className="bg-black">{m.name}</option>)}
             </select>
          </div>

          <div className="relative pt-1">
            <input 
                type="password" 
                placeholder="ENTER API TOKEN" 
                value={apiToken} 
                onChange={(e) => setApiToken(e.target.value)} 
                className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-[10px] pr-10 focus:border-white/30 transition-all outline-none" 
                style={{ color: theme.primary }} 
                disabled={isConnected || isConnecting}
            />
            <div className={`absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full transition-all duration-300 ${isAuthorized ? 'bg-green-500 animate-pulse shadow-[0_0_10px_#22c55e]' : 'bg-red-500 opacity-50'}`} />
          </div>
          <button 
            onClick={onToggleConnection} 
            disabled={(!isConnected && !apiToken) || isConnecting}
            className={`w-full py-2 rounded font-black text-[10px] shadow-lg transition-all active:scale-95 ${
                isConnected 
                ? 'bg-red-600 hover:bg-red-700' 
                : isConnecting 
                    ? 'bg-yellow-600 cursor-wait opacity-80'
                    : (!apiToken 
                        ? 'bg-gray-700 cursor-not-allowed opacity-50' 
                        : 'bg-blue-600 hover:bg-blue-700'
                      )
            }`}
          >
            {isConnected ? 'TERMINATE UPLINK' : (isConnecting ? 'CONNECTING...' : (apiToken ? 'INITIALIZE CONNECTION' : 'ENTER TOKEN TO CONNECT'))}
          </button>
        </div>
      </div>

      {/* MONEY MANAGEMENT */}
      <div className="mb-6 border-b border-white/5 pb-4">
        <h3 className="text-[10px] font-black tracking-[0.2em] text-gray-500 mb-3 uppercase">Risk Protocol</h3>
        <div className="grid grid-cols-2 gap-2 mb-3">
             <div className="space-y-1">
                <label className="text-[8px] text-gray-500 font-bold uppercase tracking-wider block">Duration</label>
                <div className="flex gap-1">
                    <input 
                        type="number" 
                        value={duration}
                        onChange={(e) => setDuration(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-[60%] bg-black/60 border border-white/10 rounded px-2 py-2 text-[10px] font-bold text-white text-center"
                    />
                    <select 
                        value={durationUnit} 
                        onChange={(e) => setDurationUnit(e.target.value)} 
                        className="w-[40%] bg-black/60 border border-white/10 rounded px-1 py-2 text-[10px] font-bold text-white"
                    >
                        <option value="t">t</option>
                        <option value="s">s</option>
                        <option value="m">m</option>
                    </select>
                </div>
            </div>
            <div className="space-y-1">
                <label className="text-[8px] text-gray-500 font-bold uppercase tracking-wider block">Base Stake</label>
                <input 
                    type="number" 
                    min="0.35"
                    step="0.01"
                    value={strategy.baseStake}
                    onChange={(e) => handleStrategyChange('baseStake', parseFloat(e.target.value))}
                    onBlur={(e) => {
                        const val = parseFloat(e.target.value);
                        if (val < 0.35) handleStrategyChange('baseStake', 0.35);
                    }}
                    className="w-full bg-black/60 border border-white/10 rounded px-3 py-2 text-[10px] font-bold text-white text-center focus:border-blue-500 transition-colors"
                />
            </div>
        </div>

        <div className="bg-gray-900/40 p-3 rounded border border-white/5">
             <div className="flex justify-between items-center mb-2">
                 <label className="text-[9px] font-bold text-gray-400 uppercase">Martingale</label>
                 <button 
                    onClick={() => handleStrategyChange('martingaleEnabled', !strategy.martingaleEnabled)}
                    className={`w-8 h-4 rounded-full relative transition-all ${strategy.martingaleEnabled ? 'bg-blue-500' : 'bg-gray-700'}`}
                 >
                    <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-all ${strategy.martingaleEnabled ? 'left-4.5' : 'left-0.5'}`} />
                 </button>
             </div>
             
             {strategy.martingaleEnabled && (
                 <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-2">
                     <div>
                        <label className="text-[8px] text-gray-500 uppercase block mb-1">Multiplier</label>
                        <input 
                            type="number" 
                            step="0.1"
                            value={strategy.martingaleMultiplier}
                            onChange={(e) => handleStrategyChange('martingaleMultiplier', parseFloat(e.target.value))}
                            className="w-full bg-black border border-white/10 rounded px-2 py-1 text-[10px] text-white"
                        />
                     </div>
                     <div>
                        <label className="text-[8px] text-gray-500 uppercase block mb-1">Max Stake</label>
                         <input 
                            type="number" 
                            value={strategy.maxStake}
                            onChange={(e) => handleStrategyChange('maxStake', parseFloat(e.target.value))}
                            className="w-full bg-black border border-white/10 rounded px-2 py-1 text-[10px] text-white"
                        />
                     </div>
                 </div>
             )}

             <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-white/5">
                <div>
                     <label className="text-[8px] text-gray-500 uppercase block mb-1">Max Loss Streak</label>
                     <input 
                        type="number" 
                        min="1"
                        value={strategy.maxLossStreak}
                        onChange={(e) => handleStrategyChange('maxLossStreak', Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full bg-black border border-white/10 rounded px-2 py-1 text-[10px] text-white"
                     />
                </div>
                 <div className="text-right flex flex-col justify-end">
                     <span className="text-[8px] text-gray-500 uppercase">Next Stake</span>
                     <span className="text-sm font-black text-blue-400">${currentStake.toFixed(2)}</span>
                 </div>
             </div>
        </div>
      </div>

      {/* EXPERT TELEMETRY (HYPER-TREND) */}
      <div className="mb-6 border-b border-white/5 pb-4">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-[10px] font-black tracking-widest text-blue-400 flex items-center gap-2 uppercase">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
              Neural Engine V5.0
            </h3>
            
            {/* Sequence Mode Toggle */}
            <button 
                onClick={() => setIsSequenceMode(!isSequenceMode)}
                className={`text-[8px] font-black uppercase px-2 py-1 rounded border transition-all ${isSequenceMode ? 'bg-purple-600/20 border-purple-500 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.3)] animate-pulse' : 'bg-gray-800 border-gray-600 text-gray-500 hover:text-white'}`}
            >
                {isSequenceMode ? 'Auto-Rotate: ON' : 'Auto-Rotate: OFF'}
            </button>
        </div>

        {/* LOGIC PILLARS TOGGLES */}
        <div className="mb-4">
            <span className="text-[8px] text-gray-500 font-bold uppercase tracking-wider block mb-2 flex justify-between">
                <span>Active Logic Pillars</span>
                {isSequenceMode && <span className="text-purple-400 animate-pulse">ROTATION ACTIVE</span>}
            </span>
            <div className="flex flex-wrap gap-2">
                <PillarToggle label="Cycling" active={pillarConfig.cycling} onClick={() => setPillarConfig({...pillarConfig, cycling: !pillarConfig.cycling})} />
                <PillarToggle label="Pattern" active={pillarConfig.pattern} onClick={() => setPillarConfig({...pillarConfig, pattern: !pillarConfig.pattern})} />
            </div>
        </div>
        
        {/* Signal Confidence Meter */}
        <div className="mb-5">
             <div className="flex justify-between text-[8px] font-black text-gray-400 uppercase mb-1">
                <span>Signal Confidence</span>
                <span style={{ color: confidenceColor }}>{confidence}%</span>
             </div>
             <div className="w-full h-2 bg-gray-900 rounded-full overflow-hidden border border-white/10 relative">
                 <div className="absolute left-[75%] top-0 bottom-0 w-0.5 bg-white/30 z-10" title="Threshold" />
                 <div 
                    className="h-full transition-all duration-500 ease-out" 
                    style={{ 
                        width: `${confidence}%`, 
                        backgroundColor: confidenceColor,
                        boxShadow: `0 0 10px ${confidenceColor}` 
                    }} 
                 />
             </div>
        </div>

        {currentScene && (
          <div className="grid grid-cols-2 gap-3 text-[9px] font-black mb-5">
            <div className="bg-black/40 p-2.5 rounded border border-white/5 flex flex-col items-center justify-center text-center">
              <span className="text-gray-600 mb-1 uppercase text-[7px] tracking-widest">Detected Pattern</span>
              <span className={`uppercase italic text-[10px] ${currentScene.pattern !== 'NEUTRAL' ? 'text-white' : 'text-gray-600'}`}>
                {currentScene.pattern}
              </span>
            </div>
            
            <div className={`p-2.5 rounded border transition-all flex flex-col items-center justify-center ${currentScene.decision ? (currentScene.decision === 'UP' ? 'bg-green-900/20 border-green-500/50 text-green-400' : 'bg-red-900/20 border-red-500/50 text-red-400') : 'bg-gray-900/20 border-gray-700 text-gray-500'}`}>
              <span className="text-gray-600 mb-1 uppercase text-[7px] tracking-widest">Projection</span>
              <span className="text-[12px] font-black tracking-wider">
                {currentScene.decision ? (currentScene.decision === 'UP' ? '▲ CALL' : '▼ PUT') : 'WAIT'}
              </span>
            </div>
          </div>
        )}

        {/* AUTO-TRADE SYSTEM CONTROLS */}
        <div className="bg-black/60 border border-white/10 rounded-lg p-4 flex flex-col gap-4 relative overflow-hidden">
           {/* Animated Background for Active State */}
           {autoTradeEnabled && (
                <div className="absolute inset-0 bg-blue-500/5 animate-pulse pointer-events-none" />
           )}

          <div className="flex items-center justify-between z-10">
            <div className="flex flex-col">
              <span className={`text-[10px] font-black tracking-widest transition-colors ${autoTradeEnabled ? 'text-blue-400' : 'text-gray-500'}`}>
                AUTO-SNIPER BOT
              </span>
              <span className={`text-[7px] font-bold uppercase tracking-widest ${autoTradeEnabled ? 'text-blue-200 animate-pulse' : 'text-gray-600'}`}>
                {autoTradeEnabled ? (isAuthorized ? 'SCANNING MARKETS...' : 'AWAITING AUTH...') : 'SYSTEM STANDBY'}
              </span>
            </div>
            
            {/* Toggle Switch */}
            <button 
                onClick={onToggleAutoTrade} 
                disabled={!isConnected || !isAuthorized}
                className={`w-14 h-7 rounded-full transition-all duration-300 flex items-center relative border ${
                    (!isConnected || !isAuthorized) 
                        ? 'bg-gray-800 border-gray-700 cursor-not-allowed opacity-50' 
                        : autoTradeEnabled 
                            ? 'bg-blue-900/50 border-blue-400 shadow-[0_0_15px_#3b82f6]' 
                            : 'bg-gray-800 border-gray-600 hover:bg-gray-700'
                }`}
            >
              <div 
                className={`w-4 h-4 rounded-full shadow-md transition-all duration-300 absolute ${
                    autoTradeEnabled ? 'left-[calc(100%-1.25rem)] bg-blue-400' : 'left-1 bg-gray-400'
                }`} 
              />
            </button>
          </div>
          
          <div className="flex gap-2 z-10">
            <button 
              onClick={() => onTradeAction('rise')} 
              disabled={tradeDisabled}
              className={`flex-1 py-2 rounded font-black text-[9px] border-2 transition-all active:scale-95 ${tradeDisabled ? 'opacity-20 cursor-not-allowed border-gray-800' : 'bg-green-600/10 border-green-500/40 text-green-500 hover:bg-green-600/20 hover:border-green-400 shadow-[0_0_10px_rgba(34,197,94,0.1)] uppercase'}`}
            >
              Force Rise
            </button>
            <button 
              onClick={() => onTradeAction('fall')} 
              disabled={tradeDisabled}
              className={`flex-1 py-2 rounded font-black text-[9px] border-2 transition-all active:scale-95 ${tradeDisabled ? 'opacity-20 cursor-not-allowed border-gray-800' : 'bg-red-600/10 border-red-500/40 text-red-500 hover:bg-red-600/20 hover:border-red-400 shadow-[0_0_10px_rgba(239,68,68,0.1)] uppercase'}`}
            >
              Force Fall
            </button>
          </div>
        </div>
      </div>

      {/* TRADE LOG */}
      <div>
        <h3 className="text-[10px] font-black text-gray-500 mb-3 uppercase tracking-widest flex justify-between">
          <span>Recent Transmissions</span>
          <span className="opacity-40">{tradeHistory.length}/5</span>
        </h3>
        <div className="space-y-2 h-36 overflow-y-auto pr-1 scrollbar-thin">
          {tradeHistory.map(item => (
            <div key={item.id} className="flex justify-between items-center bg-black/40 p-2.5 rounded border-l-4 transition-all hover:bg-black/60" style={{ borderColor: item.result === 'win' ? '#22c55e' : '#ef4444' }}>
              <div className="flex flex-col">
                  <span className={`font-black text-[10px] ${item.type === 'rise' ? 'text-green-400' : 'text-red-400'}`}>{item.type.toUpperCase()}</span>
                  <span className="text-gray-600 text-[8px] font-bold">{new Date(item.timestamp).toLocaleTimeString()}</span>
              </div>
              <div className="text-right">
                  <span className="block font-black text-white text-[11px]">{item.entry.toFixed(3)}</span>
                  <span className={`font-black uppercase text-[9px] tracking-widest ${item.result === 'win' ? 'text-green-400' : 'text-red-400'}`}>{item.result}</span>
              </div>
            </div>
          ))}
          {tradeHistory.length === 0 && <div className="text-center py-10 text-gray-800 font-black italic text-[9px] border-2 border-dashed border-white/5 rounded-lg uppercase tracking-widest">No telemetry captured</div>}
        </div>
      </div>

      <div className="flex justify-between items-center text-[8px] text-gray-700 mt-5 font-black border-t border-white/5 pt-4">
        <button onClick={onTogglePause} className="hover:text-gray-300 uppercase transition-colors tracking-[0.2em]">{isPaused ? '[ Resume System ]' : '[ Interrupt System ]'}</button>
        <span className="uppercase tracking-[0.3em]">Protocol Alpha // Stable</span>
      </div>
    </div>
  );
};

export default ControlPanel;