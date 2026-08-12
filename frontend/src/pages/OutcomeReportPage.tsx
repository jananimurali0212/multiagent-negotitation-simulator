import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { reportService } from '../services/reportService';
import { OutcomeReport } from '../types/report';
import { PageHeader } from '../components/common/PageHeader';
import { ConcessionChart } from '../components/reports/ConcessionChart';
import { PerformanceTable } from '../components/reports/PerformanceTable';
import { AgreementBreakdown } from '../components/reports/AgreementBreakdown';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Skeleton } from '../components/common/LoadingSkeleton';
import {
  Download,
  FileSpreadsheet,
  PlusCircle,
  LayoutDashboard,
  Sparkles,
  Clock,
  Layers,
  Award,
  CheckCircle2,
  AlertOctagon,
  TrendingUp,
  FileCheck
} from 'lucide-react';

export function OutcomeReportPage() {
  const { sessionId = 'sim-10492' } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<OutcomeReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingCSV, setIsExportingCSV] = useState(false);

  useEffect(() => {
    async function loadReport() {
      try {
        const data = await reportService.getOutcomeReport(sessionId);
        setReport(data);
      } finally {
        setIsLoading(false);
      }
    }
    loadReport();
  }, [sessionId]);

  const handleDownloadPDF = async () => {
    setIsExportingPDF(true);
    await reportService.downloadPDF(sessionId);
    setIsExportingPDF(false);
  };

  const handleDownloadCSV = async () => {
    setIsExportingCSV(true);
    await reportService.downloadCSV(sessionId);
    setIsExportingCSV(false);
  };

  if (isLoading || !report) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-44 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  const isAgreed = report.status === 'completed' || report.status === 'agreement';

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        title="Session Outcome & Performance Report"
        description={`Post-mortem analytics, concession trajectories, and stakeholder metrics for session ${report.sessionId}.`}
        badge={
          <Badge variant={isAgreed ? 'success' : 'warning'} size="md">
            {isAgreed ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Agreement Reached
              </>
            ) : (
              <>
                <AlertOctagon className="w-3.5 h-3.5 mr-1" /> Deadlock Concluded
              </>
            )}
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              isLoading={isExportingCSV}
              leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
              onClick={handleDownloadCSV}
            >
              Export CSV
            </Button>
            <Button
              size="sm"
              isLoading={isExportingPDF}
              leftIcon={<Download className="w-4 h-4" />}
              onClick={handleDownloadPDF}
            >
              Download PDF Report
            </Button>
          </div>
        }
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'My Negotiations', href: '/my-negotiations' },
          { label: 'Outcome Report' },
        ]}
      />

      {/* Session Metadata KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Scenario
          </span>
          <p className="text-sm font-bold text-slate-900 mt-0.5 truncate">{report.scenarioName}</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Mode
          </span>
          <p className="text-sm font-bold text-slate-900 mt-0.5 capitalize">
            {report.mode === 'simulation' ? 'AI vs AI Simulation' : 'Human vs AI Practice'}
          </p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Rounds Elapsed
          </span>
          <p className="text-sm font-bold text-slate-900 mt-0.5 font-mono">
            {report.roundsElapsed} <span className="text-slate-400 font-normal">/ {report.maxRounds}</span>
          </p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Duration
          </span>
          <p className="text-sm font-bold text-slate-900 mt-0.5 font-mono">{report.duration}</p>
        </div>
      </div>

      {/* Agreement Terms Breakdown */}
      <AgreementBreakdown
        summary={report.agreementSummary}
        terms={report.finalTerms}
        status={report.status}
      />

      {/* Concession Timeline Chart (Recharts) */}
      <ConcessionChart data={report.concessionHistory} />

      {/* Agent Performance Table */}
      <PerformanceTable metrics={report.agentPerformance} />

      {/* Key Analytical Insights */}
      <Card className="border-slate-200">
        <CardHeader className="py-4 px-6 border-b border-slate-100 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-600" />
            <span>Key Analytical Insights & Findings</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6">
          <ul className="space-y-3">
            {report.keyInsights.map((insight, idx) => (
              <li key={idx} className="flex items-start gap-3 text-xs text-slate-700 leading-relaxed">
                <span className="w-5 h-5 rounded-full bg-violet-50 text-violet-700 border border-violet-200 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Navigation Footer */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <Link to="/dashboard">
          <Button variant="outline" size="sm" leftIcon={<LayoutDashboard className="w-4 h-4" />}>
            Back to Dashboard
          </Button>
        </Link>

        <div className="flex items-center gap-3">
          <Link to="/reports">
            <Button variant="ghost" size="sm">
              Global Account Analytics
            </Button>
          </Link>
          <Link to="/new-negotiation/scenario">
            <Button size="sm" rightIcon={<PlusCircle className="w-4 h-4" />}>
              Start New Negotiation
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
