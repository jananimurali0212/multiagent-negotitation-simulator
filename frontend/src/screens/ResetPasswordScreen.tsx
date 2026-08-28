import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Logo } from '../components/Logo';
import { Lock, Eye, EyeOff, ArrowRight, ShieldAlert, CheckCircle } from 'lucide-react';

export const ResetPasswordScreen: React.FC = () => {
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [hasValidSession, setHasValidSession] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);

  // Validate Password helper: min 8 chars, 1 number, 1 special char
  const isValidPassword = (val: string) => {
    if (val.length < 8) return false;
    if (!/\d/.test(val)) return false;
    if (!/[!@#$%^&*(),.?":{}|<>_\-\\\/\[\]]/.test(val)) return false;
    return true;
  };

  useEffect(() => {
    // Check if we have a valid session established by clicking the email link
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session) {
          setHasValidSession(true);
        } else {
          setHasValidSession(false);
        }
      } catch (err) {
        setHasValidSession(false);
      }
    };
    checkSession();
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordTouched(true);
    setConfirmTouched(true);

    if (!password || !isValidPassword(password)) {
      setError('Password must contain at least 8 characters, one number, and one special character.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const { error: resetError } = await supabase.auth.updateUser({
        password: password,
      });

      if (resetError) {
        setError(resetError.message || 'Unable to update password. Please try again.');
      } else {
        setSuccess(true);
        // Clear any temporary state/session
        await supabase.auth.signOut();
      }
    } catch (err: any) {
      console.warn("Reset password exception:", err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormInvalid =
    !password ||
    !confirmPassword ||
    !isValidPassword(password) ||
    password !== confirmPassword;

  if (hasValidSession === false) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center px-6" style={{ background: '#EEF1F8' }}>
        <div 
          className="w-full max-w-md rounded-[28px] p-8 sm:p-10 text-center"
          style={{
            background: 'rgba(255, 255, 255, 0.70)',
            border: '1px solid rgba(255, 255, 255, 0.85)',
            boxShadow: '0 20px 50px rgba(15, 23, 42, 0.06)',
            backdropFilter: 'blur(24px)',
          }}
        >
          <div className="mx-auto mb-4 w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-500">
            <ShieldAlert size={28} />
          </div>
          <h2 className="text-xl font-bold text-[#1E2230] tracking-tight">
            Password reset session expired
          </h2>
          <p className="mt-2 text-xs text-slate-500 leading-relaxed">
            The recovery link is invalid or has expired. Please request a new recovery link to proceed.
          </p>
          <button
            onClick={() => navigate('/forgot-password')}
            className="mt-6 w-full py-3 bg-[#3B82F6] hover:bg-blue-600 text-white font-semibold text-xs uppercase tracking-widest rounded-full transition-all shadow-md border-none cursor-pointer"
          >
            Request New Reset Link
          </button>
        </div>
      </div>
    );
  }

  // Loading state while checking session
  if (hasValidSession === null) {
    return (
      <div className="min-h-screen flex justify-center items-center" style={{ background: '#EEF1F8' }}>
        <div className="flex gap-2 items-center">
          <svg className="animate-spin h-5 w-5 text-[#3B82F6]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm font-semibold text-slate-650">Verifying session...</span>
        </div>
      </div>
    );
  }

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
            <h2 className="text-white font-bold text-xl tracking-tight">New Password.</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Create a strong password containing at least 8 characters, one number, and one special character to ensure account security.
            </p>
          </div>
        </div>

        <div className="relative z-10 px-6 pb-6 text-center lg:text-left">
          <p className="text-[10px] text-slate-500">
            Secure connection established.
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
                    Reset Password
                  </h2>
                  <p className="text-xs text-slate-500">
                    Enter your new secure password below.
                  </p>
                </div>

                {error && (
                  <div className="p-3.5 bg-red-50 border border-red-200/50 text-red-700 text-xs rounded-xl flex items-center gap-2 font-semibold">
                    <ShieldAlert size={14} className="shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleResetPassword} className="space-y-5 text-left">
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">New Password *</span>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 pointer-events-none">
                        <Lock size={14} />
                      </span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onBlur={() => setPasswordTouched(true)}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className={`w-full pl-9 pr-9 py-2.5 bg-white/45 border rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                          passwordTouched && !isValidPassword(password) ? 'border-red-400 focus:border-red-500 bg-red-50/40' : 'border-white/60 focus:border-blue-500'
                        }`}
                        required
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer"
                        disabled={isSubmitting}
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    {passwordTouched && !isValidPassword(password) && (
                      <p className="text-[9px] text-red-500 font-semibold mt-1">Password must contain at least 8 characters, one number, and one special character.</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Confirm Password *</span>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 pointer-events-none">
                        <Lock size={14} />
                      </span>
                      <input
                        type="password"
                        value={confirmPassword}
                        onBlur={() => setConfirmTouched(true)}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className={`w-full pl-9 pr-3 py-2.5 bg-white/45 border rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                          confirmTouched && password !== confirmPassword ? 'border-red-400 focus:border-red-500 bg-red-50/40' : 'border-white/60 focus:border-blue-500'
                        }`}
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                    {confirmTouched && password !== confirmPassword && (
                      <p className="text-[9px] text-red-500 font-semibold mt-1">Passwords do not match.</p>
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
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <span>Update Password</span>
                        <ArrowRight size={12} strokeWidth={2.5} />
                      </>
                    )}
                  </button>
                </form>
              </>
            ) : (
              <>
                <div className="space-y-4 text-center py-4">
                  <div className="mx-auto w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500">
                    <CheckCircle size={28} />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl font-bold text-[#1E2230] tracking-tight">
                      Password updated successfully
                    </h2>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                      Your password has been securely updated. You can now use your new password to sign in to your account.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/login')}
                  className="w-full py-3 bg-[#3B82F6] hover:bg-blue-600 text-white font-semibold text-xs uppercase tracking-widest rounded-full transition-all shadow-md border-none cursor-pointer"
                >
                  Continue to Login
                </button>
              </>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default ResetPasswordScreen;
