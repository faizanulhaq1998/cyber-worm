
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { THEMES, MARKETS } from './constants';
import { AppStats, TickData, WormPosition, PriceColor, TradeState, ContractType, TradeHistoryItem } from './types';
import { calculateDirection, calculateNextPosition } from './utils/gameLogic';
import { ExpertEngine, Scene } from './utils/expertEngine';
import WormChart from './components/WormChart';
import ControlPanel from './components/ControlPanel';
import { DerivAPI } from './utils/DerivAPI';

const App: React.FC = () => {
  const [themeId] = useState<string>('cyberpunk');
  const [selectedMarket, setSelectedMarket] = useState<string>(MARKETS[0].id);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [apiToken, setApiToken] = useState<string>(() => localStorage.getItem('deriv_api_token') || '');
  const [accountBalance, setAccountBalance] = useState<string>('---');
  const [currency, setCurrency] = useState<string>('USD');
  const [isPaused, setIsPaused] = useState(false);
  
  // Trade Settings
  const [duration, setDuration] = useState<number>(5);
  const [durationUnit, setDurationUnit] = useState<string>('t');
  
  const [autoTradeEnabled, setAutoTradeEnabled] = useState(false);
  const [currentScene, setCurrentScene] = useState<Scene | null>(null);
  const [lastBotTradeTime, setLastBotTradeTime] = useState(0);
  
  const [history, setHistory] = useState<TickData[]>([]);
  const [tradeHistory, setTradeHistory] = useState<TradeHistoryItem[]>([]);
  const [lastTick, setLastTick] = useState<TickData | null>(null);
  
  const [activeGreenDigit, setActiveGreenDigit] = useState<number | null>(null);
  const [activeRedDigit, setActiveRedDigit] = useState<number | null>(null);
  
  const [wormPos, setWormPos] = useState<WormPosition>({ x: 50, y: 50 });
  const [trail, setTrail] = useState<WormPosition[]>([]);
  
  const [greenFlashCounter, setGreenFlashCounter] = useState<number>(0);
  const [redFlashCounter, setRedFlashCounter] = useState<number>(0);
  
  const [trade, setTrade] = useState<TradeState>({
    status: 'idle',
    type: null,
    entryPrice: null,
    ticksLeft: 0,
    result: null,
  });

  const [stats, setStats] = useState<AppStats>({
    totalTicks: 0,
    greenTicks: 0,
    redTicks: 0,
    evenDigits: 0,
    oddDigits: 0,
    profit: 0,
    wins: 0,
    losses: 0
  });

  // Initialize API only once
  const apiRef = useRef<DerivAPI | null>(null);
  if (!apiRef.current) {
    // 1089 is the standard Demo App ID. Users can use their own token with it.
    apiRef.current = new DerivAPI('1089', apiToken);
  }
  
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPriceRef = useRef<number | null>(null);
  const lastGreenDigitRef = useRef<number | null>(null);
  const lastRedDigitRef = useRef<number | null>(null);
  const greenFlashRef = useRef<number>(0);
  const redFlashRef = useRef<number>(0);
  const tradeRef = useRef<TradeState>({
    status: 'idle',
    type: null,
    entryPrice: null,
    ticksLeft: 0,
    result: null,
  });
  
  const engineRef = useRef(new ExpertEngine());
  const theme = THEMES[themeId];

  useEffect(() => {
    localStorage.setItem('deriv_api_token', apiToken);
    if (apiRef.current) {
        apiRef.current.setToken(apiToken);
    }
  }, [apiToken]);

  // Keep Alive / Ping Mechanism
  useEffect(() => {
    const startPing = () => {
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = setInterval(() => {
            if (apiRef.current?.isConnected) {
                apiRef.current.ping();
            }
        }, 14000); 
    };

    if (isConnected) {
        startPing();
    } else {
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
    }

    return () => {
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
    };
  }, [isConnected]);

  const resetTradeState = useCallback((errorMsg?: string) => {
    if (errorMsg) {
      console.warn("Resetting Trade State due to:", errorMsg);
    }
    tradeRef.current = { 
      status: 'idle', 
      type: null, 
      entryPrice: null, 
      ticksLeft: 0, 
      result: errorMsg ? 'loss' : null,
      reqId: undefined
    };
    setTrade({ ...tradeRef.current });
  }, []);

  const handleTradeAction = useCallback((type: ContractType) => {
    const api = apiRef.current;
    if (!api) return;

    // 1. Strict Connection Check
    if (!api.isConnected) {
      console.error("Trade failed: WebSocket is not connected.");
      resetTradeState("Connection Error");
      return;
    }

    // 2. Auth Check
    if (!isAuthorized) {
        console.warn("Trade blocked: Account not authorized");
        return;
    }

    // 3. Busy Check
    if (tradeRef.current.status !== 'idle') {
        console.warn("Trade blocked: Engine busy");
        return;
    }
    
    console.log(`[Trade Engine] Initializing ${type.toUpperCase()} execution...`);
    
    // Generate Request ID
    const reqId = Date.now();

    tradeRef.current = { ...tradeRef.current, status: 'proposing', type, result: 'pending', reqId };
    setTrade({ ...tradeRef.current });

    // New API Call - Passing dynamic duration and unit
    api.proposal(selectedMarket, type, 1, duration, durationUnit);

  }, [isAuthorized, selectedMarket, resetTradeState, duration, durationUnit]);

  const processTick = useCallback((tick: TickData) => {
    if (isPaused) return;

    setLastTick(tick);
    setHistory(prev => [...prev, tick].slice(-20));

    // FEED THE ENGINE: Digits AND Colors now
    engineRef.current.pushTick(tick.lastDigit, tick.color);
    const scene = engineRef.current.analyzeScene();
    setCurrentScene(scene);

    // Digit Flash Detection
    if (tick.color === 'green') {
      setActiveGreenDigit(tick.lastDigit);
      if (lastGreenDigitRef.current !== null && Math.abs(tick.lastDigit - lastGreenDigitRef.current) === 1) greenFlashRef.current = 1;
      else if (greenFlashRef.current > 0) {
        greenFlashRef.current++;
        if (greenFlashRef.current > 5) greenFlashRef.current = 0;
      }
      lastGreenDigitRef.current = tick.lastDigit;
      setGreenFlashCounter(greenFlashRef.current);
    } else {
      setActiveRedDigit(tick.lastDigit);
      if (lastRedDigitRef.current !== null && Math.abs(tick.lastDigit - lastRedDigitRef.current) === 1) redFlashRef.current = 1;
      else if (redFlashRef.current > 0) {
        redFlashRef.current++;
        if (redFlashRef.current > 5) redFlashRef.current = 0;
      }
      lastRedDigitRef.current = tick.lastDigit;
      setRedFlashCounter(redFlashRef.current);
    }

    // Visual Trade Tick Countdown
    if (tradeRef.current.status === 'running' && tradeRef.current.ticksLeft > 0) {
      tradeRef.current.ticksLeft -= 1;
      setTrade({ ...tradeRef.current });
    }

    // --- ADVANCED AUTO TRADE LOGIC ---
    if (autoTradeEnabled && scene && tradeRef.current.status === 'idle' && isAuthorized && isConnected) {
      const now = Date.now();
      
      // Safety Cooldown: 4 seconds
      if (now - lastBotTradeTime > 4000) {
          
          // CONFIDENCE THRESHOLD: Only trade if engine is > 75% sure
          // This filters out weak signals and simple parity noise
          if (scene.decision && scene.confidence >= 75) {
            
            let tradeType: ContractType = 'rise';

            // The Engine now returns the DESIRED direction directly (no longer needs reversal logic in App.tsx)
            // If Engine says UP (because of Oversold), we trade 'rise'
            // If Engine says DOWN (because of Overbought), we trade 'fall'
            
            if (scene.decision === 'UP') {
                tradeType = 'rise'; 
            } else {
                tradeType = 'fall';
            }

            console.log(`[Sniper Bot] Pattern: ${scene.pattern} (${scene.confidence}%) -> Action: ${tradeType.toUpperCase()}`);
            handleTradeAction(tradeType);
            setLastBotTradeTime(now);
          }
      }
    }

    setStats(prev => ({
      ...prev,
      totalTicks: prev.totalTicks + 1,
      greenTicks: prev.greenTicks + (tick.color === 'green' ? 1 : 0),
      redTicks: prev.redTicks + (tick.color === 'red' ? 1 : 0),
      evenDigits: prev.evenDigits + (tick.lastDigit % 2 === 0 ? 1 : 0),
      oddDigits: prev.oddDigits + (tick.lastDigit % 2 !== 0 ? 1 : 0),
    }));

    setWormPos(prevPos => {
      setTrail(prevTrail => [...prevTrail, { ...prevPos, color: tick.color }].slice(-15));
      return calculateNextPosition(prevPos, calculateDirection(tick.lastDigit, tick.color), 8);
    });
  }, [isPaused, autoTradeEnabled, lastBotTradeTime, isAuthorized, isConnected, handleTradeAction]);

  /**
   * WebSocket Message Handler
   */
  useEffect(() => {
    const api = apiRef.current;
    if (!api) return;

    api.onMessage = (data) => {
         // Handle API-level errors
         if (data.error) {
             console.error("Deriv API Error:", data.error.message);
             if (data.msg_type === 'authorize') {
                 setIsAuthorized(false);
                 setAccountBalance('---');
             }
             if (tradeRef.current.status !== 'idle') {
                 if(data.error.code !== 'AlreadySubscribed') {
                     resetTradeState(data.error.message);
                 }
             }
             return;
         }

         const msgType = data.msg_type;

         if (msgType === "authorize") {
             setIsAuthorized(true);
             setAccountBalance(data.authorize.balance);
             setCurrency(data.authorize.currency);
             api.balance(); // Subscribe by default
             api.forget_all_ticks();
             api.ticks_subscribe(selectedMarket);
         }

         if (msgType === "balance") {
             setAccountBalance(data.balance.balance);
             setCurrency(data.balance.currency);
         }

         if (msgType === "tick") {
             const { quote, epoch, id, pip_size } = data.tick;
             const color: PriceColor = (lastPriceRef.current === null || quote >= lastPriceRef.current) ? 'green' : 'red';
             const digits = pip_size || 3;
             const lastDigit = parseInt(quote.toFixed(digits).slice(-1));
             
             lastPriceRef.current = quote;
             processTick({ id, timestamp: epoch * 1000, quote, lastDigit, color, direction: 'right' });
         }

         if (msgType === "proposal") {
             if (tradeRef.current.status === 'proposing') {
                 tradeRef.current.status = 'buying';
                 setTrade({ ...tradeRef.current });
                 api.buy();
             }
         }

         if (msgType === "buy") {
             if (tradeRef.current.status === 'buying') {
                 console.log("[Execution] Purchase confirmed. ID:", data.buy.contract_id);
                 const approximateEntry = lastPriceRef.current || 0;
                 
                 // If unit is ticks, set ticksLeft to duration. Else, set 0 (display logic handles 'LIVE')
                 const startTicks = durationUnit === 't' ? duration : 0;
                 
                 tradeRef.current = { 
                   ...tradeRef.current, 
                   status: 'running', 
                   entryPrice: approximateEntry,
                   ticksLeft: startTicks 
                 };
                 setTrade({ ...tradeRef.current });

                 api.proposal_open_contract(data.buy.contract_id);
             }
         }

         if (msgType === "proposal_open_contract") {
            const contract = data.proposal_open_contract;
            
            if (tradeRef.current.status === 'running' || tradeRef.current.status === 'idle') {
                
                if (contract.entry_spot && !isNaN(contract.entry_spot)) {
                    tradeRef.current.entryPrice = contract.entry_spot;
                }

                if (contract.is_sold) {
                    const profit = contract.profit;
                    const isWin = profit > 0;
                    
                    console.log(`[Trade Complete] Profit: ${profit}, Result: ${isWin ? 'WIN' : 'LOSS'}`);

                    const historyItem: TradeHistoryItem = {
                        id: contract.contract_id || Math.random().toString(),
                        type: tradeRef.current.type || 'rise', 
                        entry: contract.entry_spot || tradeRef.current.entryPrice || 0,
                        exit: contract.exit_tick || 0,
                        result: isWin ? 'win' : 'loss',
                        timestamp: Date.now()
                    };

                    setTradeHistory(prev => [historyItem, ...prev].slice(0, 10));
                    setStats(prev => ({ 
                        ...prev, 
                        profit: prev.profit + profit,
                        wins: prev.wins + (isWin ? 1 : 0),
                        losses: prev.losses + (isWin ? 0 : 1)
                    }));
                    
                    // Refresh balance without re-subscribing
                    api.balance(false);

                    tradeRef.current = { 
                        status: 'idle', 
                        type: null, 
                        entryPrice: null, 
                        ticksLeft: 0, 
                        result: isWin ? 'win' : 'loss' 
                    };
                    setTrade({ ...tradeRef.current });
                }
            }
         }
    };
  }, [processTick, selectedMarket, resetTradeState, duration, durationUnit]);

  const connectDeriv = useCallback(() => {
    const api = apiRef.current;
    if (!api) return;
    
    api.onOpen = () => {
        setIsConnected(true);
        setIsConnecting(false);
        if (api.apiToken && api.apiToken.length > 0) {
            api.authorize();
        } else {
            api.ticks_subscribe(selectedMarket);
        }
    };

    api.onClose = () => {
        setIsConnected(false);
        setIsConnecting(false);
        setIsAuthorized(false);
        setAccountBalance('---');
        setAutoTradeEnabled(false); 
        if (tradeRef.current.status !== 'idle') {
            resetTradeState("Connection lost during trade");
        }
    };

    api.onError = (err) => {
         setIsConnecting(false);
         // Fixed: Log a clear message instead of the raw Event object
         console.error("App: Socket Connection Error.");
         
         if (tradeRef.current.status !== 'idle') {
             resetTradeState("Socket Error");
         }
    };
    
    setIsConnecting(true);
    api.connect();

  }, [selectedMarket, resetTradeState]); 

  const handleConnectionToggle = useCallback(() => {
    if (isConnecting) return; 
    const api = apiRef.current;
    if (isConnected) {
        api?.disconnect();
    } else {
        connectDeriv();
    }
  }, [isConnected, isConnecting, connectDeriv]);

  useEffect(() => {
    const api = apiRef.current;
    if (api && api.isConnected) {
        api.forget_all_ticks();
        api.ticks_subscribe(selectedMarket);
    }
  }, [selectedMarket]);

  return (
    <div className={`min-h-screen w-full flex flex-col items-center py-8 px-4 transition-colors duration-500 ${theme.bg} text-white font-['Orbitron']`}>
      <header className="text-center mb-8 z-10 w-full max-w-4xl flex justify-between items-center">
        <div className="text-left">
          <h1 className="text-3xl md:text-4xl font-black tracking-widest" style={{ color: theme.secondary, textShadow: `0 0 10px ${theme.secondary}` }}>CYBER WORM</h1>
          <p className="text-[10px] tracking-[0.4em] opacity-60 uppercase" style={{ color: theme.primary }}>Trading Protocol v5.0 (Hyper-Trend)</p>
        </div>
        <div className="flex gap-4">
          <div className={`px-4 py-2 border-2 rounded flex flex-col items-center transition-all ${autoTradeEnabled ? 'bg-blue-600/20 border-blue-400' : 'bg-gray-800/40 border-gray-700'}`}>
            <span className="text-[8px] opacity-60 uppercase">Bot Engine</span>
            <span className="text-[10px] font-black">{autoTradeEnabled ? 'SNIPER MODE' : 'STANDBY'}</span>
          </div>
          <div className={`px-4 py-2 border-2 rounded flex flex-col items-center transition-all ${isAuthorized ? 'bg-green-600/20 border-green-500' : 'bg-red-600/20 border-red-500'}`}>
            <span className="text-[8px] opacity-60 uppercase">Auth Status</span>
            <span className="text-[10px] font-black" style={{ color: isAuthorized ? '#4ade80' : '#f87171' }}>{isAuthorized ? 'READY' : 'WAITING'}</span>
          </div>
        </div>
      </header>

      <main className="w-full max-w-[1200px] flex flex-wrap justify-center items-start gap-8 relative z-10">
        <div className="flex flex-col gap-6 w-full lg:w-auto items-center">
          <WormChart theme={theme} position={wormPos} lastTick={lastTick} activeGreenDigit={activeGreenDigit} activeRedDigit={activeRedDigit} trail={trail} greenFlashCounter={greenFlashCounter} redFlashCounter={redFlashCounter} />
          
          <div className="w-full flex flex-col gap-2 min-h-[80px]">
            {trade.status !== 'idle' && (
              <div className="w-full bg-black/90 border-2 rounded-lg p-5 animate-pulse flex justify-between items-center shadow-[0_0_30px_rgba(0,255,234,0.3)]" style={{ borderColor: theme.primary }}>
                <div className="flex flex-col">
                    <span className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-1">Execution Status</span>
                    <span className="text-xl font-black tracking-tighter" style={{ color: theme.secondary }}>{trade.status.toUpperCase()}: {trade.type?.toUpperCase()}</span>
                </div>
                <div className="text-right">
                    <span className="text-[9px] text-gray-500 block uppercase font-black mb-1">Entry / Cycle</span>
                    <div className="flex gap-4 items-end">
                      <span className="text-lg font-black" style={{ color: '#fff' }}>{trade.entryPrice ? trade.entryPrice.toFixed(2) : '---'}</span>
                      <span className="text-2xl font-black leading-none" style={{ color: theme.primary }}>
                          {trade.ticksLeft > 0 ? `T-${trade.ticksLeft}` : (durationUnit === 't' ? 'PROC' : 'LIVE')}
                      </span>
                    </div>
                </div>
              </div>
            )}
            {trade.status === 'idle' && trade.result && (
              <div className={`w-full text-center p-5 rounded-lg font-black text-2xl border-4 shadow-2xl animate-bounce tracking-[0.2em] transition-all duration-300 ${trade.result === 'win' ? 'bg-green-600/90 border-green-400 text-white shadow-green-500/20' : 'bg-red-900/90 border-red-500 text-white shadow-red-500/20'}`}>
                {trade.result === 'win' ? '★ PROFIT SECURED ★' : '⚠ SYSTEM RECOVERY ⚠'}
              </div>
            )}
          </div>
        </div>

        <ControlPanel 
            isConnected={isConnected} 
            isConnecting={isConnecting}
            isAuthorized={isAuthorized}
            isPaused={isPaused} 
            currentScene={currentScene} 
            autoTradeEnabled={autoTradeEnabled} 
            selectedMarket={selectedMarket} 
            stats={stats} 
            lastTick={lastTick} 
            history={history} 
            theme={theme} 
            onToggleConnection={handleConnectionToggle} 
            onTogglePause={() => setIsPaused(!isPaused)} 
            onToggleAutoTrade={() => setAutoTradeEnabled(!autoTradeEnabled)} 
            onMarketChange={setSelectedMarket} 
            onTradeAction={handleTradeAction} 
            tradeDisabled={trade.status !== 'idle' || !isAuthorized || !isConnected} 
            apiToken={apiToken} 
            setApiToken={setApiToken} 
            tradeHistory={tradeHistory}
            accountBalance={accountBalance}
            currency={currency}
            duration={duration}
            setDuration={setDuration}
            durationUnit={durationUnit}
            setDurationUnit={setDurationUnit}
        />
      </main>
      
      <footer className="mt-12 text-[8px] text-gray-700 font-bold tracking-[0.5em] uppercase pointer-events-none">
        Secure Deriv API Stream // Active Node-D7
      </footer>
    </div>
  );
};

export default App;
