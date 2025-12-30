import React, { useState, useEffect } from 'react';
import { ThemeConfig, WormPosition, TickData } from '../types';
import { Scene } from '../utils/expertEngine';
import { BORDER_DIGITS } from './constants';
import DigitBorder from './DigitBorder';

interface WormChartProps {
  theme: ThemeConfig;
  position: WormPosition;
  lastTick: TickData | null;
  activeGreenDigit: number | null;
  activeRedDigit: number | null;
  trail: WormPosition[];
  greenFlashCounter: number;
  redFlashCounter: number;
  currentScene: Scene | null;
}

interface Ripple {
  id: number;
  x: number;
  y: number;
  color: string;
}

const WormChart: React.FC<WormChartProps> = ({ 
  theme, 
  position, 
  lastTick, 
  activeGreenDigit,
  activeRedDigit,
  trail, 
  greenFlashCounter, 
  redFlashCounter,
  currentScene
}) => {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  
  // Flash conditions based on counters (independent)
  const isGreenFlashActive = greenFlashCounter >= 1 && greenFlashCounter <= 5;
  const isRedFlashActive = redFlashCounter >= 1 && redFlashCounter <= 5;

  // Effect to spawn ripples on new tick
  useEffect(() => {
    if (!lastTick) return;

    // Semantic colors for rise/fall
    const rippleColor = lastTick.color === 'green' ? '#4ade80' : '#f87171';

    const newRipple: Ripple = {
      id: Date.now(),
      x: position.x,
      y: position.y,
      color: rippleColor
    };

    setRipples(prev => [...prev, newRipple]);

    // Cleanup ripple after animation (1s)
    const timeout = setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 1000);

    return () => clearTimeout(timeout);
  }, [lastTick, position]);

  return (
    <div className="flex-1 w-full max-w-[600px] min-w-[300px] aspect-square relative">
      <style>
        {`
          @keyframes ripple-expand {
            0% { 
              transform: translate(-50%, -50%) scale(0.1); 
              opacity: 1; 
              border-width: 6px;
              box-shadow: 0 0 10px currentColor;
            }
            100% { 
              transform: translate(-50%, -50%) scale(2.5); 
              opacity: 0; 
              border-width: 0px;
              box-shadow: 0 0 0 transparent;
            }
          }
          .animate-ripple {
            animation: ripple-expand 0.8s ease-out forwards;
          }
          @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes scan-line {
            0% { top: 0%; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
          }
        `}
      </style>
      <div 
        className="w-full h-full relative rounded-xl overflow-hidden border-2 transition-all duration-500"
        style={{
          backgroundColor: 'rgba(0,0,20,0.8)',
          borderColor: theme.primary,
          boxShadow: `0 0 30px ${theme.primary}50, inset 0 0 20px ${theme.primary}20`
        }}
      >
        <div 
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
                backgroundImage: `linear-gradient(${theme.primary} 1px, transparent 1px), linear-gradient(90deg, ${theme.primary} 1px, transparent 1px)`,
                backgroundSize: '40px 40px'
            }}
        />

        {/* Top & Left: Green Row */}
        <DigitBorder 
          digits={BORDER_DIGITS.top} 
          position="top" 
          theme={theme} 
          activeDigit={activeGreenDigit} 
          isActiveBorder={isGreenFlashActive && (activeGreenDigit !== null && activeGreenDigit % 2 !== 0)}
        />
        <DigitBorder 
          digits={BORDER_DIGITS.left} 
          position="left" 
          theme={theme} 
          activeDigit={activeGreenDigit} 
          isActiveBorder={isGreenFlashActive && (activeGreenDigit !== null && activeGreenDigit % 2 === 0)}
        />

        {/* Right & Bottom: Red Row */}
        <DigitBorder 
          digits={BORDER_DIGITS.right} 
          position="right" 
          theme={theme} 
          activeDigit={activeRedDigit} 
          isActiveBorder={isRedFlashActive && (activeRedDigit !== null && activeRedDigit % 2 !== 0)}
        />
        <DigitBorder 
          digits={BORDER_DIGITS.bottom} 
          position="bottom" 
          theme={theme} 
          activeDigit={activeRedDigit} 
          isActiveBorder={isRedFlashActive && (activeRedDigit !== null && activeRedDigit % 2 === 0)}
        />

        <div className="absolute inset-0 pointer-events-none">
           {/* Trail Segments */}
           {trail.map((pos, i) => {
             // Determine color based on tick color, defaulting to theme
             let bgColor = i % 2 === 0 ? theme.secondary : theme.primary;
             let boxShadow = 'none';

             if (pos.color === 'green') {
                bgColor = '#4ade80'; // Green-400
                boxShadow = '0 0 8px #4ade80';
             } else if (pos.color === 'red') {
                bgColor = '#f87171'; // Red-400
                boxShadow = '0 0 8px #f87171';
             }
             
             return (
                 <div
                    key={i}
                    className="absolute w-[2%] h-[2%] rounded-full transition-opacity duration-300"
                    style={{
                      left: `${pos.x}%`,
                      top: `${pos.y}%`,
                      backgroundColor: bgColor,
                      opacity: Math.max(0.4, (i / trail.length) * (pos.color ? 1 : 0.7)),
                      transform: 'translate(-50%, -50%)',
                      boxShadow: boxShadow
                    }}
                 />
             );
           })}

           {/* Ripple Effects */}
           {ripples.map(ripple => (
             <div
               key={ripple.id}
               className="absolute rounded-full animate-ripple"
               style={{
                 left: `${ripple.x}%`,
                 top: `${ripple.y}%`,
                 width: '10%',
                 height: '10%',
                 borderColor: ripple.color,
                 color: ripple.color, // used by currentcolor in keyframes
                 borderStyle: 'solid',
                 backgroundColor: `${ripple.color}20`, // Very subtle fill
               }}
             />
           ))}

           {/* Worm Head */}
           <div
              className="absolute w-[3.5%] h-[3.5%] rounded-full z-10 transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1)"
              style={{
                left: `${position.x}%`,
                top: `${position.y}%`,
                background: `radial-gradient(circle at 30% 30%, #ffffff, ${theme.primary})`,
                boxShadow: `0 0 20px ${theme.primary}, 0 0 40px ${theme.secondary}`,
                transform: 'translate(-50%, -50%)'
              }}
           />
        </div>

        {/* HUD & ENTRY DETECTOR OVERLAY */}
        <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
             {/* Scanning Line */}
             <div 
                className="absolute w-full h-[2px] bg-cyan-500/30 shadow-[0_0_10px_#00ffea] z-10" 
                style={{ animation: 'scan-line 3s linear infinite' }}
             />
             
             {/* Target Lock UI */}
             {currentScene && currentScene.confidence > 50 && (
                <div className="absolute inset-0 flex items-center justify-center transition-all duration-500">
                    {/* Rotating Ring */}
                    <div 
                        className={`absolute rounded-full border border-dashed transition-all duration-1000 ${
                            currentScene.confidence > 75 
                                ? (currentScene.decision === 'UP' ? 'border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]' : 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]') 
                                : 'border-cyan-500/20'
                        }`}
                        style={{ 
                            width: currentScene.confidence > 75 ? '40%' : '60%',
                            height: currentScene.confidence > 75 ? '40%' : '60%',
                            animation: 'spin-slow 10s linear infinite'
                        }}
                    />
                    
                    {/* Brackets */}
                    <div 
                        className={`absolute w-[50%] h-[50%] transition-all duration-500 flex justify-between flex-col ${currentScene.confidence > 75 ? 'scale-75 opacity-100' : 'scale-100 opacity-30'}`}
                    >
                         <div className="flex justify-between">
                            <div className={`w-8 h-8 border-t-4 border-l-4 ${currentScene.decision === 'UP' ? 'border-green-500' : (currentScene.decision === 'DOWN' ? 'border-red-500' : 'border-cyan-500')}`} />
                            <div className={`w-8 h-8 border-t-4 border-r-4 ${currentScene.decision === 'UP' ? 'border-green-500' : (currentScene.decision === 'DOWN' ? 'border-red-500' : 'border-cyan-500')}`} />
                         </div>
                         <div className="flex justify-between">
                            <div className={`w-8 h-8 border-b-4 border-l-4 ${currentScene.decision === 'UP' ? 'border-green-500' : (currentScene.decision === 'DOWN' ? 'border-red-500' : 'border-cyan-500')}`} />
                            <div className={`w-8 h-8 border-b-4 border-r-4 ${currentScene.decision === 'UP' ? 'border-green-500' : (currentScene.decision === 'DOWN' ? 'border-red-500' : 'border-cyan-500')}`} />
                         </div>
                    </div>

                    {/* Alert Text */}
                    {currentScene.confidence > 70 && (
                        <div className="absolute mt-[120px] bg-black/80 backdrop-blur-md border border-white/10 px-4 py-2 rounded flex flex-col items-center shadow-2xl animate-bounce">
                             <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Entry Opportunity</span>
                             <span className={`text-sm font-black uppercase ${currentScene.decision === 'UP' ? 'text-green-400' : 'text-red-400'}`}>
                                {currentScene.pattern}
                             </span>
                             <div className="flex gap-1 mt-1">
                                {Array.from({length: 5}).map((_, i) => (
                                    <div key={i} className={`w-3 h-1 rounded-full ${i < (currentScene.confidence / 20) ? (currentScene.decision === 'UP' ? 'bg-green-500' : 'bg-red-500') : 'bg-gray-700'}`} />
                                ))}
                             </div>
                        </div>
                    )}
                </div>
             )}
        </div>
        
        {!lastTick && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-20">
                <div className="text-center">
                    <h1 className="text-2xl font-black mb-2 animate-pulse" style={{ color: theme.primary }}>
                        INITIALIZING LINK...
                    </h1>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest">Waiting for Tick Stream</p>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default WormChart;