import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, LogIn, Home } from 'lucide-react';

export const AccessDeniedScreen: React.FC = () => {
  const navigate = useNavigate();

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
        <div className="mx-auto w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 shadow-sm">
          <ShieldAlert size={32} />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-wider border border-red-100">
            Error 403
          </span>
          <h2 className="text-xl font-bold text-[#14234D] mt-2">Access Denied</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            You do not have authorized permissions to view this negotiation resource or restricted content.
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3.5 px-6 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-all border-none cursor-pointer flex items-center justify-center gap-2"
          >
            <LogIn size={14} />
            <span>Sign In to Continue</span>
          </button>

          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-3 px-6 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Home size={14} />
            <span>Go to Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccessDeniedScreen;
