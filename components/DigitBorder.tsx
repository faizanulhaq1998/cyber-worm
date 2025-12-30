import React from 'react';
import { ThemeConfig } from '../types';

interface DigitBorderProps {
  digits: number[];
  position: 'top' | 'right' | 'bottom' | 'left';
  theme: ThemeConfig;
  activeDigit: number | null;
  isActiveBorder: boolean;
}

const DigitBorder: React.FC<DigitBorderProps> = ({ digits, position, theme, activeDigit, isActiveBorder }) => {
  const positionClasses = {
    top: 'top-[2%] left-[4%] w-[92%] h-[8%] flex-row',
    bottom: 'bottom-[2%] left-[4%] w-[92%] h-[8%] flex-row',
    left: 'left-[2%] top-[12%] w-[8%] h-[76%] flex-col',
    right: 'right-[2%] top-[12%] w-[8%] h-[76%] flex-col',
  };
  
  const isGreenZone = position === 'top' || position === 'left';
  // Use "Darker" versions for base zone colors
  const zoneColor = isGreenZone ? '#059669' : '#dc2626'; // emerald-600 : red-600
  const dimColor = isGreenZone ? 'rgba(5, 150, 105, 0.2)' : 'rgba(220, 38, 38, 0.2)';

  return (
    <div className={`absolute flex justify-between items-center ${positionClasses[position]}`}>
      {digits.map((digit, idx) => {
        const isHit = activeDigit === digit;
        
        let currentColor = dimColor;
        let textShadow = 'none';
        let scale = 'scale-100';

        if (isActiveBorder && isHit) {
           // Detected Active Trend: White Flash with dark color aura
           currentColor = '#ffffff'; 
           textShadow = `0 0 15px #ffffff, 0 0 30px ${zoneColor}, 0 0 60px ${zoneColor}`;
           scale = 'scale-150 z-20';
        } else if (isHit) {
           // Normal hit (no special flash)
           currentColor = zoneColor;
           textShadow = `0 0 10px ${zoneColor}`;
           scale = 'scale-110';
        }

        return (
          <div
            key={`${position}-${idx}`}
            className={`font-black transition-all duration-150 ${scale}`}
            style={{
              color: currentColor,
              textShadow: textShadow,
              fontSize: 'clamp(1rem, 4vw, 2.5rem)',
            }}
          >
            {digit}
          </div>
        );
      })}
    </div>
  );
};

export default DigitBorder;