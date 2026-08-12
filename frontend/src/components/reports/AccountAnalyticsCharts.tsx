import React from 'react';
import { AgreementTrendItem, OutcomeBreakdownItem } from '../../types/report';
import { Card, CardHeader, CardTitle, CardContent } from '../common/Card';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { TrendingUp, PieChart as PieIcon } from 'lucide-react';

interface AccountAnalyticsChartsProps {
  trendData: AgreementTrendItem[];
  outcomesData: OutcomeBreakdownItem[];
}

export function AccountAnalyticsCharts({ trendData, outcomesData }: AccountAnalyticsChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Agreement Rate Trend */}
      <Card className="border-slate-200 lg:col-span-2">
        <CardHeader className="py-4 px-6 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span>Historical Agreement Rate Trend (%)</span>
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Settlement success percentage tracked across simulation cohorts.
            </p>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  domain={[50, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                  formatter={(val: any) => [`${val}% Agreement Rate`, '']}
                />
                <Line
                  type="monotone"
                  dataKey="rate"
                  name="Agreement Rate"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#2563eb' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Outcome Breakdown Donut */}
      <Card className="border-slate-200">
        <CardHeader className="py-4 px-6 border-b border-slate-100">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-indigo-600" />
            <span>Outcomes Breakdown</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6 flex flex-col items-center justify-center">
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={outcomesData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {outcomesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                  formatter={(value: any, name: any) => [`${value} Sessions`, name]}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
