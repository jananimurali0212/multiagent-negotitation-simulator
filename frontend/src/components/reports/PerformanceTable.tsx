import React from 'react';
import { AgentPerformanceMetric } from '../../types/report';
import { Card, CardHeader, CardTitle, CardContent } from '../common/Card';
import { Badge } from '../common/Badge';
import { Users, Award, ShieldCheck } from 'lucide-react';

interface PerformanceTableProps {
  metrics: AgentPerformanceMetric[];
}

export function PerformanceTable({ metrics }: PerformanceTableProps) {
  return (
    <Card className="border-slate-200">
      <CardHeader className="py-4 px-6 border-b border-slate-100 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <Award className="w-4 h-4 text-indigo-600" />
          <span>Agent Stakeholder Performance Evaluation</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200/80">
            <tr>
              <th className="py-3.5 px-6">Agent & Role</th>
              <th className="py-3.5 px-4">Persona</th>
              <th className="py-3.5 px-4">Objective Satisfaction</th>
              <th className="py-3.5 px-4">Concession Control</th>
              <th className="py-3.5 px-6">Final Settlement Position</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {metrics.map((m) => (
              <tr key={m.agentId} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold text-xs">
                      {m.agentName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{m.agentName}</p>
                      <p className="text-[11px] text-slate-500 font-medium">{m.role}</p>
                    </div>
                  </div>
                </td>

                <td className="py-4 px-4">
                  <Badge
                    variant={
                      m.personality === 'Aggressive'
                        ? 'destructive'
                        : m.personality === 'Collaborative'
                        ? 'info'
                        : 'success'
                    }
                    size="sm"
                  >
                    {m.personality}
                  </Badge>
                </td>

                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full"
                        style={{ width: `${m.objectiveSatisfaction}%` }}
                      />
                    </div>
                    <span className="font-mono font-bold text-slate-900">
                      {m.objectiveSatisfaction}%
                    </span>
                  </div>
                </td>

                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full"
                        style={{ width: `${m.concessionControl}%` }}
                      />
                    </div>
                    <span className="font-mono font-bold text-slate-900">
                      {m.concessionControl}%
                    </span>
                  </div>
                </td>

                <td className="py-4 px-6 font-mono font-semibold text-slate-900">
                  {m.finalPosition}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
