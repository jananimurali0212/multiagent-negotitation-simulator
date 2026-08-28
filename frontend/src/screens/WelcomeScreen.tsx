import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { 
  Layers, 
  MessageSquare, 
  BarChart3, 
  ShieldCheck, 
  ArrowRight, 
  Play, 
  Workflow, 
  UserCheck, 
  CheckCircle2, 
  AlertTriangle,
  Brain,
  TrendingUp,
  Activity,
  ChevronRight,
  Sparkles,
  HelpCircle
} from 'lucide-react';

export const WelcomeScreen: React.FC = () => {
  const navigate = useNavigate();
  
  // Motion & Parallax System
  const [scrollY, setScrollY] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [revealedSections, setRevealedSections] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);

  // Interactive Widgets State
  const [activeHeroStep, setActiveHeroStep] = useState(0);
  const [activeHowStep, setActiveHowStep] = useState(0);
  const [activePersonality, setActivePersonality] = useState<'Aggressive' | 'Collaborative' | 'Risk-Averse'>('Collaborative');
  const [activeOrchestrationStep, setActiveOrchestrationStep] = useState(0);
  const [activeStateStep, setActiveStateStep] = useState(0);

  // Element Refs for observers
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = {
    features: useRef<HTMLDivElement>(null),
    'how-it-works': useRef<HTMLDivElement>(null),
    scenarios: useRef<HTMLDivElement>(null),
    orchestration: useRef<HTMLDivElement>(null),
    personalities: useRef<HTMLDivElement>(null),
    modes: useRef<HTMLDivElement>(null),
    analysis: useRef<HTMLDivElement>(null),
    states: useRef<HTMLDivElement>(null),
    whyUs: useRef<HTMLDivElement>(null),
    'about-help': useRef<HTMLDivElement>(null),
  };

  // Preview messages for Vendor Pricing Negotiation
  const previewMessages = [
    { sender: 'Procurement Director', content: 'Our budget cap is $120k/year. We require pricing at $45/user/month for 200 users.', type: 'buyer', offer: '$45/user', label: 'Initial Offer' },
    { sender: 'Enterprise Sales VP', content: 'Our standard list is $80. If we commit to a 3-year term, I can offer $58/user/month.', type: 'vendor', offer: '$58/user', label: 'Counteroffer' },
    { sender: 'Procurement Director', content: 'If you waive the $10,000 deployment fee, we can sign the 3-year term with Net-30 billing.', type: 'buyer', offer: '$58 + Net-30', label: 'Concession' },
    { sender: 'Enterprise Sales VP', content: 'Agreed, we will waive the deployment fee. Let\'s draft the final contract details.', type: 'vendor', offer: 'Agreement Reached', label: 'Agreement' }
  ];

  // Trigger animations mount and loops
  useEffect(() => {
    setMounted(true);

    const heroTimer = setInterval(() => {
      setActiveHeroStep((prev) => (prev + 1) % 4);
    }, 4500);

    const orchTimer = setInterval(() => {
      setActiveOrchestrationStep((prev) => (prev + 1) % 3);
    }, 3500);

    return () => {
      clearInterval(heroTimer);
      clearInterval(orchTimer);
    };
  }, []);

  // Loop Agreement/Deadlock lifecycle animation when visible
  useEffect(() => {
    if (!revealedSections.states) return;
    const stateTimer = setInterval(() => {
      setActiveStateStep((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(stateTimer);
  }, [revealedSections.states]);

  // Motion, Scroll, and Intersection Observer setup
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      setScrolled(window.scrollY > 30);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    // Check prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const motionListener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', motionListener);

    // Section reveal & scroll active navbar tracker using IntersectionObserver
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -40% 0px',
      threshold: 0.1
    };

    const observersList: IntersectionObserver[] = [];

    Object.entries(sectionRefs).forEach(([key, ref]) => {
      if (ref.current) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              setActiveSection(key);
              setRevealedSections(prev => ({ ...prev, [key]: true }));
            }
          });
        }, observerOptions);
        observer.observe(ref.current);
        observersList.push(observer);
      }
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      mediaQuery.removeEventListener('change', motionListener);
      observersList.forEach(obs => obs.disconnect());
    };
  }, []);

  // Smooth scroll click handler
  const scrollToAnchor = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -90; // offset for floating pill navbar
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // Detailed Step workflow data for interactive How It Works
  const howStepsData = [
    {
      title: 'Choose a Pre-Configured Scenario',
      desc: 'Select one of our three finalized enterprise negotiations templates designed for structured boundary parameters.',
      highlights: [
        'Vendor Pricing Negotiation: Negotiate licensing costs and deployment fees.',
        'Job Offer Negotiation: Balance salary expectations against HR grade caps.',
        'Project Budget Allocation: Resolve competing team innovation fund priorities.'
      ]
    },
    {
      title: 'Configure the AI Agents',
      desc: 'Inject parameters to calibrate agent roles, hidden goals, price thresholds, timeline boundaries, and strategic profiles.',
      highlights: [
        'Set target values and maximum concession limits.',
        'Configure personality vectors (Aggressive, Collaborative, Risk-Averse).',
        'Input custom constraints (Net billing terms, grade caps).'
      ]
    },
    {
      title: 'Run the Simulation / Practice Arena',
      desc: 'Launch the turn-taking orchestrator in one of two modes: witness automated LLM-vs-LLM runs or enter the practice sandbox.',
      highlights: [
        'AI-vs-AI: Observe optimal strategic negotiation paths.',
        'Human-vs-AI: Engage directly in conversation against an AI opponent.',
        'Live system coaching hints and suggested responses based on metrics.'
      ]
    },
    {
      title: 'Analyze Performance & Outcomes',
      desc: 'Examine detailed transcripts and transactional summaries generated by the state machine upon termination.',
      highlights: [
        'Concession curve graphs tracking seller vs. buyer margins.',
        'Agreement vs. deadlock outcomes with exact concession ratios.',
        'Evaluation scores tracking argument strength and concession control.'
      ]
    }
  ];

  // Personality data for interactive widget
  const personalityData = {
    'Aggressive': {
      label: 'Aggressive Strategist',
      desc: 'Pushes strongly toward its objectives, resists making concessions, and applies greater verbal pressure to protect its boundaries.',
      stats: { concession: '10% - 15%', speed: 'Slow', risk: 'High' },
      dialogue: 'Procurement Agent: "Our budget cap is absolute. We require a drop to $48/user or we will look at open source alternatives. We cannot wait past Q3."'
    },
    'Collaborative': {
      label: 'Collaborative Strategist',
      desc: 'Seeks mutually beneficial outcomes, identifies opportunities for multi-variable trades, and concessions are made progressively.',
      stats: { concession: '45% - 55%', speed: 'Fast', risk: 'Low' },
      dialogue: 'Procurement Agent: "I understand your margin constraints. If we sign a 3-year term instead of 1 year, can we bundle Gold Support to meet our budget targets?"'
    },
    'Risk-Averse': {
      label: 'Risk-Averse Strategist',
      desc: 'Prioritizes timeline certainty, reduces conflict potential, and adheres strictly to corporate policy boundaries to minimize failed runs.',
      stats: { concession: '25% - 35%', speed: 'Moderate', risk: 'Minimal' },
      dialogue: 'Procurement Agent: "We prefer standard pre-approved licensing terms rather than custom SLA modifications to ensure timeline certainty. Let\'s align on Net-30 payments."'
    }
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-warmpearl text-navyblack flex flex-col font-sans overflow-x-hidden antialiased">
      
      {/* STICKY FLOATING PILL NAVBAR */}
      <div className="fixed top-0 inset-x-0 h-24 z-50 flex items-center justify-center pointer-events-none px-6">
        <nav 
          className={`pointer-events-auto flex items-center justify-between rounded-full transition-all duration-350 ${
            scrolled 
              ? 'w-[92%] sm:w-[85%] max-w-5xl py-2 px-6 bg-white/95 border border-gray-200 shadow-lg text-navyblack backdrop-blur-md' 
              : 'w-[95%] sm:w-[90%] max-w-6xl py-3.5 px-8 bg-white/5 border border-white/10 shadow-none text-white/90 backdrop-blur-md'
          }`}
        >
          <div className="flex items-center gap-3">
            {/* Logo treatment with clear contrast surface */}
            <div className="bg-white p-1 rounded-full flex items-center justify-center shadow-sm">
              <Logo variant="icon-only" size={24} />
            </div>
            <div className="flex flex-col">
              <span className={`text-[9px] font-bold tracking-widest uppercase leading-none ${
                scrolled ? 'text-primary' : 'text-white'
              }`}>
                AI-DRIVEN MULTI-AGENT
              </span>
              <span className={`text-[7px] font-semibold uppercase tracking-widest mt-0.5 leading-none ${
                scrolled ? 'text-secondary' : 'text-secondary'
              }`}>
                NEGOTIATION TRAINING PLATFORM
              </span>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-6 text-[11px] font-semibold uppercase tracking-widest">
            <button 
              onClick={() => scrollToAnchor('features')} 
              className={`cursor-pointer transition-all bg-transparent border-none ${
                scrolled 
                  ? activeSection === 'features' ? 'text-accent font-bold' : 'text-slategray hover:text-primary'
                  : activeSection === 'features' ? 'text-white font-bold bg-white/10 px-2.5 py-1 rounded-full' : 'text-white/80 hover:text-white'
              }`}
            >
              Features
            </button>
            <button 
              onClick={() => scrollToAnchor('how-it-works')} 
              className={`cursor-pointer transition-all bg-transparent border-none ${
                scrolled 
                  ? activeSection === 'how-it-works' ? 'text-accent font-bold' : 'text-slategray hover:text-primary'
                  : activeSection === 'how-it-works' ? 'text-white font-bold bg-white/10 px-2.5 py-1 rounded-full' : 'text-white/80 hover:text-white'
              }`}
            >
              How It Works
            </button>
            <button 
              onClick={() => scrollToAnchor('scenarios')} 
              className={`cursor-pointer transition-all bg-transparent border-none ${
                scrolled 
                  ? activeSection === 'scenarios' ? 'text-accent font-bold' : 'text-slategray hover:text-primary'
                  : activeSection === 'scenarios' ? 'text-white font-bold bg-white/10 px-2.5 py-1 rounded-full' : 'text-white/80 hover:text-white'
              }`}
            >
              Scenarios
            </button>
            <button 
              onClick={() => scrollToAnchor('personalities')} 
              className={`cursor-pointer transition-all bg-transparent border-none ${
                scrolled 
                  ? activeSection === 'personalities' ? 'text-accent font-bold' : 'text-slategray hover:text-primary'
                  : activeSection === 'personalities' ? 'text-white font-bold bg-white/10 px-2.5 py-1 rounded-full' : 'text-white/80 hover:text-white'
              }`}
            >
              Personalities
            </button>
            <button 
              onClick={() => scrollToAnchor('about-help')} 
              className={`cursor-pointer transition-all bg-transparent border-none ${
                scrolled 
                  ? activeSection === 'about-help' ? 'text-accent font-bold' : 'text-slategray hover:text-primary'
                  : activeSection === 'about-help' ? 'text-white font-bold bg-white/10 px-2.5 py-1 rounded-full' : 'text-white/80 hover:text-white'
              }`}
            >
              About / Help
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/login')}
              className={`px-4 py-2 text-[10px] font-semibold uppercase tracking-wider rounded-full transition-all bg-transparent border-none cursor-pointer ${
                scrolled ? 'text-primary hover:bg-warmpearl' : 'text-white/90 hover:text-white hover:bg-white/10'
              }`}
            >
              Login
            </button>
            <button 
              onClick={() => navigate('/login?tab=signup')}
              className="px-5 py-2.5 bg-accent hover:bg-accent-dark text-white text-[10px] font-semibold uppercase tracking-widest rounded-full shadow-md transition-all active:scale-98 border-none cursor-pointer"
            >
              Start Simulation
            </button>
          </div>
        </nav>
      </div>

      {/* spacer for sticky nav */}
      <div className="h-4 shrink-0"></div>

      {/* HERO SECTION BLOCK - Unified rounded container with Indigo background */}
      <div className="px-4 sm:px-6 lg:px-8 pt-4 bg-warmpearl">
        <header className="relative rounded-[2.5rem] md:rounded-[3.5rem] bg-primary text-white pt-28 pb-16 md:pt-36 md:pb-24 px-8 md:px-16 overflow-hidden shadow-2xl z-10 border border-primary-dark">
          
          {/* Layer 2: Subtle faded Multi-Agent Negotiation flow SVG in the background */}
          <div 
            className={`absolute inset-0 pointer-events-none z-0 transition-transform duration-100 ease-out`}
            style={!prefersReducedMotion ? { transform: `translateY(${scrollY * 0.10}px)` } : {}}
          >
            <svg className="w-full h-full min-w-[900px]" viewBox="0 0 1000 600" fill="none" xmlns="http://www.w3.org/2000/svg">
              <pattern id="hero-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.2" fill="#FFFFFF" />
              </pattern>
              <rect width="100%" height="100%" fill="url(#hero-grid)" className={`transition-all duration-1000 ${mounted ? 'opacity-[0.06]' : 'opacity-0'}`} />

              {/* Negotiation network flowchart path watermarks */}
              <path 
                d="M120 120 L320 200" 
                stroke={activeHeroStep === 1 || activeHeroStep === 3 ? '#3B82F6' : '#FFFFFF'} 
                strokeWidth={activeHeroStep === 1 ? '2.5' : '1.5'} 
                strokeOpacity={activeHeroStep === 1 || activeHeroStep === 3 ? 0.7 : 0.25}
                strokeDasharray={activeHeroStep === 1 ? 'none' : '5 5'} 
                className="transition-all duration-500" 
              />
              <path 
                d="M120 320 L320 200" 
                stroke={activeHeroStep === 0 || activeHeroStep === 2 || activeHeroStep === 3 ? '#C86D51' : '#FFFFFF'} 
                strokeWidth={activeHeroStep === 0 || activeHeroStep === 2 ? '2.5' : '1.5'} 
                strokeOpacity={activeHeroStep === 0 || activeHeroStep === 2 || activeHeroStep === 3 ? 0.7 : 0.25}
                strokeDasharray={activeHeroStep === 0 || activeHeroStep === 2 ? 'none' : '5 5'} 
                className="transition-all duration-500" 
              />
              <path 
                d="M320 200 L520 150" 
                stroke={activeHeroStep === 3 ? '#3B82F6' : '#FFFFFF'} 
                strokeWidth={activeHeroStep === 3 ? '2.5' : '1.5'} 
                strokeOpacity={activeHeroStep === 3 ? 0.7 : 0.25}
                strokeDasharray={activeHeroStep === 3 ? 'none' : '5 5'} 
                className="transition-all duration-500" 
              />
              <path d="M520 150 L720 250" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="5 5" strokeOpacity="0.2" />
              <path d="M520 150 L620 350" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="5 5" strokeOpacity="0.2" />
              <path d="M620 350 L820 290" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="5 5" strokeOpacity="0.2" />

              <circle 
                cx="120" 
                cy="120" 
                r="12" 
                fill={activeHeroStep === 1 ? '#3B82F6' : '#1E2230'} 
                stroke={activeHeroStep === 1 ? '#3B82F6' : '#FFFFFF'} 
                strokeWidth="3" 
                strokeOpacity={activeHeroStep === 1 ? 0.9 : 0.3}
                className="transition-all duration-500"
              />
              <circle 
                cx="120" 
                cy="320" 
                r="12" 
                fill={activeHeroStep === 0 || activeHeroStep === 2 ? '#C86D51' : '#1E2230'} 
                stroke={activeHeroStep === 0 || activeHeroStep === 2 ? '#C86D51' : '#FFFFFF'} 
                strokeWidth="3" 
                strokeOpacity={activeHeroStep === 0 || activeHeroStep === 2 ? 0.9 : 0.3}
                className="transition-all duration-500"
              />
              <circle 
                cx="320" 
                cy="200" 
                r="14" 
                fill={activeHeroStep === 3 ? '#3B82F6' : '#1E2230'} 
                stroke={activeHeroStep === 3 ? '#3B82F6' : '#FFFFFF'} 
                strokeWidth="3" 
                strokeOpacity={activeHeroStep === 3 ? 0.9 : 0.3}
                className="transition-all duration-500"
              />
              <circle cx="520" cy="150" r="12" fill="#1E2230" stroke="#FFFFFF" strokeWidth="2.5" strokeOpacity="0.2" />
              <circle cx="620" cy="350" r="14" fill="#1E2230" stroke="#FFFFFF" strokeWidth="2.5" strokeOpacity="0.2" />
              <circle cx="720" cy="250" r="12" fill="#1E2230" stroke="#FFFFFF" strokeWidth="2.5" strokeOpacity="0.2" />

              <text x="120" y="145" fill="#FFFFFF" fillOpacity={activeHeroStep === 1 ? 0.9 : 0.4} fontSize="9" fontWeight="bold" textAnchor="middle" className="transition-all duration-500">Buyer Agent</text>
              <text x="120" y="345" fill="#FFFFFF" fillOpacity={activeHeroStep === 0 || activeHeroStep === 2 ? 0.9 : 0.4} fontSize="9" fontWeight="bold" textAnchor="middle" className="transition-all duration-500">Vendor Agent</text>
              <text x="320" y="225" fill="#FFFFFF" fillOpacity={activeHeroStep === 3 ? 0.9 : 0.4} fontSize="9" fontWeight="bold" textAnchor="middle" className="transition-all duration-500">Orchestrator</text>
              <text x="620" y="375" fill="#FFFFFF" fillOpacity="0.2" fontSize="9" fontWeight="bold" textAnchor="middle">Decision Engine</text>
            </svg>
          </div>

          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
            
            {/* Layer 4: Hero Content (Left Column) */}
            <div 
              className="space-y-6 lg:col-span-6 transition-transform duration-100 ease-out"
              style={!prefersReducedMotion ? { transform: `translateY(${scrollY * 0.05}px)` } : {}}
            >
              <div className={`inline-flex items-center gap-2 px-3 py-1 bg-secondary/15 text-secondary text-[9px] font-bold uppercase tracking-widest rounded-full border border-secondary/20 transition-all duration-700 delay-100 transform ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}>
                <Sparkles size={10} />
                <span>AI-powered Negotiation Simulation</span>
              </div>
              
              <h1 className={`text-3xl sm:text-5xl lg:text-6xl font-bold tracking-[-0.03em] text-white leading-[1.1] transition-all duration-700 delay-200 transform ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}>
                Practice Negotiation.<br/>
                <span className="text-secondary">Watch AI Agents Negotiate.</span>
              </h1>
              
              <p className={`text-xs sm:text-sm text-white/80 max-w-lg leading-relaxed transition-all duration-700 delay-300 transform ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}>
                Train, simulate, and analyze realistic enterprise negotiations using autonomous AI agents with configurable roles, goals, constraints, and personalities.
              </p>
              
              <div className={`flex flex-wrap gap-4 pt-2 transition-all duration-700 delay-400 transform ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}>
                <button 
                  onClick={() => navigate('/login?tab=signup')}
                  className="px-6 py-3.5 bg-accent hover:bg-accent-dark text-white font-semibold text-xs uppercase tracking-wider rounded-xl shadow-lg flex items-center gap-3 transition-all active:scale-98 border-none cursor-pointer"
                >
                  Start Simulation
                  <ArrowRight size={14} />
                </button>
                <button 
                  onClick={() => scrollToAnchor('scenarios')}
                  className="px-6 py-3.5 bg-transparent hover:bg-white/5 border border-white/20 hover:border-white/50 text-white font-semibold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Explore Scenarios
                </button>
              </div>
              
              <div className={`pt-2 text-[9px] font-bold text-white/40 uppercase tracking-widest flex flex-col gap-1 transition-all duration-700 delay-500 transform ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}>
                <span>Completely Free • No Subscription Required</span>
              </div>
            </div>

            {/* Layer 5: Live Negotiation Preview (Right Column) */}
            <div 
              className="lg:col-span-6 flex flex-col items-center lg:items-end transition-transform duration-100 ease-out"
              style={!prefersReducedMotion ? { transform: `translateY(${scrollY * 0.16}px)` } : {}}
            >
              <div className={`w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl relative backdrop-blur-sm transition-all duration-1000 delay-600 transform ${
                mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}>
                
                <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4 text-[9px] font-bold text-white/60">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                    LIVE MULTI-AGENT PREVIEW
                  </span>
                  <span>VENDOR PRICING NEGOTIATION</span>
                </div>

                {/* Miniature Live Negotiation steps */}
                <div className="space-y-2.5 min-h-[220px] flex flex-col justify-end">
                  
                  {/* Step 0: Vendor Agent Initial Offer */}
                  {activeHeroStep >= 0 && (
                    <div className="p-3 bg-white text-navyblack rounded-xl border border-gray-150 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="flex justify-between items-center text-[9px] font-bold text-secondary mb-1">
                        <span className="flex items-center gap-1">
                          <span className="w-4 h-4 rounded-full bg-secondary text-white flex items-center justify-center font-bold text-[8px]">V</span>
                          VENDOR AGENT
                        </span>
                        <span className="text-[8px] tracking-wider px-1.5 py-0.2 bg-warmpearl rounded border border-gray-150">INITIAL OFFER</span>
                      </div>
                      <p className="text-[11px] font-semibold">"Initial offer: ₹12,00,000 per year with Standard SLA."</p>
                    </div>
                  )}

                  {/* Arrow indicator 1 */}
                  {activeHeroStep >= 1 && (
                    <div className="text-white/40 flex justify-center text-[10px] leading-none py-0.5 animate-pulse">↓</div>
                  )}

                  {/* Step 1: Buyer Agent Counteroffer */}
                  {activeHeroStep >= 1 && (
                    <div className="p-3 bg-white text-navyblack rounded-xl border border-gray-150 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="flex justify-between items-center text-[9px] font-bold text-accent mb-1">
                        <span className="flex items-center gap-1">
                          <span className="w-4 h-4 rounded-full bg-accent text-white flex items-center justify-center font-bold text-[8px]">B</span>
                          BUYER AGENT
                        </span>
                        <span className="text-[8px] tracking-wider px-1.5 py-0.2 bg-warmpearl rounded border border-gray-150">COUNTEROFFER</span>
                      </div>
                      <p className="text-[11px] font-semibold">"Counteroffer: ₹9,50,000 and we require Net-45 terms."</p>
                    </div>
                  )}

                  {/* Arrow indicator 2 */}
                  {activeHeroStep >= 2 && (
                    <div className="text-white/40 flex justify-center text-[10px] leading-none py-0.5 animate-pulse">↓</div>
                  )}

                  {/* Step 2: Vendor Agent Concession */}
                  {activeHeroStep >= 2 && (
                    <div className="p-3 bg-white text-navyblack rounded-xl border border-gray-150 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="flex justify-between items-center text-[9px] font-bold text-secondary mb-1">
                        <span className="flex items-center gap-1">
                          <span className="w-4 h-4 rounded-full bg-secondary text-white flex items-center justify-center font-bold text-[8px]">V</span>
                          VENDOR AGENT
                        </span>
                        <span className="text-[8px] tracking-wider px-1.5 py-0.2 bg-warmpearl rounded border border-gray-150">CONCESSION</span>
                      </div>
                      <p className="text-[11px] font-semibold">"Concession: ₹10,80,000 and we bundle Gold SLA."</p>
                    </div>
                  )}

                  {/* Arrow indicator 3 */}
                  {activeHeroStep >= 3 && (
                    <div className="text-white/40 flex justify-center text-[10px] leading-none py-0.5 animate-pulse">↓</div>
                  )}

                  {/* Step 3: Orchestrator Evaluating */}
                  {activeHeroStep >= 3 && (
                    <div className="p-3 bg-primary-dark/80 text-white rounded-xl border border-white/10 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="flex justify-between items-center text-[9px] font-bold text-white mb-1">
                        <span className="flex items-center gap-1">
                          <span className="w-4 h-4 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold text-[8px]">O</span>
                          ORCHESTRATOR
                        </span>
                        <span className="text-[8px] tracking-wider px-1.5 py-0.2 bg-white/10 rounded border border-white/10 text-white/80">EVALUATING</span>
                      </div>
                      <p className="text-[11px] font-medium text-slate-200">"Evaluating agreement compatibility within agent bounds..."</p>
                    </div>
                  )}

                </div>

                {/* Progress Indicators */}
                <div className="flex justify-center gap-1.5 pt-4 mt-4 border-t border-white/10">
                  {[0, 1, 2, 3].map((idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveHeroStep(idx)}
                      className={`w-5 h-1 rounded-full transition-all ${
                        idx === activeHeroStep 
                          ? 'bg-accent w-8' 
                          : 'bg-white/20 hover:bg-white/40'
                      } border-none`}
                    ></button>
                  ))}
                </div>

              </div>
            </div>

          </div>
        </header>
      </div>

      {/* SECTION 3 — VALUE PROPOSITION (Concise highlights, no theory heavy paragraphs) */}
      <section 
        ref={sectionRefs.features}
        id="features"
        className={`py-20 px-6 md:px-12 max-w-7xl mx-auto transition-all duration-700 transform ${
          revealedSections.features ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
        }`}
      >
        <div className="text-center space-y-3">
          <span className="text-[10px] font-semibold text-secondary uppercase tracking-widest">Why This Platform</span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-[-0.02em] text-primary">Practice Negotiation Without the Real-World Stakes</h2>
          <p className="text-xs sm:text-sm text-slategray max-w-xl mx-auto leading-relaxed">
            Configure mock counterparties, align constraints, and test pricing variations in minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          
          <div className={`bg-white border border-gray-150 rounded-xl p-6 space-y-4 hover:shadow-md transition-all duration-700 transform ${
            revealedSections.features ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          } delay-100`}>
            <div className="p-3 bg-primary/5 text-primary rounded-xl w-fit">
              <Brain size={22} />
            </div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">Configurable AI Agents</h3>
            <p className="text-xs text-slategray leading-relaxed">
              Vary the agent's target thresholds, maximum concessions, and communication profiles (Aggressive, Collaborative, Risk-Averse).
            </p>
          </div>

          <div className={`bg-white border border-gray-150 rounded-xl p-6 space-y-4 hover:shadow-md transition-all duration-700 transform ${
            revealedSections.features ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          } delay-200`}>
            <div className="p-3 bg-secondary/5 text-secondary rounded-xl w-fit">
              <TrendingUp size={22} />
            </div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">Audit Concession Offsets</h3>
            <p className="text-xs text-slategray leading-relaxed">
              Observe transaction metrics and graphs detailing how concessions and offers evolved across rounds.
            </p>
          </div>

          <div className={`bg-white border border-gray-150 rounded-xl p-6 space-y-4 hover:shadow-md transition-all duration-700 transform ${
            revealedSections.features ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          } delay-300`}>
            <div className="p-3 bg-accent/5 text-accent rounded-xl w-fit">
              <Activity size={22} />
            </div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">Repeatable Sandbox</h3>
            <p className="text-xs text-slategray leading-relaxed">
              Re-run the exact same baseline cases with slight updates to isolate strategic variables and analyze output deltas.
            </p>
          </div>

        </div>
      </section>

      {/* SECTION 4 — HOW IT WORKS (Interactive step widget) */}
      <section 
        ref={sectionRefs['how-it-works']}
        id="how-it-works"
        className={`bg-white border-y border-gray-150 py-20 px-6 md:px-12 transition-all duration-700 transform ${
          revealedSections['how-it-works'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
        }`}
      >
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center space-y-2">
            <span className="text-[10px] font-semibold text-secondary uppercase tracking-widest">Workflow Execution</span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-[-0.02em] text-primary">How the Platform Works</h2>
          </div>

          {/* Interactive timeline workflow */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Steps Left Selector */}
            <div className="lg:col-span-5 flex flex-col justify-between gap-4">
              {['Choose Scenario', 'Configure Agents', 'Run Simulation', 'Analyze Outcome'].map((stepTitle, idx) => (
                <div
                  key={idx}
                  onMouseEnter={() => setActiveHowStep(idx)}
                  onClick={() => setActiveHowStep(idx)}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all duration-200 flex items-center gap-4 ${
                    activeHowStep === idx 
                      ? 'bg-primary border-primary text-white shadow-md' 
                      : 'bg-warmpearl border-gray-200 text-slategray hover:border-gray-300 hover:text-primary'
                  }`}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                    activeHowStep === idx ? 'bg-secondary text-white' : 'bg-gray-200 text-slategray'
                  }`}>
                    {idx + 1}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-semibold uppercase tracking-widest opacity-60">Step 0{idx + 1}</span>
                    <strong className="text-xs uppercase font-semibold tracking-wider">{stepTitle}</strong>
                  </div>
                  <ChevronRight size={14} className="ml-auto opacity-40" />
                </div>
              ))}
            </div>

            {/* Explanation Right Container */}
            <div className="lg:col-span-7 bg-warmpearl border border-gray-200 rounded-2xl p-6 flex flex-col justify-between min-h-[300px]">
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-gray-150 pb-2">
                  <span className="text-[9px] font-semibold text-secondary uppercase tracking-widest">Step 0{activeHowStep + 1} Visual Pipeline</span>
                  <span className="px-2 py-0.5 bg-accent/15 text-accent text-[8px] font-bold uppercase rounded">Active</span>
                </div>
                
                <h3 className="text-base font-bold text-primary">{howStepsData[activeHowStep].title}</h3>
                <p className="text-xs text-slategray leading-relaxed">
                  {howStepsData[activeHowStep].desc}
                </p>

                <div className="pt-3 space-y-2">
                  {howStepsData[activeHowStep].highlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <CheckCircle2 size={14} className="text-accent shrink-0 mt-0.5" />
                      <span className="text-navyblack font-medium">{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Compact visual diagram mockup matching selected step */}
              <div className="mt-6 pt-4 border-t border-gray-150/50 flex items-center justify-center h-20 bg-white rounded-xl border border-gray-200">
                {activeHowStep === 0 && (
                  <div className="flex gap-2 text-[9px] font-bold">
                    <span className="px-2 py-1 bg-primary/5 rounded border border-gray-150">Vendor Pricing</span>
                    <span className="px-2 py-1 bg-primary/5 rounded border border-gray-150">Job Offer</span>
                    <span className="px-2 py-1 bg-primary/5 rounded border border-gray-150">Project Budget</span>
                  </div>
                )}
                {activeHowStep === 1 && (
                  <div className="flex items-center gap-4 text-[9px] font-bold">
                    <span>Agent 01: Collaborative</span>
                    <span className="text-gray-400">↔</span>
                    <span>Agent 02: Aggressive</span>
                  </div>
                )}
                {activeHowStep === 2 && (
                  <div className="flex items-center gap-2 text-[9px] font-bold text-accent">
                    <Workflow size={14} />
                    <span>Orchestrator Executing Turn-Taking Loop...</span>
                  </div>
                )}
                {activeHowStep === 3 && (
                  <div className="flex gap-4 text-[9px] font-bold">
                    <span className="text-green-600">✔ Agreement Reached</span>
                    <span className="text-primary">Concession Ratio: 0.42</span>
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* SECTION 5 — ENTERPRISE NEGOTIATION SCENARIOS */}
      <section 
        ref={sectionRefs.scenarios}
        id="scenarios"
        className={`py-20 px-6 md:px-12 max-w-7xl mx-auto space-y-12 transition-all duration-700 transform ${
          revealedSections.scenarios ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
        }`}
      >
        <div className="text-center space-y-2">
          <span className="text-[10px] font-semibold text-secondary uppercase tracking-widest">Simulation Templates</span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-[-0.02em] text-primary">Enterprise Negotiation Simulations</h2>
          <p className="text-xs text-slategray max-w-md mx-auto">
            Practice negotiation patterns across realistic enterprise situations built with predefined boundaries.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Card 1: Vendor Pricing */}
          <div className={`bg-white border border-gray-200 rounded-xl p-6 flex flex-col justify-between hover:shadow-lg hover:border-accent/40 transition-all duration-700 transform ${
            revealedSections.scenarios ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          } delay-100 group relative`}>
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <span className="px-2 py-0.5 bg-primary/5 text-primary text-[8px] font-semibold uppercase tracking-wider rounded">Procurement</span>
                <span className="text-[9px] text-slategray font-semibold">10 min est.</span>
              </div>
              <h3 className="text-base font-semibold text-primary group-hover:text-accent transition-colors">Vendor Pricing Negotiation</h3>
              <p className="text-xs text-slategray leading-relaxed">
                Simulate a buyer and vendor negotiating service licensing pricing while balancing budgets, volume commits, and support SLAs.
              </p>
              
              <div className="pt-3 border-t border-gray-150 space-y-2 text-[10px] text-slategray font-semibold">
                <div className="flex justify-between"><span>Buyer Agent</span><span className="text-primary font-bold">Procurement Director</span></div>
                <div className="flex justify-between"><span>Vendor Agent</span><span className="text-primary font-bold">Enterprise Sales VP</span></div>
                <div className="flex justify-between"><span>Parameters</span><span className="text-secondary font-bold">Price • SLA • Terms</span></div>
              </div>
            </div>
            <button 
              onClick={() => navigate('/login')}
              className="mt-6 w-full py-2.5 bg-primary group-hover:bg-accent text-white font-semibold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 border-none cursor-pointer"
            >
              Simulate Scenario <Play size={10} fill="white" />
            </button>
          </div>

          {/* Card 2: Job Offer */}
          <div className={`bg-white border border-gray-200 rounded-xl p-6 flex flex-col justify-between hover:shadow-lg hover:border-accent/40 transition-all duration-700 transform ${
            revealedSections.scenarios ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          } delay-250 group relative`}>
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <span className="px-2 py-0.5 bg-primary/5 text-primary text-[8px] font-semibold uppercase tracking-wider rounded">Human Resources</span>
                <span className="text-[9px] text-slategray font-semibold">5 min est.</span>
              </div>
              <h3 className="text-base font-semibold text-primary group-hover:text-accent transition-colors">Job Offer Negotiation</h3>
              <p className="text-xs text-slategray leading-relaxed">
                Simulate an employer and candidate negotiating base salaries, stock equity grant volumes, and remote arrangements.
              </p>
              
              <div className="pt-3 border-t border-gray-150 space-y-2 text-[10px] text-slategray font-semibold">
                <div className="flex justify-between"><span>Candidate Agent</span><span className="text-primary font-bold">Senior Engineer</span></div>
                <div className="flex justify-between"><span>Employer Agent</span><span className="text-primary font-bold">HR Lead Partner</span></div>
                <div className="flex justify-between"><span>Parameters</span><span className="text-secondary font-bold">Salary • Equity • SLA</span></div>
              </div>
            </div>
            <button 
              onClick={() => navigate('/login')}
              className="mt-6 w-full py-2.5 bg-primary group-hover:bg-accent text-white font-semibold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 border-none cursor-pointer"
            >
              Simulate Scenario <Play size={10} fill="white" />
            </button>
          </div>

          {/* Card 3: Project Budget */}
          <div className={`bg-white border border-gray-200 rounded-xl p-6 flex flex-col justify-between hover:shadow-lg hover:border-accent/40 transition-all duration-700 transform ${
            revealedSections.scenarios ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          } delay-400 group relative`}>
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <span className="px-2 py-0.5 bg-primary/5 text-primary text-[8px] font-semibold uppercase tracking-wider rounded">Finance Unit</span>
                <span className="text-[9px] text-slategray font-semibold">8 min est.</span>
              </div>
              <h3 className="text-base font-semibold text-primary group-hover:text-accent transition-colors">Project Budget Allocation</h3>
              <p className="text-xs text-slategray leading-relaxed">
                Simulate stakeholders negotiating innovation fund distributions between engineering resources and commercialization spend.
              </p>
              
              <div className="pt-3 border-t border-gray-150 space-y-2 text-[10px] text-slategray font-semibold">
                <div className="flex justify-between"><span>Stakeholder A</span><span className="text-primary font-bold">R&D Lead</span></div>
                <div className="flex justify-between"><span>Stakeholder B</span><span className="text-primary font-bold">Finance VP</span></div>
                <div className="flex justify-between"><span>Parameters</span><span className="text-secondary font-bold">splits • reserves • buffer</span></div>
              </div>
            </div>
            <button 
              onClick={() => navigate('/login')}
              className="mt-6 w-full py-2.5 bg-primary group-hover:bg-accent text-white font-semibold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 border-none cursor-pointer"
            >
              Simulate Scenario <Play size={10} fill="white" />
            </button>
          </div>

        </div>
      </section>

      {/* SECTION 6 — MULTI-AGENT ORCHESTRATION (Orchestration pipeline diagram) */}
      <section 
        ref={sectionRefs.orchestration}
        className={`bg-white border-y border-gray-150 py-20 px-6 md:px-12 transition-all duration-700 transform ${
          revealedSections.orchestration ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
        }`}
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-5 space-y-6">
            <span className="text-[10px] font-semibold text-secondary uppercase tracking-widest">Platform Core</span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-[-0.02em] text-primary leading-tight">Negotiations Driven by Multiple AI Agents</h2>
            <p className="text-xs sm:text-sm text-slategray leading-relaxed">
              Every participant operates as an independent Large Language Model entity guided by hidden variables. Each agent dynamically responds to the negotiation timeline according to its configured boundaries.
            </p>
            <ul className="space-y-3 text-xs text-primary font-semibold">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-accent" /> Private Goal Configuration
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-accent" /> Hard Financial Boundaries & Limits
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-accent" /> Dynamic Turn-Taking Orchestration
              </li>
            </ul>
          </div>

          {/* Flow diagram visual */}
          <div className="lg:col-span-7 bg-warmpearl border border-gray-200 rounded-2xl p-6 shadow-inner relative flex flex-col justify-center min-h-[300px]">
            <div className="absolute top-4 left-4 text-[9px] font-bold text-slategray uppercase tracking-wider">Interactive Orchestrator Pipeline</div>
            
            <div className="space-y-6 max-w-lg mx-auto w-full pt-4">
              
              {/* Row 1: Agent Inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div className={`bg-white border border-gray-250 p-4 rounded-xl text-center space-y-1.5 shadow-sm transition-all duration-300 ${
                  activeOrchestrationStep === 0 ? 'ring-2 ring-accent scale-[1.02] shadow-md' : 'opacity-70'
                }`}>
                  <div className="w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center font-semibold text-xs mx-auto">V</div>
                  <div className="text-[11px] font-bold text-primary">Vendor Agent</div>
                  <span className="px-2 py-0.5 bg-secondary/15 text-secondary text-[8px] font-bold uppercase rounded">Aggressive</span>
                </div>
                <div className={`bg-white border border-gray-250 p-4 rounded-xl text-center space-y-1.5 shadow-sm transition-all duration-300 ${
                  activeOrchestrationStep === 0 ? 'ring-2 ring-accent scale-[1.02] shadow-md' : 'opacity-70'
                }`}>
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-semibold text-xs mx-auto">B</div>
                  <div className="text-[11px] font-bold text-primary">Buyer Agent</div>
                  <span className="px-2 py-0.5 bg-primary/15 text-primary text-[8px] font-bold uppercase rounded">Collaborative</span>
                </div>
              </div>

              {/* Connector lines & orchestrator */}
              <div className="flex flex-col items-center relative">
                {/* Horizontal line */}
                <div className="w-1/2 h-0.5 bg-gray-300 absolute -top-3"></div>
                {/* Vertical down line */}
                <div className="w-0.5 h-8 bg-gray-300"></div>
                
                {/* Orchestrator node */}
                <div className={`bg-accent text-white p-3 px-5 rounded-full flex items-center gap-2 text-xs font-semibold uppercase tracking-wider shadow-md z-10 transition-all duration-300 ${
                  activeOrchestrationStep === 1 ? 'ring-4 ring-accent/35 scale-105' : 'opacity-80'
                }`}>
                  <Workflow size={14} />
                  <span>Central Orchestration Engine</span>
                </div>
                
                {/* Down arrow */}
                <div className="w-0.5 h-8 bg-gray-300"></div>
              </div>

              {/* Result output */}
              <div className={`bg-white border border-gray-250 p-4 rounded-xl shadow-sm space-y-3 transition-all duration-300 ${
                activeOrchestrationStep === 2 ? 'ring-2 ring-accent scale-[1.01] shadow-md' : 'opacity-70'
              }`}>
                <div className="flex justify-between items-center text-[9px] font-semibold text-slategray border-b border-gray-150 pb-2">
                  <span>ORCHESTRATOR METRIC EVALUATOR</span>
                  <span className="text-green-600 font-bold">ACTIVE STATE</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-semibold">
                  <div className="bg-warmpearl p-2 rounded border border-gray-150">
                    <span className="text-slategray block text-[8px]">AGREEMENT INDEX</span>
                    <strong className="text-primary text-[12px] font-bold">78%</strong>
                  </div>
                  <div className="bg-warmpearl p-2 rounded border border-gray-150">
                    <span className="text-slate-500 block text-[8px]">CONCESSION SLOPE</span>
                    <strong className="text-secondary text-[12px] font-bold">-0.12</strong>
                  </div>
                  <div className="bg-warmpearl p-2 rounded border border-gray-150">
                    <span className="text-slate-500 block text-[8px]">DEADLOCK RISK</span>
                    <strong className="text-red-500 text-[12px] font-bold">15%</strong>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* SECTION 7 — AGENT PERSONALITIES (Interactive Widget) */}
      <section 
        ref={sectionRefs.personalities}
        id="personalities"
        className={`py-20 px-6 md:px-12 max-w-7xl mx-auto space-y-12 transition-all duration-700 transform ${
          revealedSections.personalities ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
        }`}
      >
        <div className="text-center space-y-2">
          <span className="text-[10px] font-semibold text-secondary uppercase tracking-widest">Behavior Settings</span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-[-0.02em] text-primary">Different Personalities. Different Negotiation Strategies.</h2>
          <p className="text-xs text-slategray max-w-md mx-auto">
            Select a strategist personality profile below to explore how it changes concession velocity and dialogue.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Personality Tab selector */}
          <div className="lg:col-span-4 flex flex-col gap-3 justify-center">
            {(['Collaborative', 'Aggressive', 'Risk-Averse'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setActivePersonality(p)}
                className={`p-4 rounded-xl text-left border font-semibold text-xs uppercase tracking-wider transition-all flex items-center justify-between cursor-pointer ${
                  activePersonality === p 
                    ? 'bg-primary border-primary text-white shadow-md' 
                    : 'bg-white border-gray-200 text-slategray hover:text-primary hover:border-gray-300'
                }`}
              >
                <span>{personalityData[p].label}</span>
                <ArrowRight size={14} className={activePersonality === p ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'} />
              </button>
            ))}
          </div>

          {/* Interactive display box */}
          <div className="lg:col-span-8 bg-white border border-gray-205 rounded-2xl p-6 shadow-sm flex flex-col justify-between min-h-[260px]">
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <h3 className="text-base font-semibold text-primary">{personalityData[activePersonality].label} Profile</h3>
                <span className="px-2.5 py-0.5 bg-secondary/10 text-secondary text-[8px] font-semibold uppercase rounded">Strategist Data</span>
              </div>
              <p className="text-xs text-slategray leading-relaxed">
                {personalityData[activePersonality].desc}
              </p>

              <div className="grid grid-cols-3 gap-4 text-xs font-semibold pt-2">
                <div className="bg-warmpearl p-3 rounded-lg border border-gray-150">
                  <span className="text-[8px] text-slate-500 uppercase block mb-0.5">Concession Margin</span>
                  <span className="text-primary font-semibold">{personalityData[activePersonality].stats.concession}</span>
                </div>
                <div className="bg-warmpearl p-3 rounded-lg border border-gray-150">
                  <span className="text-[8px] text-slate-500 uppercase block mb-0.5">Response Speed</span>
                  <span className="text-primary font-semibold">{personalityData[activePersonality].stats.speed}</span>
                </div>
                <div className="bg-warmpearl p-3 rounded-lg border border-gray-150">
                  <span className="text-[8px] text-slate-500 uppercase block mb-0.5">Deadlock Risk</span>
                  <span className="text-secondary font-semibold">{personalityData[activePersonality].stats.risk}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-primary/5 border border-primary/10 p-4 rounded-xl">
              <div className="text-[9px] font-semibold text-primary uppercase mb-1.5 tracking-wider">Example Dialogue Output</div>
              <p className="text-[11px] text-navyblack italic font-medium leading-relaxed">
                "{personalityData[activePersonality].dialogue}"
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 8 — TWO WAYS TO NEGOTIATE */}
      <section 
        ref={sectionRefs.modes}
        className={`bg-white border-y border-gray-150 py-20 px-6 md:px-12 transition-all duration-700 transform ${
          revealedSections.modes ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
        }`}
      >
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-[-0.02em] text-primary">Two Simulation Modalities</h2>
            <p className="text-xs text-slategray max-w-sm mx-auto">
              Run automated scripts to study agent interactions, or practice directly against an LLM opponent.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Card 1 */}
            <div className="bg-warmpearl border border-gray-250 rounded-2xl p-8 flex flex-col justify-between hover:shadow-lg hover:border-accent/30 transition-all group">
              <div className="space-y-4">
                <div className="p-3 bg-secondary text-white rounded-xl w-fit">
                  <Workflow size={22} />
                </div>
                <h3 className="text-lg font-semibold uppercase tracking-wider text-primary">AI-vs-AI Simulation</h3>
                <p className="text-xs text-slategray leading-relaxed">
                  Observe autonomous agents negotiate with each other based on their configured roles, goals, constraints, and personalities. Analyze how concession curves adjust and where agreements converge without human bias.
                </p>
              </div>
              <button 
                onClick={() => navigate('/login')}
                className="mt-8 px-5 py-3 bg-primary hover:bg-primary-dark text-white font-semibold text-xs uppercase tracking-wider rounded-xl transition-all self-start border-none cursor-pointer"
              >
                Launch Simulation Mode
              </button>
            </div>

            {/* Card 2 */}
            <div className="bg-warmpearl border border-gray-250 rounded-2xl p-8 flex flex-col justify-between hover:shadow-lg hover:border-accent/30 transition-all group">
              <div className="space-y-4">
                <div className="p-3 bg-accent text-white rounded-xl w-fit">
                  <UserCheck size={22} />
                </div>
                <h3 className="text-lg font-semibold uppercase tracking-wider text-primary">Human-vs-AI Practice</h3>
                <p className="text-xs text-slategray leading-relaxed">
                  Take part in a negotiation directly and practice responding to an AI opponent. Receive hints, suggested responses based on active listening benchmarks, and real-time transaction scorecards.
                </p>
              </div>
              <button 
                onClick={() => navigate('/login')}
                className="mt-8 px-5 py-3 bg-accent hover:bg-accent-dark text-white font-semibold text-xs uppercase tracking-wider rounded-xl transition-all self-start border-none cursor-pointer"
              >
                Launch Practice Mode
              </button>
            </div>

          </div>

          <div className="text-center pt-4">
            <button 
              onClick={() => navigate('/login')}
              className="text-xs font-semibold text-secondary hover:text-secondary-dark tracking-widest uppercase border-b-2 border-secondary pb-1 hover:border-transparent transition-all bg-transparent border-none cursor-pointer"
            >
              Explore Simulation Modes →
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 9 — NEGOTIATION ANALYSIS */}
      <section 
        ref={sectionRefs.analysis}
        className={`py-20 px-6 md:px-12 max-w-7xl mx-auto space-y-12 transition-all duration-700 transform ${
          revealedSections.analysis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
        }`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Analysis Graph Representation */}
          <div className="lg:col-span-7 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-150">
              <span className="text-[10px] font-semibold text-primary uppercase tracking-widest flex items-center gap-1.5">
                <TrendingUp size={14} className="text-accent" /> Concession Trend Chart
              </span>
              <span className="text-[9px] font-bold text-slategray uppercase">Rounds 1 - 5</span>
            </div>

            {/* Simulated graph using SVG */}
            <div className="relative pt-4">
              <svg viewBox="0 0 400 180" className="w-full h-auto overflow-visible">
                <line x1="30" y1="20" x2="380" y2="20" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3" />
                <line x1="30" y1="60" x2="380" y2="60" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3" />
                <line x1="30" y1="100" x2="380" y2="100" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3" />
                <line x1="30" y1="140" x2="380" y2="140" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3" />
                
                <line x1="30" y1="10" x2="30" y2="150" stroke="#E2E8F0" strokeWidth="1.5" />
                <line x1="30" y1="150" x2="390" y2="150" stroke="#E2E8F0" strokeWidth="1.5" />

                <text x="30" y="165" fill="#94A3B8" fontSize="8" textAnchor="middle">R1</text>
                <text x="115" y="165" fill="#94A3B8" fontSize="8" textAnchor="middle">R2</text>
                <text x="200" y="165" fill="#94A3B8" fontSize="8" textAnchor="middle">R3</text>
                <text x="285" y="165" fill="#94A3B8" fontSize="8" textAnchor="middle">R4</text>
                <text x="370" y="165" fill="#94A3B8" fontSize="8" textAnchor="middle">R5</text>

                <path d="M 30 140 L 115 120 L 200 95 L 285 85 L 370 80" fill="none" stroke="#1E2230" strokeWidth="3" strokeLinecap="round" />
                <circle cx="30" cy="140" r="4" fill="#1E2230" />
                <circle cx="200" cy="95" r="4" fill="#1E2230" />
                <circle cx="370" cy="80" r="4" fill="#1E2230" />

                <path d="M 30 20 L 115 45 L 200 68 L 285 75 L 370 80" fill="none" stroke="#C86D51" strokeWidth="3" strokeLinecap="round" />
                <circle cx="30" cy="20" r="4" fill="#C86D51" />
                <circle cx="200" cy="68" r="4" fill="#C86D51" />
                <circle cx="370" cy="80" r="4" fill="#C86D51" />

                <g transform="translate(350, 60)">
                  <rect x="-35" y="-12" width="70" height="15" fill="#22C55E" rx="3" />
                  <text x="0" y="-2" fill="#FFFFFF" fontSize="7" fontWeight="bold" textAnchor="middle">CONVERGE</text>
                </g>
              </svg>
            </div>
            
            <div className="flex justify-center gap-6 text-[9px] font-semibold uppercase tracking-widest pt-2">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1.5 bg-primary"></span>
                <span className="text-primary">Buyer strategic Curve</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1.5 bg-secondary"></span>
                <span className="text-secondary">Vendor strategic Curve</span>
              </div>
            </div>
          </div>

          {/* Analysis info */}
          <div className="lg:col-span-5 space-y-6">
            <span className="text-[10px] font-semibold text-secondary uppercase tracking-widest">Post-Negotiation Review</span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-[-0.02em] text-primary leading-tight">Understand What Happened — Not Just Who Won</h2>
            <p className="text-xs sm:text-sm text-slategray leading-relaxed">
              Every completed simulation generates structured metrics. Review offer trajectories, concession trends, final agreement value margins, and overall strategy scores.
            </p>
            
            <div className="grid grid-cols-2 gap-4 text-xs font-semibold pt-2">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-accent shrink-0 mt-0.5" />
                <div>
                  <span className="text-primary block font-semibold uppercase text-[10px] tracking-wider">Concession Curves</span>
                  <span className="text-slategray text-[10px] font-normal">Audit total values conceded in each turn.</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-accent shrink-0 mt-0.5" />
                <div>
                  <span className="text-primary block font-semibold uppercase text-[10px] tracking-wider">Agreement Rates</span>
                  <span className="text-slategray text-[10px] font-normal">Track standard convergence rates.</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 10 — AGREEMENT & DEADLOCK */}
      <section 
        ref={sectionRefs.states}
        className={`bg-white border-y border-gray-150 py-20 px-6 md:px-12 transition-all duration-700 transform ${
          revealedSections.states ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
        }`}
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-5 space-y-6">
            <span className="text-[10px] font-semibold text-secondary uppercase tracking-widest">State Machine Outcomes</span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-[-0.02em] text-primary leading-tight">Conclude Negotiations in Three Distinct States</h2>
            <p className="text-xs sm:text-sm text-slategray leading-relaxed">
              Negotiation sessions terminate dynamically according to constraint rules, preventing infinite loops and recognizing natural limits.
            </p>

            <div className="space-y-4 pt-2">
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
                <CheckCircle2 className="text-green-600 shrink-0 mt-0.5" size={16} />
                <div className="text-xs">
                  <strong className="text-green-800 block uppercase font-semibold tracking-wider text-[10px]">Agreement Reached</strong>
                  <span className="text-green-700">Both agents accept compatible pricing or timeline bounds.</span>
                </div>
              </div>
              
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-start gap-3">
                <AlertTriangle className="text-orange-600 shrink-0 mt-0.5" size={16} />
                <div className="text-xs">
                  <strong className="text-orange-800 block uppercase font-semibold tracking-wider text-[10px]">Deadlock Triggered</strong>
                  <span className="text-orange-700">Conversations stall when positions exceed reservation limits.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Visual State progression */}
          <div className="lg:col-span-7 bg-warmpearl border border-gray-200 rounded-2xl p-6 flex flex-col justify-center min-h-[260px]">
            <div className="text-[9px] font-bold text-slategray uppercase tracking-wider mb-6">Simulation Lifecycle progression</div>
            
            <div className="flex flex-col md:flex-row items-center justify-around gap-4 w-full">
              
              <div className={`bg-white border border-gray-250 p-4 rounded-xl shadow-sm text-center min-w-[130px] transition-all duration-300 ${
                activeStateStep === 0 ? 'ring-2 ring-accent scale-[1.02] shadow-md' : 'opacity-70'
              }`}>
                <span className="text-[8px] text-slate-500 uppercase block">Phase 01</span>
                <strong className="text-[11px] text-primary block mt-0.5 uppercase tracking-wide">Configuration</strong>
              </div>

              <div className="w-1 md:w-8 h-8 md:h-1 border-l-2 md:border-l-0 md:border-t-2 border-dashed border-gray-300"></div>

              <div className={`bg-white border border-gray-250 p-4 rounded-xl shadow-sm text-center min-w-[130px] transition-all duration-300 ${
                activeStateStep === 1 ? 'ring-2 ring-accent scale-[1.02] shadow-md' : 'opacity-70'
              }`}>
                <span className="text-[8px] text-slate-500 uppercase block">Phase 02</span>
                <strong className="text-[11px] text-primary block mt-0.5 uppercase tracking-wide">Orchestration</strong>
              </div>

              <div className="w-1 md:w-8 h-8 md:h-1 border-l-2 md:border-l-0 md:border-t-2 border-dashed border-gray-300"></div>

              <div className="flex flex-col gap-2 min-w-[130px]">
                <div className={`bg-green-100 border border-green-200 p-2.5 rounded-lg text-center font-semibold text-[10px] text-green-800 uppercase tracking-wider transition-all duration-300 ${
                  activeStateStep === 2 ? 'ring-2 ring-green-500 scale-[1.05] shadow-md' : 'opacity-60'
                }`}>
                  ✔ Agreement
                </div>
                <div className={`bg-orange-100 border border-orange-200 p-2.5 rounded-lg text-center font-semibold text-[10px] text-orange-800 uppercase tracking-wider transition-all duration-300 ${
                  activeStateStep === 3 ? 'ring-2 ring-orange-500 scale-[1.05] shadow-md' : 'opacity-60'
                }`}>
                  ✖ Deadlock
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* SECTION 11 — WHY THIS PLATFORM */}
      <section 
        ref={sectionRefs.whyUs}
        className={`py-20 px-6 md:px-12 max-w-7xl mx-auto space-y-12 transition-all duration-700 transform ${
          revealedSections.whyUs ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
        }`}
      >
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-[-0.02em] text-primary">Built for Repeatable Enterprise Practice</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="border border-gray-250 rounded-xl p-5 hover:shadow-md bg-white space-y-3">
            <h3 className="text-xs font-semibold text-primary uppercase tracking-wider border-b border-gray-150 pb-2">Repeatable Cases</h3>
            <p className="text-[11px] text-slategray leading-relaxed">
              Verify strategic variations across identical baseline parameters to discover repeatable negotiation formulas.
            </p>
          </div>
          <div className="border border-gray-250 rounded-xl p-5 hover:shadow-md bg-white space-y-3">
            <h3 className="text-xs font-semibold text-primary uppercase tracking-wider border-b border-gray-150 pb-2">Configurable LLMs</h3>
            <p className="text-[11px] text-slategray leading-relaxed">
              Calibrate the system roles, private boundaries, financial budget thresholds, and personality constraints.
            </p>
          </div>
          <div className="border border-gray-250 rounded-xl p-5 hover:shadow-md bg-white space-y-3">
            <h3 className="text-xs font-semibold text-primary uppercase tracking-wider border-b border-gray-150 pb-2">Enterprise Depth</h3>
            <p className="text-[11px] text-slategray leading-relaxed">
              Simulations focus on structured business situations like vendor contracts, job offers, or budget allocations.
            </p>
          </div>
          <div className="border border-gray-250 rounded-xl p-5 hover:shadow-md bg-white space-y-3">
            <h3 className="text-xs font-semibold text-primary uppercase tracking-wider border-b border-gray-150 pb-2">Observable Data</h3>
            <p className="text-[11px] text-slategray leading-relaxed">
              Every run logs the transcript data alongside concession curves and agreement likelihood values.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 12 — FINAL CTA */}
      <section className="bg-primary text-white py-20 px-6 md:px-12 border-t border-primary-dark relative overflow-hidden">
        {!prefersReducedMotion && (
          <div 
            className="absolute w-96 h-96 rounded-full bg-secondary/5 blur-3xl -bottom-24 -right-24 pointer-events-none"
            style={{ transform: `scale(${1 + scrollY * 0.00015})` }}
          ></div>
        )}

        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-[-0.02em] text-white leading-tight">Ready to Run Your First Negotiation?</h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
            Choose a scenario, configure your agents, and start a negotiation simulation sandbox immediately.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <button 
              onClick={() => navigate('/login?tab=signup')}
              className="px-6 py-3.5 bg-accent hover:bg-accent-dark text-white font-semibold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-98 border-none cursor-pointer"
            >
              Start Simulation
            </button>
            <button 
              onClick={() => scrollToAnchor('scenarios')}
              className="px-6 py-3.5 bg-primary-dark hover:bg-white/5 border border-primary-dark hover:border-gray-600 text-white font-semibold text-xs uppercase tracking-wider rounded-xl transition-all"
            >
              Explore Scenarios
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 13 — FOOTER / About Help Anchor */}
      <footer id="about-help" ref={sectionRefs['about-help']} className="bg-white border-t border-gray-150 py-16 px-6 md:px-12 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slategray font-semibold">
          
          <div className="flex items-center gap-3">
            <Logo variant="icon-only" size={32} />
            <div className="flex flex-col">
              <span className="text-primary font-semibold uppercase text-[10px] tracking-wider leading-none">AI-Driven Multi-Agent</span>
              <span className="text-secondary font-semibold text-[8px] uppercase tracking-widest mt-1 leading-none">Negotiation Training Platform</span>
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6 uppercase text-[9px] tracking-widest font-semibold">
            <button onClick={() => scrollToAnchor('features')} className="hover:text-primary cursor-pointer transition-colors bg-transparent border-none">Features</button>
            <button onClick={() => scrollToAnchor('how-it-works')} className="hover:text-primary cursor-pointer transition-colors bg-transparent border-none">How It Works</button>
            <button onClick={() => scrollToAnchor('scenarios')} className="hover:text-primary cursor-pointer transition-colors bg-transparent border-none">Scenarios</button>
            <button onClick={() => navigate('/login')} className="hover:text-primary cursor-pointer transition-colors bg-transparent border-none">Login</button>
            <button onClick={() => navigate('/login?tab=signup')} className="hover:text-primary cursor-pointer transition-colors bg-transparent border-none">Start Simulation</button>
          </div>
          
          <div className="flex gap-4">
            <span className="hover:text-primary cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-primary cursor-pointer transition-colors">Terms of Service</span>
          </div>

        </div>
      </footer>

    </div>
  );
};
