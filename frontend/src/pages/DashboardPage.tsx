import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useNegotiationSetupStore } from '../store/negotiationSetupStore';
import { negotiationService } from '../services/negotiationService';
import { RecentNegotiationItem } from '../data/mockNegotiations';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { DashboardSkeleton } from '../components/common/LoadingSkeleton';
import {
  PlusCircle,
  Play,
  Users2,
  BarChart3,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  Activity,
  Layers,
  Sparkles,
  ChevronRight,
  HelpCircle,
  FileText
} from 'lucide-react';

export function DashboardPage() {
  const { user } = useAuthStore();
  const { setScenarioById, setMode } = useNegotiationSetupStore();
  const navigate = useNavigate();

  const [recentNegotiations, setRecentNegotiations] = useState<RecentNegotiationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const list = await negotiationService.getRecentNegotiations();
        setRecentNegotiations(list);
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const handleQuickAction = (scenarioId: string, mode: 'simulation' | 'practice') => {
    setScenarioById(scenarioId);
    setMode(mode);
    navigate('/new-negotiation/agents');
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        {/* Background glow overlay */}
        <div className="absolute right-0 top-0 w-96 h-full bg-gradient-to-l from-blue-500/20 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/30 text-blue-200 text-xs font-semibold backdrop-blur-xs border border-blue-400/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Multi-Agent Negotiation Simulator</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.name || 'Alex Mercer'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              Execute autonomous AI agent simulations or practice interactive deal negotiations against intelligent counterpart personas.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <Link to="/new-negotiation/scenario">
              <Button
                size="md"
                className="w-full sm:w-auto bg-white text-slate-900 hover:bg-slate-100 font-bold shadow-md"
                leftIcon={<PlusCircle className="w-4 h-4 text-blue-600" />}
              >
                + New Negotiation
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Negotiations */}
        <Card className="border-slate-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Total Negotiations
              </span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">48</div>
              <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" /> +6 this week
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Simulations Run */}
        <Card className="border-slate-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Simulations Run
              </span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">32</div>
              <span className="text-[11px] text-slate-500 font-medium mt-1 block">
                AI vs AI autonomous
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Practice Sessions */}
        <Card className="border-slate-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Practice Sessions
              </span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">16</div>
              <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3 h-3" /> 87.5% Win rate
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Reports Generated */}
        <Card className="border-slate-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Reports Generated
              </span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">48</div>
              <span className="text-[11px] text-blue-600 font-medium mt-1 block">
                Full analytics exported
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Action Launchers */}
      <Card className="border-slate-200">
        <CardHeader className="py-4 px-6 border-b border-slate-100 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Quick Negotiation Actions</span>
          </CardTitle>
          <Link to="/scenarios" className="text-xs font-semibold text-blue-600 hover:underline">
            View All Scenarios
          </Link>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Action 1 */}
            <div
              onClick={() => navigate('/new-negotiation/scenario')}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-blue-50/40 hover:border-blue-300 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Layers className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">Choose Scenario</h4>
                <p className="text-xs text-slate-500">
                  Select from Vendor Pricing, Job Offer, or Budget Allocation.
                </p>
              </div>
              <span className="text-xs font-semibold text-blue-600 flex items-center gap-1 mt-4">
                Explore catalog <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>

            {/* Action 2 */}
            <div
              onClick={() => handleQuickAction('vendor-pricing-negotiation', 'simulation')}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-indigo-50/40 hover:border-indigo-300 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Play className="w-4 h-4 fill-indigo-700 text-indigo-700" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">Start Simulation</h4>
                <p className="text-xs text-slate-500">
                  Launch autonomous Vendor vs Buyer procurement battle.
                </p>
              </div>
              <span className="text-xs font-semibold text-indigo-600 flex items-center gap-1 mt-4">
                Configure & run <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>

            {/* Action 3 */}
            <div
              onClick={() => handleQuickAction('job-offer-negotiation', 'practice')}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-emerald-50/40 hover:border-emerald-300 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Users2 className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">Start Practice Mode</h4>
                <p className="text-xs text-slate-500">
                  Negotiate your salary and terms directly against the Recruiter AI.
                </p>
              </div>
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 mt-4">
                Begin practice <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>

            {/* Action 4 */}
            <div
              onClick={() => navigate('/reports')}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-violet-50/40 hover:border-violet-300 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">Reports & Analytics</h4>
                <p className="text-xs text-slate-500">
                  Inspect aggregate concession curves and stakeholder scores.
                </p>
              </div>
              <span className="text-xs font-semibold text-violet-600 flex items-center gap-1 mt-4">
                View analytics <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Grid: Recent Negotiations & Training Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Negotiations Table (2 cols) */}
        <Card className="border-slate-200 lg:col-span-2">
          <CardHeader className="py-4 px-6 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold">Recent Negotiations</CardTitle>
              <p className="text-xs text-slate-500">
                Latest simulated and interactive negotiation runs.
              </p>
            </div>
            <Link to="/my-negotiations" className="text-xs font-semibold text-blue-600 hover:underline">
              View History
            </Link>
          </CardHeader>

          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-6">Scenario</th>
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {recentNegotiations.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-6">
                      <p className="font-bold text-slate-900">{item.scenarioName}</p>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">{item.finalOutcome}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={item.mode === 'simulation' ? 'ai' : 'info'} size="sm">
                        {item.mode === 'simulation' ? 'Simulation' : 'Practice'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          item.status === 'Completed'
                            ? 'success'
                            : item.status === 'In Progress'
                            ? 'info'
                            : 'warning'
                        }
                        size="sm"
                      >
                        {item.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      {item.duration}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <Link
                        to={
                          item.status === 'In Progress'
                            ? `/negotiation/${item.mode}/${item.id}`
                            : `/negotiation/${item.id}/report`
                        }
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                      >
                        {item.status === 'In Progress' ? 'Resume Arena' : 'View Report'}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Learning / Progress Section (No XP / Game Mechanics) */}
        <Card className="border-slate-200">
          <CardHeader className="py-4 px-6 border-b border-slate-100">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span>Training Benchmarks</span>
            </CardTitle>
            <p className="text-xs text-slate-500">
              Aggregated performance metrics across all scenarios.
            </p>
          </CardHeader>

          <CardContent className="p-6 space-y-4">
            {/* Overall Agreement Rate */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700">Overall Agreement Rate</span>
                <span className="font-mono font-bold text-slate-900">88.5%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '88.5%' }} />
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Target benchmark: 80%+
              </span>
            </div>

            {/* Practice Sessions Success */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700">Practice Session Win Rate</span>
                <span className="font-mono font-bold text-slate-900">87.5%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full" style={{ width: '87.5%' }} />
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                14 agreements out of 16 sessions
              </span>
            </div>

            {/* Average Duration */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Avg. Negotiation Duration</span>
              </div>
              <span className="font-mono font-bold text-slate-900 text-xs">4m 38s</span>
            </div>

            {/* Deadlock Frequency */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-slate-400" />
                <span>Deadlock Occurrence</span>
              </div>
              <span className="font-mono font-bold text-amber-600 text-xs">10.4% (5 / 48)</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
