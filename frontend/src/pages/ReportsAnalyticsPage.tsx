import React, { useEffect, useState } from 'react';
import { reportService } from '../services/reportService';
import { AccountAnalytics } from '../types/report';
import { PageHeader } from '../components/common/PageHeader';
import { AccountAnalyticsCharts } from '../components/reports/AccountAnalyticsCharts';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Skeleton } from '../components/common/LoadingSkeleton';
import {
  RotateCcw,
  Filter,
  BarChart3,
  TrendingUp,
  Percent,
  Clock,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  ShieldCheck,
  Award
} from 'lucide-react';

export function ReportsAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AccountAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('Last 30 Days');
  const [scenarioFilter, setScenarioFilter] = useState('all');
  const [modeFilter, setModeFilter] = useState('all');

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const data = await reportService.getAccountAnalytics({
        dateRange,
        scenarioId: scenarioFilter,
        mode: modeFilter,
      });
      setAnalytics(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, scenarioFilter, modeFilter]);

  if (isLoading || !analytics) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Reports & Analytics Hub"
        description="Comprehensive account-level benchmarks, settlement rates, stakeholder satisfaction scores, and tactical training insights."
        actions={
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            onClick={fetchAnalytics}
          >
            Refresh Analytics
          </Button>
        }
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Reports & Analytics' },
        ]}
      />

      {/* Filter Bar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <Filter className="w-4 h-4 text-blue-600" />
          <span>Filters:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Date Range */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-medium text-slate-700 focus:ring-2 focus:ring-blue-500"
          >
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>Last 90 Days</option>
            <option>All Time</option>
          </select>

          {/* Scenario Filter */}
          <select
            value={scenarioFilter}
            onChange={(e) => setScenarioFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-medium text-slate-700 focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Scenarios</option>
            <option value="vendor-pricing-negotiation">Vendor Pricing</option>
            <option value="job-offer-negotiation">Job Offer</option>
            <option value="project-budget-allocation">Budget Allocation</option>
          </select>

          {/* Mode Filter */}
          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-medium text-slate-700 focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Modes</option>
            <option value="simulation">Simulation (AI vs AI)</option>
            <option value="practice">Practice (Human vs AI)</option>
          </select>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Total Simulations
              </span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">
                {analytics.totalSimulations}
              </div>
              <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" /> +14.2% MoM
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Win / Deal Rate
              </span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">
                {analytics.winRate}%
              </div>
              <span className="text-[11px] text-slate-500 font-medium mt-1 block">
                40 settled agreements
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Average Agreement
              </span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">
                {analytics.averageAgreement}%
              </div>
              <span className="text-[11px] text-blue-600 font-medium mt-1 block">
                Target satisfaction
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Percent className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Avg. Duration
              </span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">
                {analytics.averageDuration}
              </div>
              <span className="text-[11px] text-slate-500 font-medium mt-1 block">
                ~6.2 turns per session
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <AccountAnalyticsCharts
        trendData={analytics.agreementTrend}
        outcomesData={analytics.outcomesBreakdown}
      />

      {/* Aggregate Performance Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Table 1: Performance by Agent */}
        <Card className="border-slate-200">
          <CardHeader className="py-4 px-6 border-b border-slate-100">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-600" />
              <span>Stakeholder Agent Performance Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4">Agent Role</th>
                  <th className="py-3 px-3">Sessions</th>
                  <th className="py-3 px-3">Avg. Satisfaction</th>
                  <th className="py-3 px-4 text-right">Concession Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {analytics.performanceByAgent.map((agent) => (
                  <tr key={agent.agentName} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-bold text-slate-900">{agent.agentName}</td>
                    <td className="py-3 px-3 font-mono text-slate-500">{agent.totalSessions}</td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-600">
                      {agent.avgSatisfaction}%
                    </td>
                    <td className="py-3 px-4 font-mono text-right font-bold text-blue-600">
                      {agent.avgConcessionControl}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Table 2: Scenario Performance */}
        <Card className="border-slate-200">
          <CardHeader className="py-4 px-6 border-b border-slate-100">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              <span>Scenario Performance Breakdown</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4">Scenario</th>
                  <th className="py-3 px-3">Runs</th>
                  <th className="py-3 px-3">Agreement %</th>
                  <th className="py-3 px-4 text-right">Avg. Rounds</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {analytics.scenarioPerformance.map((sc) => (
                  <tr key={sc.scenarioName} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-bold text-slate-900">{sc.scenarioName}</td>
                    <td className="py-3 px-3 font-mono text-slate-500">{sc.count}</td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-600">
                      {sc.agreementRate}%
                    </td>
                    <td className="py-3 px-4 font-mono text-right text-slate-700">
                      {sc.avgRounds} rounds
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Insights & Recommendations (Not a gamified skill tree) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <Card className="border-slate-200">
          <CardHeader className="py-4 px-6 bg-emerald-50/40 border-b border-emerald-100">
            <CardTitle className="text-sm font-bold text-emerald-950 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Demonstrated Negotiation Strengths</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ul className="space-y-3">
              {analytics.strengths.map((str, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Areas to Improve */}
        <Card className="border-slate-200">
          <CardHeader className="py-4 px-6 bg-amber-50/40 border-b border-amber-100">
            <CardTitle className="text-sm font-bold text-amber-950 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-600" />
              <span>Training Recommendations & Improvement Areas</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ul className="space-y-3">
              {analytics.areasToImprove.map((area, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>{area}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
