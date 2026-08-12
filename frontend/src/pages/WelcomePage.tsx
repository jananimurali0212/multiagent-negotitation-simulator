import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PublicNavbar } from '../components/layout/PublicNavbar';
import { Button } from '../components/common/Button';
import { Card, CardContent } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import {
  ArrowRight,
  Bot,
  Sliders,
  Activity,
  BarChart2,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Zap,
  Play,
  Users2
} from 'lucide-react';

export function WelcomePage() {
  // Interactive mini-negotiation demo widget step
  const [demoStep, setDemoStep] = useState(0);

  const demoTurns = [
    {
      speaker: 'Buyer Agent',
      role: 'Procurement Buyer',
      avatarBg: 'bg-blue-600 text-white',
      message: 'Could you meet us at $42,000 for the 120-seat enterprise bundle?',
      badge: 'Opening Offer: $42,000',
      badgeVariant: 'info' as const,
      likelihood: 35,
    },
    {
      speaker: 'Vendor Agent',
      role: 'Enterprise Seller',
      avatarBg: 'bg-emerald-600 text-white',
      message: 'At that price we cannot maintain the requested Tier-1 service level. We can propose $48,000 with full SLA.',
      badge: 'Counteroffer: $48,000',
      badgeVariant: 'warning' as const,
      likelihood: 52,
    },
    {
      speaker: 'Buyer Agent',
      role: 'Procurement Buyer',
      avatarBg: 'bg-blue-600 text-white',
      message: 'If you include free dedicated onboarding, we can bridge to $45,500.',
      badge: 'Concession: $45,500',
      badgeVariant: 'ai' as const,
      likelihood: 78,
    },
    {
      speaker: 'Vendor Agent',
      role: 'Enterprise Seller',
      avatarBg: 'bg-emerald-600 text-white',
      message: 'With annual prepayment and dedicated onboarding, $46,000 is agreed.',
      badge: 'Deal Finalized: $46,000',
      badgeVariant: 'success' as const,
      likelihood: 100,
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setDemoStep((prev) => (prev + 1) % demoTurns.length);
    }, 3800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-blue-100">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 overflow-hidden border-b border-slate-200/60">
        {/* Subtle Background Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-blue-100/40 rounded-full blur-3xl pointer-events-none -z-0" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[250px] bg-violet-100/40 rounded-full blur-3xl pointer-events-none -z-0" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            {/* Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold mb-6 shadow-2xs animate-fade-in">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Multi-Agent Negotiation Training Platform</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6">
              Practice Smarter.{' '}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Negotiate Better.
              </span>
            </h1>

            {/* Supporting Subtext */}
            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed font-normal mb-8 max-w-2xl mx-auto">
              Experience realistic business negotiations powered by intelligent multi-agent simulations.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-14">
              <Link to="/auth?mode=signup">
                <Button size="lg" className="w-full sm:w-auto shadow-md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Get Started
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Learn More
                </Button>
              </a>
              <Link to="/negotiation/simulation/sim-demo">
                <Button variant="ai" size="lg" className="w-full sm:w-auto" leftIcon={<Play className="w-4 h-4 fill-white" />}>
                  Launch Interactive Demo
                </Button>
              </Link>
            </div>
          </div>

          {/* Miniature Live Negotiation Preview Card */}
          <div className="max-w-3xl mx-auto">
            <Card className="border-slate-200/90 shadow-xl overflow-hidden backdrop-blur-sm bg-white/95">
              {/* Demo Card Header */}
              <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-slate-800">
                    Live Arena Preview: Vendor Pricing Negotiation
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-slate-500">
                    Step {demoStep + 1} of {demoTurns.length}
                  </span>
                  <Badge variant="ai" size="sm">
                    Simulation Mode
                  </Badge>
                </div>
              </div>

              {/* Demo Content */}
              <CardContent className="p-6 space-y-4">
                {/* Active Exchange */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 min-h-[110px] flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${demoTurns[demoStep].avatarBg}`}
                      >
                        {demoTurns[demoStep].speaker.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900">
                          {demoTurns[demoStep].speaker}
                        </span>
                        <span className="text-[10px] text-slate-500 ml-1.5 font-medium">
                          ({demoTurns[demoStep].role})
                        </span>
                      </div>
                    </div>

                    <Badge variant={demoTurns[demoStep].badgeVariant} size="sm">
                      {demoTurns[demoStep].badge}
                    </Badge>
                  </div>

                  <p className="text-sm text-slate-800 font-medium leading-relaxed italic">
                    "{demoTurns[demoStep].message}"
                  </p>
                </div>

                {/* Progress Indicators */}
                <div className="pt-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1.5">
                    <span>Agreement Likelihood Convergence</span>
                    <span className="font-mono text-blue-600 font-bold">
                      {demoTurns[demoStep].likelihood}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-700"
                      style={{ width: `${demoTurns[demoStep].likelihood}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section id="features" className="py-20 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              Core Capabilities
            </span>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight mt-1.5">
              Built for Realistic Negotiation Training
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Designed with enterprise behavioral models and multi-stakeholder dynamics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1: Multi-Agent Simulation */}
            <Card className="border-slate-200 hover:border-blue-300 transition-all hover:shadow-md">
              <CardContent className="p-6">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                  <Bot className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">
                  Multi-Agent Simulation
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Observe autonomous AI agents represent competing stakeholder objectives and trade-offs in real time.
                </p>
              </CardContent>
            </Card>

            {/* Feature 2: Customizable Agent Personas */}
            <Card className="border-slate-200 hover:border-blue-300 transition-all hover:shadow-md">
              <CardContent className="p-6">
                <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center mb-4">
                  <Sliders className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">
                  Customizable Personas
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Assign Aggressive, Collaborative, or Risk-Averse strategies to test outcomes across various personality pairings.
                </p>
              </CardContent>
            </Card>

            {/* Feature 3: Real-Time Negotiation */}
            <Card className="border-slate-200 hover:border-blue-300 transition-all hover:shadow-md">
              <CardContent className="p-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">
                  Real-Time Negotiation
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Interact directly in Practice Mode (Human vs AI) with live coaching feedback on concessions and framing.
                </p>
              </CardContent>
            </Card>

            {/* Feature 4: Outcome Analysis */}
            <Card className="border-slate-200 hover:border-blue-300 transition-all hover:shadow-md">
              <CardContent className="p-6">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                  <BarChart2 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">
                  Outcome Analysis
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Receive structured post-mortem reports detailing concession curves, satisfaction scores, and deadlock resolutions.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-slate-50 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              Methodology
            </span>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight mt-1.5">
              How the Platform Works
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              From scenario selection to structured outcome reporting in four streamlined steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-sm flex items-center justify-center mb-4">
                1
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-1.5">Choose Scenario & Mode</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Select from Vendor Pricing, Job Offer, or Project Budget Allocation, and choose Simulation (AI vs AI) or Practice (Human vs AI).
              </p>
            </div>

            <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold text-sm flex items-center justify-center mb-4">
                2
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-1.5">Configure Personas</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Set stakeholder behavioral strategies (Aggressive, Collaborative, Risk-Averse) while respecting strict scenario-defined limits.
              </p>
            </div>

            <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-violet-600 text-white font-bold text-sm flex items-center justify-center mb-4">
                3
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-1.5">Engage & Analyze</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Watch live concession dynamics in the arena, resolve deadlocks, and export detailed analytical outcome post-mortems.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="about" className="bg-white py-10 mt-auto border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-slate-800">Multi-Agent Negotiation Simulator</span>
            <span>•</span>
            <span>AI-Driven Training Architecture</span>
          </div>

          <div className="flex items-center space-x-6">
            <Link to="/help" className="hover:text-slate-900">
              User Documentation
            </Link>
            <Link to="/settings" className="hover:text-slate-900">
              Platform Settings
            </Link>
            <Link to="/auth?mode=login" className="hover:text-slate-900">
              Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
