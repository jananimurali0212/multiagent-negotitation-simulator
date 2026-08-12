import React from 'react';
import { NegotiationTelemetry } from '../../types/negotiation';
import { Card, CardHeader, CardTitle, CardContent } from '../common/Card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from 'recharts';
import { TrendingUp, Percent, DollarSign, Target, Activity } from 'lucide-react';

interface NegotiationMetricsProps {
  telemetry: NegotiationTelemetry;
  scenarioNumericScale?: { min: number; max: number; unit: string; format: (val: number) => string };
}

export function NegotiationMetrics({ telemetry }: NegotiationMetricsProps) {
  const { agreementLikelihood, offerGap, bestOffer, target, concessionTrend, round } = telemetry;

  // Extract agent line keys dynamically
  const agentKeys = concessionTrend.length > 0
    ? Object.keys(concessionTrend[0]).filter((k) => k !== 'round')
    : [];

  const lineColors = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6'];

  return (
    <div className="space-y-4">
      {/* Agreement Likelihood Gauge */}
      <Card className="border-slate-200">
        <CardHeader className="py-3 px-4 bg-slate-50/60 border-b border-slate-100 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <Percent className="w-3.5 h-3.5 text-blue-600" />
            <span>Agreement Likelihood</span>
          </CardTitle>
          <span className="text-sm font-extrabold font-mono text-blue-600">
            {agreementLikelihood}%
          </span>
        </CardHeader>
        <CardContent className="p-4">
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                agreementLikelihood >= 80
                  ? 'bg-emerald-500'
                  : agreementLikelihood >= 50
                  ? 'bg-blue-500'
                  : 'bg-amber-500'
              }`}
              style={{ width: `${agreementLikelihood}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-1.5">
            <span>Low (Impasse)</span>
            <span>Converging</span>
            <span>Deal Imminent</span>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards: Offer Gap & Best Position */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Current Offer Gap
          </span>
          <div className="flex items-center gap-1 text-base font-bold text-slate-900 font-mono">
            <Activity className="w-4 h-4 text-amber-500" />
            <span>{offerGap}</span>
          </div>
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Leading Offer
          </span>
          <div className="flex items-center gap-1 text-base font-bold text-slate-900 font-mono">
            <DollarSign className="w-4 h-4 text-emerald-500" />
            <span className="truncate">{bestOffer}</span>
          </div>
        </div>
      </div>

      {/* Recharts Concession Trend Chart */}
      <Card className="border-slate-200">
        <CardHeader className="py-3 px-4 bg-slate-50/60 border-b border-slate-100 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
            <span>Concession Trend (Rounds)</span>
          </CardTitle>
          <span className="text-[11px] text-slate-500 font-medium">Round {round}</span>
        </CardHeader>
        <CardContent className="p-3 pt-4">
          {concessionTrend.length > 0 ? (
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={concessionTrend} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="round"
                    stroke="#94a3b8"
                    fontSize={10}
                    tickLine={false}
                    tickFormatter={(val) => `R${val}`}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={10}
                    tickLine={false}
                    tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '11px',
                    }}
                    formatter={(value: any) => [`$${Number(value).toLocaleString()}`, '']}
                    labelFormatter={(lbl) => `Round ${lbl}`}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '10px', paddingTop: '6px' }}
                    iconType="circle"
                  />
                  {agentKeys.map((agentKey, idx) => (
                    <Line
                      key={agentKey}
                      type="monotone"
                      dataKey={agentKey}
                      name={agentKey.replace(' Agent', '')}
                      stroke={lineColors[idx % lineColors.length]}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-xs text-slate-400">
              Awaiting round 1 concession exchange...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
