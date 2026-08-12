import React from 'react';
import { CoachingTip } from '../../types/negotiation';
import { Card, CardHeader, CardTitle, CardContent } from '../common/Card';
import { Sparkles, Lightbulb, ShieldAlert, TrendingUp } from 'lucide-react';

interface PracticeAssistantProps {
  tips: CoachingTip[];
}

export function PracticeAssistant({ tips }: PracticeAssistantProps) {
  const getTipIcon = (type: CoachingTip['type']) => {
    switch (type) {
      case 'concession':
        return <TrendingUp className="w-3.5 h-3.5 text-blue-600 shrink-0" />;
      case 'risk':
        return <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />;
      case 'strategy':
      default:
        return <Lightbulb className="w-3.5 h-3.5 text-violet-600 shrink-0" />;
    }
  };

  return (
    <Card className="border-slate-200">
      <CardHeader className="py-3 px-4 bg-gradient-to-r from-violet-50/50 to-indigo-50/50 border-b border-slate-100 flex flex-row items-center justify-between">
        <CardTitle className="text-xs font-bold uppercase tracking-wider text-violet-950 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-violet-600" />
          <span>Real-Time Practice Assistant</span>
        </CardTitle>
        <span className="text-[10px] font-bold text-violet-700 bg-violet-100/80 px-2 py-0.5 rounded-full">
          AI Coach
        </span>
      </CardHeader>

      <CardContent className="p-3.5 space-y-2.5 max-h-60 overflow-y-auto">
        {tips.length === 0 ? (
          <div className="text-center py-4 text-xs text-slate-400">
            Submit your first proposal or message to receive tailored tactical coaching tips.
          </div>
        ) : (
          tips.map((tip) => (
            <div
              key={tip.id}
              className="p-2.5 bg-violet-50/30 rounded-xl border border-violet-100 flex items-start gap-2 animate-in fade-in duration-200"
            >
              <div className="w-5 h-5 rounded-md bg-white border border-violet-200 flex items-center justify-center mt-0.5 shrink-0 shadow-2xs">
                {getTipIcon(tip.type)}
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {tip.message}
                </p>
                <span className="text-[10px] text-slate-400 mt-1 block font-mono">
                  {tip.timestamp}
                </span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
