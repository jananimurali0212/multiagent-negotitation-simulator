import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

interface NoInternetScreenProps {
  onRetry?: () => void;
}

export const NoInternetScreen: React.FC<NoInternetScreenProps> = ({ onRetry }) => {
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-[#EEF1F8] flex items-center justify-center p-6 text-[#14234D]">
      <div
        className="w-full max-w-md rounded-[28px] border p-8 md:p-10 text-center space-y-6 animate-in fade-in zoom-in-95 duration-300"
        style={{
          background: 'rgba(255,255,255,0.75)',
          borderColor: 'rgba(255,255,255,0.90)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: '0 20px 60px rgba(15,23,42,0.08)',
        }}
      >
        <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 shadow-sm">
          <WifiOff size={32} />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-[#14234D]">No Internet Connection</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Your connection to the network was interrupted. Please check your Wi-Fi or cellular data connection to resume.
          </p>
        </div>

        <div className="pt-2">
          <button
            onClick={handleRetry}
            className="w-full py-3.5 px-6 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-all border-none cursor-pointer flex items-center justify-center gap-2"
          >
            <RefreshCw size={14} />
            <span>Try Reconnecting</span>
          </button>
        </div>

        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
          Automatic reconnection will resume when online
        </p>
      </div>
    </div>
  );
};

export default NoInternetScreen;
