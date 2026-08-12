import React from 'react';
import { HumanPerformanceMetrics } from '../../types/negotiation';
import { Card, CardHeader, CardTitle, CardContent } from '../common/Card';
import { Award, ShieldCheck, MessageSquare, Flame } from 'lucide-react';

interface PerformancePanelProps {
  metrics: HumanPerformanceMetrics;
}

export function PerformancePanel({ metrics }: PerformancePanelProps) {
  const items = [
    {
      label: 'Concession Control',
      value: metrics.concessionControl,
      icon: <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />,
      desc: 'Discipline in protecting anchor terms',
    },
    {
      label: 'Argument Strength',
      value: metrics.argumentStrength,
      icon: <Flame className="w-3.5 h-3.5 text-amber-600" />,
      desc: 'Business justification & leverage',
    },
    {
      label: 'Active Listening',
      value: metrics.activeListening,
      icon: <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />,
      desc: 'Responsiveness to counterparty goals',
    },
    {
      label: 'Deal Progress',
      value: metrics.dealProgress,
      icon: <Award className="w-3.5 h-3.5 text-violet-600" />,
      desc: 'Advancement toward mutual settlement',
    },
  ];

  return (
    <Card className="border-slate-200">
      <CardHeader className="py-3 px-4 bg-slate-50/60 border-b border-slate-100 flex flex-row items-center justify-between">
        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
          <Award className="w-3.5 h-3.5 text-blue-600" />
          <span>Your Performance Scores</span>
        </CardTitle>
        <span className="text-[11px] font-bold text-slate-500">Live Evaluation</span>
      </CardHeader>

      <CardContent className="p-4 space-y-3.5">
        {items.map((item) => (
          <div key={item.label}>
            <div className="flex items-center justify-between text-xs mb-1">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                {item.icon}
                <span>{item.label}</span>
              </div>
              <span className="font-mono font-bold text-slate-900">{item.value}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${item.value}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">{item.desc}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
