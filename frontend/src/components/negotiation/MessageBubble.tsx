import React from 'react';
import { NegotiationMessage } from '../../types/negotiation';
import { Badge } from '../common/Badge';
import { Sparkles, DollarSign, UserCheck, Bot } from 'lucide-react';

interface MessageBubbleProps {
  message: NegotiationMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isHuman = message.isHuman;

  const getOfferBadge = () => {
    if (!message.offer) return null;
    const { type, value } = message.offer;

    switch (type) {
      case 'offer':
        return (
          <Badge variant="info" size="sm">
            <DollarSign className="w-3 h-3 mr-0.5" /> Opening Offer: {value}
          </Badge>
        );
      case 'counteroffer':
        return (
          <Badge variant="warning" size="sm">
            <DollarSign className="w-3 h-3 mr-0.5" /> Counteroffer: {value}
          </Badge>
        );
      case 'concession':
        return (
          <Badge variant="ai" size="sm">
            <Sparkles className="w-3 h-3 mr-0.5" /> Concession: {value}
          </Badge>
        );
      case 'final':
        return (
          <Badge variant="success" size="sm">
            <DollarSign className="w-3 h-3 mr-0.5" /> Final Proposal: {value}
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`p-4 rounded-xl border transition-all duration-150 ${
        isHuman
          ? 'bg-blue-50/40 border-blue-200/80 ml-6 sm:ml-12 shadow-xs'
          : 'bg-white border-slate-200 shadow-xs mr-6 sm:mr-12'
      }`}
    >
      {/* Header Info */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div
            className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
              isHuman ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            {isHuman ? <UserCheck className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900">{message.agentName}</span>
            <span className="text-[11px] text-slate-500 ml-1.5 font-medium">({message.agentRole})</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-400">Round {message.round}</span>
          <span className="text-slate-300">•</span>
          <span className="text-[10px] text-slate-400">{message.timestamp}</span>
        </div>
      </div>

      {/* Message Content */}
      <p className="text-sm text-slate-800 leading-relaxed font-normal mb-2.5">
        "{message.content}"
      </p>

      {/* Offer Badges */}
      {message.offer && <div className="mb-2">{getOfferBadge()}</div>}

      {/* High-Level Decision Summary (Strictly no raw chain-of-thought) */}
      {message.decisionSummary && (
        <div className="p-2 bg-slate-50 rounded-lg border border-slate-200/60 text-[11px] text-slate-600 flex items-start gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-violet-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-700">Decision Summary: </span>
            <span>{message.decisionSummary}</span>
          </div>
        </div>
      )}
    </div>
  );
}
