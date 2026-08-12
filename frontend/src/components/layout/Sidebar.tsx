import React from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Layers,
  History,
  BarChart3,
  Settings,
  HelpCircle,
  Bot,
  PlusCircle,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { Badge } from '../common/Badge';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Scenarios', path: '/scenarios', icon: Layers },
  { name: 'My Negotiations', path: '/my-negotiations', icon: History },
  { name: 'Reports & Analytics', path: '/reports', icon: BarChart3 },
  { name: 'Settings', path: '/settings', icon: Settings },
  { name: 'Help & Support', path: '/help', icon: HelpCircle },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200/80 h-screen sticky top-0 shrink-0 select-none">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shrink-0">
          <Bot className="w-5 h-5" />
        </div>
        <div className="flex flex-col overflow-hidden">
          <span className="font-bold text-slate-900 text-sm truncate tracking-tight">
            Multi-Agent Negotiation
          </span>
          <span className="text-[10px] text-slate-500 font-medium">Simulator v1.0</span>
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="p-4">
        <Link
          to="/new-negotiation/scenario"
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-medium text-sm shadow-sm transition-all hover:shadow hover:scale-[1.01] active:scale-[0.99]"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Negotiation</span>
        </Link>
      </div>

      {/* Main Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Main Menu
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.path ||
            (item.path === '/scenarios' && location.pathname.startsWith('/new-negotiation'));

          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50/80 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </div>
              {isActive && <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
            </NavLink>
          );
        })}
      </nav>

      {/* Live AI Status Widget */}
      <div className="p-4 border-t border-slate-100">
        <div className="p-3 bg-gradient-to-br from-slate-50 to-indigo-50/40 rounded-xl border border-indigo-100/60">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-indigo-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> AI Engine Ready
            </span>
            <Badge variant="ai" size="sm">
              3 Scenarios
            </Badge>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed mb-2">
            Simulate or practice with multi-stakeholder autonomous agents.
          </p>
          <Link
            to="/scenarios"
            className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            Explore scenarios <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
