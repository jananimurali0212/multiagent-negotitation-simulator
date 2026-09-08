import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Logo } from '../components/Logo';
import { Eye, EyeOff, Mail, Lock, ShieldAlert, User, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const LoginSignupScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useStore();
  
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authVisualStep, setAuthVisualStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setAuthVisualStep((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(timer);
  }, []);
  
  // Login Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginTouched, setLoginTouched] = useState<{ email?: boolean; password?: boolean }>({});

  // Signup Form States
  const [fullName, setFullName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [signupTouched, setSignupTouched] = useState<{ fullName?: boolean; email?: boolean; password?: boolean; confirmPassword?: boolean }>({});

  // Errors and Validations
  const [error, setError] = useState('');
  const [loginValidationErrors, setLoginValidationErrors] = useState<Record<string, string>>({});
  const [signupValidationErrors, setSignupValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'signup') {
      setActiveTab('signup');
    } else {
      setActiveTab('login');
    }
    setError('');
    setLoginTouched({});
    setSignupTouched({});
  }, [searchParams]);

  // Validate Email helper
  const isValidEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());

  // Validate Password helper: min 8 chars, 1 number, 1 special char
  const isValidPassword = (val: string) => {
    if (val.length < 8) return false;
    if (!/\d/.test(val)) return false;
    if (!/[!@#$%^&*(),.?":{}|<>_\-\\\/\[\]]/.test(val)) return false;
    return true;
  };

  // Real-time Login Validation
  useEffect(() => {
    const errors: Record<string, string> = {};
    if (email && !isValidEmail(email)) {
      errors.email = 'Enter a valid email address.';
    }
    if (password && !isValidPassword(password)) {
      errors.password = 'Password must contain at least 8 characters, one number, and one special character.';
    }
    setLoginValidationErrors(errors);
  }, [email, password]);

  // Real-time Signup Validation
  useEffect(() => {
    const errors: Record<string, string> = {};
    if (signupEmail && !isValidEmail(signupEmail)) {
      errors.email = 'Enter a valid email address.';
    }
    if (signupPassword && !isValidPassword(signupPassword)) {
      errors.password = 'Password must contain at least 8 characters, one number, and one special character.';
    }
    if (confirmPassword && signupPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }
    setSignupValidationErrors(errors);
  }, [fullName, signupEmail, signupPassword, confirmPassword]);

  const mapAuthError = (message: string, status?: number) => {
    const msg = message.toLowerCase();
    if (msg.includes('invalid login credentials') || msg.includes('invalid credentials') || msg.includes('invalid_credentials')) {
      return 'Incorrect email or password.';
    }
    if (msg.includes('email not confirmed') || msg.includes('email not verified') || msg.includes('email_not_confirmed') || msg.includes('verify your email')) {
      return 'Please verify your email address before signing in.';
    }
    if (msg.includes('network') || msg.includes('fetch') || msg.includes('connect') || msg.includes('network_error')) {
      return 'Unable to connect to the authentication service.';
    }
    if (msg.includes('profile') || msg.includes('user_profile_not_found')) {
      return 'Your account was authenticated, but your profile could not be loaded.';
    }
    if (msg.includes('auth_failure') || msg.includes('sign you in') || msg.includes('account/authentication failure')) {
      return "We couldn't sign you in. Please check your credentials and try again.";
    }
    return 'Something went wrong. Please try again.';
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginTouched({ email: true, password: true });

    if (!email || !password || !isValidEmail(email) || !isValidPassword(password)) {
      setError('Please provide valid credentials.');
      return;
    }

    setError('');
    setIsSubmitting(true);
    
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        setError(mapAuthError(authError.message, authError.status));
        setIsSubmitting(false);
        return;
      }

      const userEmail = data?.user?.email || email.trim();
      login(userEmail);
      navigate('/dashboard');
    } catch (err: any) {
      console.warn("Auth exception:", err);
      setError(mapAuthError(err.message || 'Unknown authentication error'));
      setIsSubmitting(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupTouched({ fullName: true, email: true, password: true, confirmPassword: true });

    if (!fullName.trim() || !signupEmail.trim() || !signupPassword || !confirmPassword) {
      setError('All fields are required.');
      return;
    }

    if (Object.keys(signupValidationErrors).length > 0) {
      setError('Please resolve all field validation errors before continuing.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: signupEmail.trim(),
        password: signupPassword,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (authError) {
        setError(mapAuthError(authError.message, authError.status));
        setIsSubmitting(false);
        return;
      }

      if (data?.user && !data?.session) {
        setError('Please verify your email address before signing in.');
        switchTab('login');
      } else {
        const userEmail = data?.user?.email || signupEmail.trim();
        login(userEmail);
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.warn("Signup exception:", err);
      setError(mapAuthError(err.message || 'Unknown signup error'));
      setIsSubmitting(false);
    }
  };

  const switchTab = (tab: 'login' | 'signup') => {
    setActiveTab(tab);
    setError('');
    setLoginTouched({});
    setSignupTouched({});
  };

  const isLoginFormInvalid =
    !email.trim() ||
    !password ||
    !isValidEmail(email) ||
    !isValidPassword(password) ||
    Object.keys(loginValidationErrors).length > 0;

  const isSignupFormInvalid =
    !fullName.trim() ||
    !signupEmail.trim() ||
    !signupPassword ||
    !confirmPassword ||
    !isValidEmail(signupEmail) ||
    !isValidPassword(signupPassword) ||
    signupPassword !== confirmPassword ||
    Object.keys(signupValidationErrors).length > 0;

  return (
    <div className="min-h-screen bg-warmpearl flex flex-col lg:flex-row items-stretch font-sans animate-in fade-in duration-300">
      
      {/* LEFT BRAND PANEL */}
      <div className="w-full lg:w-[48%] p-4 lg:p-6 flex flex-col justify-between relative overflow-hidden select-none shrink-0 bg-primary-dark">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none"></div>
        <div className="absolute w-[400px] h-[400px] rounded-full bg-secondary/5 blur-3xl -top-20 -left-20 pointer-events-none animate-pulse"></div>
        <div className="absolute w-[500px] h-[500px] rounded-full bg-accent/5 blur-3xl -bottom-30 -right-20 pointer-events-none"></div>

        <div className="relative z-10 flex items-center gap-3 mt-4 lg:mt-6 px-4 lg:px-6">
          <div className="bg-white p-1.5 rounded-full flex items-center justify-center shadow-md">
            <Logo variant="icon-only" size={24} />
          </div>
          <div className="flex flex-col">
            <h1 className="text-white font-bold uppercase text-[9px] tracking-wider leading-none">
              AI-DRIVEN MULTI-AGENT
            </h1>
            <span className="text-secondary text-[7px] font-semibold uppercase tracking-wider mt-0.5 leading-none">
              NEGOTIATION TRAINING PLATFORM
            </span>
          </div>
        </div>

        <div className="relative z-10 flex-grow my-8 flex items-center justify-center min-h-[300px]">
          <svg className="w-full h-full max-w-lg" viewBox="0 0 400 350" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="200" cy="175" r="130" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="5 5" />
            <circle cx="200" cy="175" r="85" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />

            <path d="M70 90 L200 175" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" strokeDasharray="4 4" />
            <path d="M330 90 L200 175" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" strokeDasharray="4 4" />
            <path d="M70 260 L200 175" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" strokeDasharray="4 4" />
            <path d="M330 260 L200 175" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" strokeDasharray="4 4" />

            {authVisualStep === 0 && (
              <circle r="3.5" fill="#3B82F6" className="shadow-lg">
                <animateMotion dur="2.5s" repeatCount="indefinite" path="M70 90 L200 175 L330 90 L200 175 Z" />
              </circle>
            )}
            {authVisualStep === 1 && (
              <circle r="3.5" fill="#C86D51">
                <animateMotion dur="2.5s" repeatCount="indefinite" path="M330 260 L200 175 L70 260 L200 175 Z" />
              </circle>
            )}
            {authVisualStep >= 2 && (
              <circle r="4" fill="#10B981">
                <animateMotion dur="3.5s" repeatCount="indefinite" path="M200 175 L70 90 L200 175 L330 260 Z" />
              </circle>
            )}

            <g transform="translate(165, 140)">
              <circle cx="35" cy="35" r="32" fill="#1E2230" stroke="#3B82F6" strokeWidth="2.5" className="animate-pulse" />
              <text x="35" y="32" fill="#3B82F6" fontSize="7.5" fontWeight="900" textAnchor="middle" letterSpacing="0.8">ORCHESTRATOR</text>
              <text x="35" y="44" fill="#FFFFFF" fontSize="6.5" fontWeight="700" textAnchor="middle">Turn Director</text>
            </g>

            <g transform="translate(30, 60)">
              <rect x="0" y="0" width="80" height="40" rx="10" fill="#0F172A" stroke="#3B82F6" strokeWidth={authVisualStep === 0 ? 2 : 1} className="transition-all duration-300" />
              <circle cx="15" cy="20" r="3.5" fill="#3B82F6" />
              <text x="26" y="18" fill="#FFFFFF" fontSize="7" fontWeight="bold">Buyer Agent</text>
              <text x="26" y="28" fill="#64748B" fontSize="6">Procurement</text>
            </g>

            <g transform="translate(290, 60)">
              <rect x="0" y="0" width="80" height="40" rx="10" fill="#0F172A" stroke="#C86D51" strokeWidth={authVisualStep === 1 ? 2 : 1} className="transition-all duration-300" />
              <circle cx="15" cy="20" r="3.5" fill="#C86D51" />
              <text x="26" y="18" fill="#FFFFFF" fontSize="7" fontWeight="bold">Vendor Agent</text>
              <text x="26" y="28" fill="#64748B" fontSize="6">Enterprise Sales</text>
            </g>

            <g transform="translate(30, 230)">
              <rect x="0" y="0" width="80" height="40" rx="10" fill="#0F172A" stroke="#3B82F6" strokeWidth={authVisualStep === 2 ? 2 : 1} className="transition-all duration-300" />
              <circle cx="15" cy="20" r="3.5" fill="#3B82F6" />
              <text x="26" y="18" fill="#FFFFFF" fontSize="7" fontWeight="bold">Employer Agent</text>
              <text x="26" y="28" fill="#64748B" fontSize="6">Hiring Manager</text>
            </g>

            <g transform="translate(290, 230)">
              <rect x="0" y="0" width="80" height="40" rx="10" fill="#0F172A" stroke="#C86D51" strokeWidth={authVisualStep === 3 ? 2 : 1} className="transition-all duration-300" />
              <circle cx="15" cy="20" r="3.5" fill="#C86D51" />
              <text x="26" y="18" fill="#FFFFFF" fontSize="7" fontWeight="bold">Candidate Agent</text>
              <text x="26" y="28" fill="#64748B" fontSize="6">Senior Developer</text>
            </g>
          </svg>
        </div>

        <div className="relative z-10 px-6 pb-6 space-y-3 max-w-md mx-auto text-center lg:text-left">
          <h3 className="text-base lg:text-lg font-bold tracking-tight text-white leading-tight">
            Art-Directed Strategic Simulations
          </h3>
          <p className="text-xs text-slategray leading-relaxed">
            Witness LangGraph-driven AI negotiations or participate directly in our sandbox practice arenas. Program agents with target benchmarks, concession policies, and behavioral strategies.
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
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-primary tracking-tight">
                {activeTab === 'login' ? 'Welcome Back' : 'Create Your Account'}
              </h2>
              <p className="text-xs text-slategray">
                {activeTab === 'login' 
                  ? 'Continue practicing your enterprise negotiation skills.' 
                  : 'Start practicing enterprise negotiations with AI agents.'}
              </p>
            </div>

          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200/50 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <ShieldAlert size={14} className="shrink-0" />
              <span className="font-semibold">{error}</span>
            </div>
          )}



          {activeTab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slategray uppercase tracking-wider block">Email Address *</span>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-slategray/60 pointer-events-none">
                    <Mail size={14} />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onBlur={() => setLoginTouched((p) => ({ ...p, email: true }))}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className={`w-full pl-9 pr-3 py-2.5 bg-white/45 border rounded-xl text-sm text-navyblack focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all ${
                      loginTouched.email && loginValidationErrors.email ? 'border-red-400 focus:border-red-500 bg-red-50/40' : 'border-white/60 focus:border-accent'
                    }`}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                {loginTouched.email && loginValidationErrors.email && (
                  <p className="text-[9px] text-red-500 font-semibold mt-1">{loginValidationErrors.email}</p>
                )}
              </div>
 
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slategray uppercase tracking-wider block">Password *</span>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-slategray/60 pointer-events-none">
                    <Lock size={14} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onBlur={() => setLoginTouched((p) => ({ ...p, password: true }))}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full pl-9 pr-9 py-2.5 bg-white/45 border rounded-xl text-sm text-navyblack focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all ${
                      loginTouched.password && loginValidationErrors.password ? 'border-red-400 focus:border-red-500 bg-red-50/40' : 'border-white/60 focus:border-accent'
                    }`}
                    required
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-3 flex items-center text-slategray hover:text-primary bg-transparent border-none cursor-pointer"
                    disabled={isSubmitting}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {loginTouched.password && loginValidationErrors.password && (
                  <p className="text-[9px] text-red-500 font-semibold mt-1">{loginValidationErrors.password}</p>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-slategray font-semibold">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-gray-300 text-accent focus:ring-accent w-4 h-4 cursor-pointer"
                    disabled={isSubmitting}
                  />
                  Remember me
                </label>
                <span 
                  onClick={() => navigate('/forgot-password')}
                  className="font-semibold text-accent hover:underline cursor-pointer"
                >
                  Forgot Password?
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoginFormInvalid || isSubmitting}
                className={`w-full py-3 text-white font-semibold text-xs uppercase tracking-widest rounded-full transition-all shadow-md mt-2 border-none flex items-center justify-center gap-2 ${
                  isLoginFormInvalid || isSubmitting
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                    : 'bg-accent hover:bg-accent-dark cursor-pointer'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={12} strokeWidth={2.5} />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignupSubmit} className="space-y-5">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slategray uppercase tracking-wider block">Full Name *</span>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-slategray/60 pointer-events-none">
                    <User size={14} />
                  </span>
                  <input
                    type="text"
                    value={fullName}
                    onBlur={() => setSignupTouched((p) => ({ ...p, fullName: true }))}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full pl-9 pr-3 py-2.5 bg-white/45 border border-white/60 focus:border-accent rounded-xl text-sm text-navyblack focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>
 
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slategray uppercase tracking-wider block">Email Address *</span>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-slategray/60 pointer-events-none">
                    <Mail size={14} />
                  </span>
                  <input
                    type="email"
                    value={signupEmail}
                    onBlur={() => setSignupTouched((p) => ({ ...p, email: true }))}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="name@company.com"
                    className={`w-full pl-9 pr-3 py-2.5 bg-white/45 border rounded-xl text-sm text-navyblack focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all ${
                      signupTouched.email && signupValidationErrors.email ? 'border-red-400 focus:border-red-500 bg-red-50/40' : 'border-white/60 focus:border-accent'
                    }`}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                {signupTouched.email && signupValidationErrors.email && (
                  <p className="text-[9px] text-red-500 font-semibold mt-1">{signupValidationErrors.email}</p>
                )}
              </div>
 
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slategray uppercase tracking-wider block">Password *</span>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-slategray/60 pointer-events-none">
                    <Lock size={14} />
                  </span>
                  <input
                    type={showSignupPassword ? 'text' : 'password'}
                    value={signupPassword}
                    onBlur={() => setSignupTouched((p) => ({ ...p, password: true }))}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full pl-9 pr-9 py-2.5 bg-white/45 border rounded-xl text-sm text-navyblack focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all ${
                      signupTouched.password && signupValidationErrors.password ? 'border-red-400 focus:border-red-500 bg-red-50/40' : 'border-white/60 focus:border-accent'
                    }`}
                    required
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                    className="absolute inset-y-0 right-3 flex items-center text-slategray hover:text-primary bg-transparent border-none cursor-pointer"
                    disabled={isSubmitting}
                  >
                    {showSignupPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {signupTouched.password && signupValidationErrors.password && (
                  <p className="text-[9px] text-red-500 font-semibold mt-1">{signupValidationErrors.password}</p>
                )}
              </div>
 
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slategray uppercase tracking-wider block">Confirm Password *</span>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-slategray/60 pointer-events-none">
                    <Lock size={14} />
                  </span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onBlur={() => setSignupTouched((p) => ({ ...p, confirmPassword: true }))}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full pl-9 pr-3 py-2.5 bg-white/45 border rounded-xl text-sm text-navyblack focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all ${
                      signupTouched.confirmPassword && signupValidationErrors.confirmPassword ? 'border-red-400 focus:border-red-500 bg-red-50/40' : 'border-white/60 focus:border-accent'
                    }`}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                {signupTouched.confirmPassword && signupValidationErrors.confirmPassword && (
                  <p className="text-[9px] text-red-500 font-semibold mt-1">{signupValidationErrors.confirmPassword}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSignupFormInvalid || isSubmitting}
                className={`w-full py-3 text-white font-semibold text-xs uppercase tracking-widest rounded-full transition-all shadow-md mt-4 border-none flex items-center justify-center gap-2 ${
                  isSignupFormInvalid || isSubmitting
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none' 
                    : 'bg-accent hover:bg-accent-dark cursor-pointer'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight size={12} strokeWidth={2.5} />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="text-center pt-2">
            <p className="text-xs text-slategray font-semibold">
              {activeTab === 'login' ? (
                <>
                  Don't have an account?{' '}
                  <button 
                    onClick={() => { if (!isSubmitting) switchTab('signup'); }}
                    className="font-semibold text-accent hover:underline cursor-pointer bg-transparent border-none"
                    disabled={isSubmitting}
                  >
                    Create Account
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button 
                    onClick={() => { if (!isSubmitting) switchTab('login'); }}
                    className="font-semibold text-accent hover:underline cursor-pointer bg-transparent border-none"
                    disabled={isSubmitting}
                  >
                    Sign In
                  </button>
                </>
              )
              }
            </p>
          </div>

          </div>
        </div>
      </div>

    </div>
  );
};

export default LoginSignupScreen;
