import React from 'react';
import { ThemeConfig, ContractType } from '../types';

interface ConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  tradeDetails: {
    type: ContractType;
    duration: number;
    durationUnit: string;
    amount: number;
    currency: string;
    marketName: string;
  } | null;
  theme: ThemeConfig;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onConfirm, onCancel, tradeDetails, theme }) => {
  if (!isOpen || !tradeDetails) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-sm border-2 rounded-lg p-6 relative flex flex-col gap-4"
        style={{ 
          backgroundColor: '#0a0a14',
          borderColor: theme.primary,
          boxShadow: `0 0 30px ${theme.primary}40`
        }}
      >
        <h3 className="text-xl font-black uppercase tracking-widest text-center" style={{ color: theme.secondary }}>
          Confirm Execution
        </h3>
        
        <div className="bg-white/5 rounded p-4 border border-white/10 flex flex-col gap-2">
           <div className="flex justify-between">
              <span className="text-[10px] uppercase text-gray-500 font-bold">Market</span>
              <span className="text-sm font-bold text-white">{tradeDetails.marketName}</span>
           </div>
           <div className="flex justify-between">
              <span className="text-[10px] uppercase text-gray-500 font-bold">Direction</span>
              <span className={`text-sm font-black uppercase ${tradeDetails.type === 'rise' ? 'text-green-400' : 'text-red-400'}`}>
                {tradeDetails.type}
              </span>
           </div>
           <div className="flex justify-between">
              <span className="text-[10px] uppercase text-gray-500 font-bold">Duration</span>
              <span className="text-sm font-bold text-white">{tradeDetails.duration} {tradeDetails.durationUnit === 't' ? 'Ticks' : tradeDetails.durationUnit === 's' ? 'Seconds' : tradeDetails.durationUnit === 'm' ? 'Minutes' : 'Hours'}</span>
           </div>
           <div className="flex justify-between border-t border-white/10 pt-2 mt-1">
              <span className="text-[10px] uppercase text-gray-500 font-bold">Stake</span>
              <span className="text-sm font-bold text-white">{tradeDetails.amount.toFixed(2)} {tradeDetails.currency}</span>
           </div>
        </div>

        <div className="flex gap-3 mt-2">
          <button 
            onClick={onCancel}
            className="flex-1 py-3 rounded font-black text-xs uppercase bg-gray-800 hover:bg-gray-700 text-gray-300 transition-all border border-transparent hover:border-gray-600"
          >
            Abort
          </button>
          <button 
            onClick={onConfirm}
            className="flex-1 py-3 rounded font-black text-xs uppercase text-black shadow-[0_0_15px_rgba(0,255,234,0.4)] transition-all hover:scale-105 active:scale-95"
            style={{ backgroundColor: theme.primary }}
          >
            Execute Trade
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;