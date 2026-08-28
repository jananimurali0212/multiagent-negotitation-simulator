import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Home, ArrowLeft } from 'lucide-react';

export const NotFoundScreen: React.FC = () => {
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
        <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
          <Compass size={32} />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider border border-blue-100">
            Error 404
          </span>
          <h2 className="text-xl font-bold text-[#14234D] mt-2">Page Not Found</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            The page or route you are looking for doesn't exist or may have been moved.
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-3.5 px-6 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-all border-none cursor-pointer flex items-center justify-center gap-2"
          >
            <Home size={14} />
            <span>Return to Dashboard</span>
          </button>

          <button
            onClick={() => navigate(-1)}
            className="w-full py-3 px-6 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <ArrowLeft size={14} />
            <span>Go Back</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundScreen;
