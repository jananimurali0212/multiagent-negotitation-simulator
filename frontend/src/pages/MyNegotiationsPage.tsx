import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { negotiationService } from '../services/negotiationService';
import { RecentNegotiationItem } from '../data/mockNegotiations';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Skeleton } from '../components/common/LoadingSkeleton';
import {
  History,
  Search,
  Filter,
  PlusCircle,
  ArrowRight,
  Clock,
  Layers,
  FileText,
  Play
} from 'lucide-react';

export function MyNegotiationsPage() {
  const [negotiations, setNegotiations] = useState<RecentNegotiationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modeFilter, setModeFilter] = useState('all');

  useEffect(() => {
    async function loadData() {
      try {
        const list = await negotiationService.getRecentNegotiations();
        setNegotiations(list);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const filtered = negotiations.filter((item) => {
    const matchesSearch =
      item.scenarioName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.finalOutcome.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesMode = modeFilter === 'all' || item.mode === modeFilter;
    return matchesSearch && matchesStatus && matchesMode;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="My Negotiations History"
        description="Comprehensive log of all autonomous simulation runs and interactive practice sessions."
        actions={
          <Link to="/new-negotiation/scenario">
            <Button size="sm" leftIcon={<PlusCircle className="w-4 h-4" />}>
              New Negotiation
            </Button>
          </Link>
        }
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'My Negotiations' },
        ]}
      />

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by scenario or settlement outcome..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-medium text-slate-700 focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="in progress">In Progress</option>
            <option value="deadlocked">Deadlocked</option>
          </select>

          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-medium text-slate-700 focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Modes</option>
            <option value="simulation">Simulation</option>
            <option value="practice">Practice</option>
          </select>
        </div>
      </div>

      {/* Table Card */}
      <Card className="border-slate-200">
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-10 rounded-lg" />
              <Skeleton className="h-10 rounded-lg" />
              <Skeleton className="h-10 rounded-lg" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No negotiations match your search criteria.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200/80">
                <tr>
                  <th className="py-3.5 px-6">Scenario & Terms</th>
                  <th className="py-3.5 px-4">Mode</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Rounds & Time</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <p className="font-bold text-slate-900">{item.scenarioName}</p>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">{item.finalOutcome}</p>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant={item.mode === 'simulation' ? 'ai' : 'info'} size="sm">
                        {item.mode === 'simulation' ? 'Simulation' : 'Practice'}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 font-mono text-slate-500">{item.date}</td>
                    <td className="py-4 px-4">
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
                    <td className="py-4 px-4 font-mono text-slate-500">
                      {item.rounds} rounds ({item.duration})
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        to={
                          item.status === 'In Progress'
                            ? `/negotiation/${item.mode}/${item.id}`
                            : `/negotiation/${item.id}/report`
                        }
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800"
                      >
                        {item.status === 'In Progress' ? (
                          <>
                            <Play className="w-3.5 h-3.5 fill-blue-600" /> Resume Arena
                          </>
                        ) : (
                          <>
                            <FileText className="w-3.5 h-3.5" /> View Report
                          </>
                        )}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
