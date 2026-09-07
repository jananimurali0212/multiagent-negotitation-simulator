import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Logo } from '../components/Logo';
import { Mail, ArrowLeft, ArrowRight, ShieldAlert, CheckCircle } from 'lucide-react';

const COLORS = {
  primary: '#1E2230',
  secondary: '#C86D51',
  accent: '#3B82F6',
  background: '#EEF1F8',
  surface: '#FFFFFF',
  text: '#0F172A',
  muted: '#64748B',
};

const glassPrimary =
  'border border-white/85 bg-white/[0.70] backdrop-blur-2xl shadow-[0_20px_50px_rgba(15,23,42,0.06)]';

export const ForgotPasswordScreen: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);

  const isValidEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailTouched(true);

    if (!email || !isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        setError(resetError.message || 'Unable to request password recovery. Please try again.');
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      console.warn("Forgot password exception:", err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormInvalid = !email.trim() || !isValidEmail(email);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row items-stretch font-sans animate-in fade-in duration-300">
      
      {/* LEFT BRAND PANEL (Matches Login visual style) */}
      <div className="w-full lg:w-[48%] p-4 lg:p-6 flex flex-col justify-between relative overflow-hidden select-none shrink-0 bg-[#1E2230]">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none"></div>
        <div className="absolute w-[400px] h-[400px] rounded-full bg-[#C86D51]/5 blur-3xl -top-20 -left-20 pointer-events-none animate-pulse"></div>
        <div className="absolute w-[500px] h-[500px] rounded-full bg-[#3B82F6]/5 blur-3xl -bottom-30 -right-20 pointer-events-none"></div>

        <div className="relative z-10 flex items-center gap-3 mt-4 lg:mt-6 px-4 lg:px-6">
          <div className="bg-white p-1.5 rounded-full flex items-center justify-center shadow-md">
            <Logo variant="icon-only" size={24} />
          </div>
          <div className="flex flex-col text-left">
            <h1 className="text-white font-bold uppercase text-[9px] tracking-wider leading-none">
              AI-DRIVEN MULTI-AGENT
            </h1>
            <span className="text-[#C86D51] text-[7px] font-semibold uppercase tracking-wider mt-0.5 leading-none">
              NEGOTIATION TRAINING PLATFORM
            </span>
          </div>
        </div>

        <div className="relative z-10 flex-grow my-8 flex items-center justify-center min-h-[200px] text-center px-8">
          <div className="space-y-4 max-w-sm">
            <h2 className="text-white font-bold text-xl tracking-tight">Security First.</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              We encrypt all communication and strategy configurations. Your private price limits and strategic custom instructions remain strictly confidential.
            </p>
          </div>
        </div>

        <div className="relative z-10 px-6 pb-6 text-center lg:text-left">
          <p className="text-[10px] text-slate-500">
            Powered by Supabase Auth Security System.
          </p>
        </div>
      </div>

      {/* RIGHT EDITORIAL FORM PANEL */}
      <div 
        className="flex-1 flex flex-col justify-center items-center px-6 py-12 relative"
        style={{
          background: 'linear-gradient(135deg, #EEF1F8 0%, #EEF1F8 55%, #F4F6FB 100%)',
        }}
      >
        <div 
          className="w-full max-w-[440px] animate-in fade-in slide-in-from-right-3 duration-300 rounded-[28px] p-8 sm:p-10"
          style={{
            background: 'rgba(255, 255, 255, 0.70)',
            border: '1px solid rgba(255, 255, 255, 0.85)',
            boxShadow: '0 20px 50px rgba(15, 23, 42, 0.06)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
          }}
        >
          <div className="space-y-6">
            {!success ? (
              <>
                <div className="space-y-2 text-left">
                  <h2 className="text-2xl font-bold text-[#1E2230] tracking-tight">
                    Reset your password
                  </h2>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Enter your registered email address and we'll send you a secure password reset link.
                  </p>
                </div>

                {error && (
                  <div className="p-3.5 bg-red-50 border border-red-200/50 text-red-700 text-xs rounded-xl flex items-center gap-2 font-semibold">
                    <ShieldAlert size={14} className="shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleResetRequest} className="space-y-5 text-left">
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Email Address *</span>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 pointer-events-none">
                        <Mail size={14} />
                      </span>
                      <input
                        type="email"
                        value={email}
                        onBlur={() => setEmailTouched(true)}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@company.com"
                        className={`w-full pl-9 pr-3 py-2.5 bg-white/45 border rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                          emailTouched && !isValidEmail(email) ? 'border-red-400 focus:border-red-500 bg-red-50/40' : 'border-white/60 focus:border-blue-500'
                        }`}
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                    {emailTouched && !isValidEmail(email) && (
                      <p className="text-[9px] text-red-500 font-semibold mt-1">Enter a valid email address.</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isFormInvalid || isSubmitting}
                    className={`w-full py-3 text-white font-semibold text-xs uppercase tracking-widest rounded-full transition-all shadow-md mt-2 border-none flex items-center justify-center gap-2 ${
                      isFormInvalid || isSubmitting
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                        : 'bg-[#3B82F6] hover:bg-blue-600 cursor-pointer'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <span>Sending Link...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Reset Link</span>
                        <ArrowRight size={12} strokeWidth={2.5} />
                      </>
                    )}
                  </button>
                </form>

                <div className="text-center pt-2">
                  <button 
                    onClick={() => navigate('/login')}
                    className="font-semibold text-[#3B82F6] hover:underline cursor-pointer bg-transparent border-none flex items-center justify-center gap-1.5 mx-auto text-xs"
                    disabled={isSubmitting}
                  >
                    <ArrowLeft size={12} />
                    Back to Login
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-4 text-center py-4">
                  <div className="mx-auto w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500">
                    <CheckCircle size={28} />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl font-bold text-[#1E2230] tracking-tight">
                      Check your email
                    </h2>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                      We've sent a secure password reset link to <strong className="text-slate-700">{email.trim()}</strong>. Please click the link in the email to proceed.
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5 pt-2">
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full py-2.5 bg-[#3B82F6] hover:bg-blue-600 text-white font-semibold text-xs rounded-xl shadow-sm transition-all border-none cursor-pointer"
                  >
                    Back to Login
                  </button>

                  <button
                    onClick={handleResetRequest}
                    disabled={isSubmitting}
                    className="w-full py-2.5 bg-white border border-gray-250 hover:bg-gray-50 text-slate-700 font-semibold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    {isSubmitting ? 'Sending...' : 'Resend Email'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default ForgotPasswordScreen;
