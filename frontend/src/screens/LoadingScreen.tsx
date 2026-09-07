import React from 'react';
import { Sparkles } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = 'Loading Multi-Agent Simulation Environment...' }) => {
  return (
    <div className="min-h-screen bg-[#EEF1F8] flex items-center justify-center p-6 text-[#14234D]">
      <div
        className="w-full max-w-md rounded-[28px] border p-8 md:p-10 text-center space-y-6 animate-in fade-in duration-300"
        style={{
          background: 'rgba(255,255,255,0.75)',
          borderColor: 'rgba(255,255,255,0.90)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: '0 20px 60px rgba(15,23,42,0.08)',
        }}
      >
        <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg animate-pulse">
          <Sparkles size={30} className="animate-spin" />
        </div>

        <div className="space-y-3">
          <h3 className="text-base font-bold text-[#14234D]">{message}</h3>
          <div className="flex items-center justify-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" />
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]" />
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]" />
          </div>
        </div>

        {/* Pulse Skeleton Mock Cards */}
        <div className="space-y-2.5 pt-2">
          <div className="h-4 bg-slate-200/60 rounded-full w-3/4 mx-auto animate-pulse" />
          <div className="h-3 bg-slate-200/40 rounded-full w-1/2 mx-auto animate-pulse" />
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
