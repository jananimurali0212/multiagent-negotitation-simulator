import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  HelpCircle,
  LogOut,
  User as UserIcon,
  ChevronDown,
  Menu,
  Sparkles,
  Play
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface TopbarProps {
  onOpenMobileNav: () => void;
}

export function Topbar({ onOpenMobileNav }: TopbarProps) {
  const { user, logout } = useAuthStore();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/auth?mode=login');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-30 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
      {/* Left: Mobile Menu Toggle & Brand Mobile */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileNav}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
          aria-label="Open mobile navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
          <span className="font-medium text-slate-800">Multi-Agent Negotiation Simulator</span>
          <span className="text-slate-300">•</span>
          <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            System Operational
          </span>
        </div>
      </div>

      {/* Right: Notifications, Help, User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Launch Demo Simulation */}
        <Link
          to="/negotiation/simulation/sim-demo"
          className="hidden md:inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg transition-colors"
        >
          <Play className="w-3.5 h-3.5 fill-blue-600 text-blue-600" />
          <span>Live Arena Demo</span>
        </Link>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 relative transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 uppercase">Notifications</span>
                <span className="text-[11px] text-blue-600 cursor-pointer hover:underline">Mark all read</span>
              </div>
              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                <div className="p-3 hover:bg-slate-50 transition-colors cursor-pointer">
                  <p className="text-xs font-medium text-slate-800">
                    Vendor Pricing Simulation completed
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Agreement reached at $46,000 in Round 4.
                  </p>
                  <span className="text-[10px] text-slate-400 mt-1 inline-block">10 minutes ago</span>
                </div>
                <div className="p-3 hover:bg-slate-50 transition-colors cursor-pointer">
                  <p className="text-xs font-medium text-slate-800">
                    New Coaching Tip in Practice Mode
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Your concession control score improved to 88%.
                  </p>
                  <span className="text-[10px] text-slate-400 mt-1 inline-block">1 hour ago</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Help Link */}
        <Link
          to="/help"
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          aria-label="Help and Support"
        >
          <HelpCircle className="w-4 h-4" />
        </Link>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
            aria-label="User menu"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-200 overflow-hidden shrink-0 border border-slate-300">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                  {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AM'}
                </div>
              )}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-900 leading-none">
                {user?.name || 'Alex Mercer'}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5">
                {user?.role || 'Lead Negotiator'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900">{user?.name || 'Alex Mercer'}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email || 'alex.mercer@negotiate.ai'}</p>
              </div>
              <Link
                to="/settings"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <UserIcon className="w-4 h-4 text-slate-400" />
                <span>Account Settings</span>
              </Link>
              <Link
                to="/help"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Sparkles className="w-4 h-4 text-slate-400" />
                <span>Platform Guide</span>
              </Link>
              <div className="border-t border-slate-100 my-1" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors text-left"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
