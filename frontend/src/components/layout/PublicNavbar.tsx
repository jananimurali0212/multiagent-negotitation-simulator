import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '../common/Button';

export function PublicNavbar() {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
            <Bot className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 text-base leading-tight tracking-tight">
              Multi-Agent Negotiation Simulator
            </span>
            <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-blue-600" /> AI-Powered Training & Simulation
            </span>
          </div>
        </Link>

        {/* Public Navigation Links */}
        <nav className="hidden md:flex items-center space-x-7 text-sm font-medium text-slate-600">
          <a href="#features" className="hover:text-blue-600 transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="hover:text-blue-600 transition-colors">
            How It Works
          </a>
          <a href="#about" className="hover:text-blue-600 transition-colors">
            About
          </a>
          <Link to="/help" className="hover:text-blue-600 transition-colors">
            Help
          </Link>
        </nav>

        {/* Auth CTA */}
        <div className="flex items-center gap-3">
          <Link to="/auth?mode=login">
            <Button variant="ghost" size="sm">
              Login
            </Button>
          </Link>
          <Link to="/auth?mode=signup">
            <Button size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
