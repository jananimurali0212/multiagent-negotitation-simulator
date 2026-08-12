import React from 'react';
import { FinalTerm } from '../../types/report';
import { Card, CardHeader, CardTitle, CardContent } from '../common/Card';
import { CheckCircle2, FileCheck } from 'lucide-react';

interface AgreementBreakdownProps {
  summary: string;
  terms: FinalTerm[];
  status: string;
}

export function AgreementBreakdown({ summary, terms, status }: AgreementBreakdownProps) {
  const isAgreed = status === 'completed' || status === 'agreement';

  return (
    <Card className="border-slate-200">
      <CardHeader className="py-4 px-6 border-b border-slate-100 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-emerald-600" />
          <span>Final Agreement Terms & Summary</span>
        </CardTitle>
        <span
          className={`text-xs font-bold px-2.5 py-1 rounded-md ${
            isAgreed ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}
        >
          {isAgreed ? 'Mutual Deal Executed' : 'Deadlock / Ended'}
        </span>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        <p className="text-sm text-slate-700 leading-relaxed font-medium bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
          {summary}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {terms.map((term, idx) => (
            <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                {term.label}
              </span>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{term.value}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
