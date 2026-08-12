import React from 'react';
import { ConcessionDataPoint } from '../../types/negotiation';
import { Card, CardHeader, CardTitle, CardContent } from '../common/Card';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { TrendingDown } from 'lucide-react';

interface ConcessionChartProps {
  data: ConcessionDataPoint[];
}

export function ConcessionChart({ data }: ConcessionChartProps) {
  const agentKeys = data.length > 0
    ? Object.keys(data[0]).filter((k) => k !== 'round')
    : [];

  const colors = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6'];

  return (
    <Card className="border-slate-200">
      <CardHeader className="py-4 px-6 border-b border-slate-100 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-blue-600" />
            <span>Concession Timeline & Convergence Trajectory</span>
          </CardTitle>
          <p className="text-xs text-slate-500 mt-0.5">
            Round-by-round valuation movement mapping how party positions converged toward settlement.
          </p>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="round"
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                tickFormatter={(r) => `Round ${r}`}
              />
              <YAxis
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  fontSize: '12px',
                }}
                formatter={(value: any) => [`$${Number(value).toLocaleString()}`, '']}
                labelFormatter={(lbl) => `Round ${lbl}`}
              />
              <Legend wrapperStyle={{ paddingTop: '12px' }} iconType="circle" />
              {agentKeys.map((key, idx) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={key}
                  stroke={colors[idx % colors.length]}
                  strokeWidth={2.5}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
